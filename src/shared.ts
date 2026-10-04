// ============================================================
// Shared utilities for all API modules
// ============================================================

export const CORS_HEADERS: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Cookie',
};

export function jsonResponse(data: unknown, status = 200, extraHeaders: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', ...CORS_HEADERS, ...extraHeaders },
  });
}

export function htmlResponse(html: string, status = 200): Response {
  return new Response(html, {
    status,
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
}

export function errorResponse(message: string, status = 500): Response {
  return jsonResponse({ code: status, message }, status);
}

export function redirectResponse(url: string, cacheControl = 'no-store'): Response {
  return new Response(null, {
    status: 302,
    headers: { Location: url, 'Cache-Control': cacheControl, ...CORS_HEADERS },
  });
}

export function handleOptions(): Response {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

// Simple in-memory cache (Workers isolate may be reused)
interface CacheEntry<T> { data: T; expireAt: number; }
const cacheMap = new Map<string, CacheEntry<unknown>>();
// 上限，防止长生命周期 isolate 中缓存无限增长导致内存压力
const MAX_CACHE_ENTRIES = 500;

function evictExpired(): void {
  const now = Date.now();
  for (const [k, v] of cacheMap) {
    if (now > v.expireAt) cacheMap.delete(k);
  }
}

export function getCache<T>(key: string): T | null {
  const entry = cacheMap.get(key) as CacheEntry<T> | undefined;
  if (!entry) return null;
  if (Date.now() > entry.expireAt) {
    cacheMap.delete(key);
    return null;
  }
  return entry.data;
}

export function setCache<T>(key: string, data: T, ttlMs: number): void {
  cacheMap.set(key, { data, expireAt: Date.now() + ttlMs });
  if (cacheMap.size > MAX_CACHE_ENTRIES) {
    evictExpired();
    // 仍超限时删除最早写入的一批，保证有界
    if (cacheMap.size > MAX_CACHE_ENTRIES) {
      const overflow = cacheMap.size - MAX_CACHE_ENTRIES;
      let i = 0;
      for (const k of cacheMap.keys()) {
        if (i++ >= overflow) break;
        cacheMap.delete(k);
      }
    }
  }
}

// ─── Cloudflare 边缘缓存（Cache API）───
// 相比 isolate 内存缓存，caches.default 在同一 colo 的多个 isolate 间共享，
// 命中时无需重新执行 Worker 逻辑或回源，显著降低延迟与上游压力。
// 通过 Age 头实现近似 TTL 控制（Cache API 本身不支持按条目设置 TTL）。
export async function withEdgeCache(
  request: Request,
  ctx: ExecutionContext | undefined,
  ttlSeconds: number,
  factory: () => Promise<Response>,
): Promise<Response> {
  if (!ctx || request.method !== 'GET') return factory();

  const cache = caches.default;
  const keyReq = new Request(request.url, { method: 'GET', headers: request.headers });

  const hit = await cache.match(keyReq);
  if (hit) {
    const age = parseInt(hit.headers.get('Age') || '0', 10);
    if (age < ttlSeconds) {
      const h = new Headers(hit.headers);
      h.set('X-Cache', 'HIT');
      h.set('Cache-Control', `public, max-age=${ttlSeconds}`);
      return new Response(hit.body, { status: hit.status, headers: h });
    }
  }

  const resp = await factory();
  // 缓存 2xx 与可重定向的 3xx（如 302 跳转），使重定向响应也能在边缘命中、跳过回源
  if (resp.status >= 200 && resp.status < 400) {
    const h = new Headers(resp.headers);
    h.set('Cache-Control', `public, max-age=${ttlSeconds}`);
    h.set('X-Cache', 'MISS');
    const out = new Response(resp.body, { status: resp.status, headers: h });
    ctx.waitUntil(cache.put(keyReq, out.clone()));
    return out;
  }
  return resp;
}

// ─── 随机图片池工具（BA / 二次元共用）───
export function hashCode(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h >>> 0;
}

// seed 存在时按 seed 稳定挑图（同一值固定同一张），否则纯随机
export function pickFromPool(pool: string[], seed?: string): string {
  return seed
    ? pool[hashCode(seed) % pool.length]
    : pool[Math.floor(Math.random() * pool.length)];
}

export type Orientation = 'landscape' | 'portrait';

export function orientKey(o: string | null): Orientation | null {
  const v = (o || '').toLowerCase();
  if (v === 'landscape' || v === 'horizontal' || v === 'h' || v === '\u6a2a\u5c4f') return 'landscape';
  if (v === 'portrait' || v === 'vertical' || v === 'v' || v === 'p' || v === '\u7ad6\u5c4f') return 'portrait';
  return null;
}

// 按请求端信息判断方向：优先 Client Hints 视口，其次 User-Agent 设备类型。
export function autoOrientation(request: Request): Orientation {
  const vw = parseInt(request.headers.get('Sec-CH-Viewport-Width') || '', 10);
  const vh = parseInt(request.headers.get('Sec-CH-Viewport-Height') || '', 10);
  if (vw > 0 && vh > 0) return vw >= vh ? 'landscape' : 'portrait';
  const ua = (request.headers.get('User-Agent') || '').toLowerCase();
  const mobile = /android|iphone|ipod|windows phone|mobile/.test(ua);
  const tablet = /ipad|tablet|playbook|silk/.test(ua);
  if (mobile && !tablet) return 'portrait';
  return 'landscape';
}

// 显式指定横/竖屏时强制该方向，其余情况（不传、auto、无效值）按设备自动适配
export function resolveOrientation(orientation: string | null, request: Request): Orientation {
  const v = (orientation || '').toLowerCase();
  if (v === 'auto' || v === '\u81ea\u52a8') return autoOrientation(request);
  return orientKey(orientation) || autoOrientation(request);
}
