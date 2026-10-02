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
