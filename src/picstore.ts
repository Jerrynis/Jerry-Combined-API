// ============================================================
// 图片仓库：jsdmirror(GitHub 镜像) 主源 + Cloudflare R2 回源
// 清单里只存相对路径，两个源共用（已核对 10103 张文件名 1:1 对应）
// ============================================================

export const PIC_MIRROR = 'https://cdn.jsdmirror.com/gh/Jerrynis/random-pic';
export const PIC_R2 = 'https://r2.jerrynis.com';

// 镜像热缓存 0.05–0.25 s、冷取 2–4 s（长尾十几秒），R2 稳定 0.9–2 s。
// 所以两边同时发、谁先回字节用谁：热镜像照样抢赢，冷取也不用排队等回源起步。
const MIRROR_TIMEOUT_MS = 8000;
const R2_TIMEOUT_MS = 12000;
const PROXY_TTL = 60 * 60;

interface Pic { res: Response; source: string; }

// 并发取多个源：任一成功即用，全部失败才返回 null。
function firstSuccess(tasks: Promise<Pic | null>[]): Promise<Pic | null> {
  return new Promise(resolve => {
    let pending = tasks.length;
    for (const task of tasks) {
      task.then(value => {
        if (value) resolve(value);
        else if (--pending === 0) resolve(null);
      });
    }
  });
}

async function fetchOrigin(url: string, timeoutMs: number): Promise<Response | null> {
  try {
    const res = await fetch(url, { cf: { timeout: timeoutMs } });
    if (!res.ok) {
      res.body?.cancel();
      return null;
    }
    return res;
  } catch {
    return null;
  }
}

function imageResponse(upstream: Response, source: string): Response {
  const h = new Headers(upstream.headers);
  h.delete('Set-Cookie');
  h.set('Content-Type', upstream.headers.get('Content-Type') || 'image/webp');
  // 随机端点禁止浏览器缓存，否则刷新不换图；服务端另按图片地址缓存字节
  h.set('Cache-Control', 'no-store');
  h.set('Access-Control-Allow-Origin', '*');
  h.set('X-Pic-Source', source);
  return new Response(upstream.body, { status: 200, headers: h });
}

// 同一张图在两源共用同一个缓存键（主源地址），回源命中的结果也能复用。
export async function servePic(relPath: string, ctx: ExecutionContext): Promise<Response> {
  const mirrorUrl = `${PIC_MIRROR}/${relPath}`;
  const cacheKey = new Request(mirrorUrl);
  const cache = caches.default;

  const hit = await cache.match(cacheKey);
  if (hit) return imageResponse(hit, 'cache');

  const mirrorP = fetchOrigin(mirrorUrl, MIRROR_TIMEOUT_MS).then(res => (res ? { res, source: 'mirror' } : null));
  const r2P = fetchOrigin(`${PIC_R2}/${relPath}`, R2_TIMEOUT_MS).then(res => (res ? { res, source: 'r2' } : null));
  const pick = await firstSuccess([mirrorP, r2P]);
  // 落败的那一路：字节不再需要，取消掉释放连接（R2 出口免费，多这一路不额外计费）
  for (const task of [mirrorP, r2P]) task.then(value => { if (value && value !== pick) value.res.body?.cancel(); });

  if (!pick) {
    // 两源都取不到：交回浏览器直连主源，至少还有机会拿到
    return new Response(null, {
      status: 302,
      headers: { Location: mirrorUrl, 'Cache-Control': 'no-store', 'Access-Control-Allow-Origin': '*' },
    });
  }

  const toCache = new Response(pick.res.body, {
    status: 200,
    headers: {
      'Content-Type': pick.res.headers.get('Content-Type') || 'image/webp',
      'Cache-Control': `public, max-age=${PROXY_TTL}`,
    },
  });
  ctx.waitUntil(cache.put(cacheKey, toCache.clone()));
  return imageResponse(toCache, pick.source);
}

// 本站完整链接：只回显调用方显式传的参数，作为 JSON 里的 url 返回。
export function selfUrl(request: Request, path: string, params: string[]): string {
  const url = new URL(request.url);
  const out = new URL(path, url.origin);
  for (const key of params) {
    const v = url.searchParams.get(key);
    if (v) out.searchParams.set(key, v);
  }
  return out.toString();
}
