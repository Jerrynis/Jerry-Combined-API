// ============================================================
// 二次元随机图片 Handler
//  · 来源 R2 (r2.jerrynis.com)，横屏 1600 张 / 竖屏 1600 张
//  · 默认按设备自动适配横竖屏，orientation 可强制指定
// ============================================================

import { jsonResponse, errorResponse, pickFromPool, resolveOrientation, proxyImage, endpointUrl } from '../shared';
import { ANIME_LANDSCAPE } from './images-landscape';
import { ANIME_PORTRAIT } from './images-portrait';

export async function handleAnime(request: Request, url: URL, ctx: ExecutionContext): Promise<Response> {
  const subPath = url.pathname.replace(/^\/anime\/?/, '').toLowerCase();
  const orientation = url.searchParams.get('orientation');
  // 时间戳种子：提供 t 或 ts 时，同一值固定返回同一张图；缺省则随机
  const seed = url.searchParams.get('t') || url.searchParams.get('ts');

  const key = resolveOrientation(orientation, request);
  const pool = key === 'landscape' ? ANIME_LANDSCAPE : ANIME_PORTRAIT;

  // ── /anime/random 由 Worker 直接返回图片字节，地址不跳图床 ──
  if (subPath === 'random' || subPath === 'anime' || subPath === '') {
    return proxyImage(pickFromPool(pool, seed || undefined), ctx);
  }

  if (subPath === 'json') {
    return jsonResponse({
      code: 200,
      message: 'success',
      url: endpointUrl(url, '/anime/random', orientation, seed),
      type: 'image',
      orientation: key,
    });
  }

  return errorResponse(
    'Unknown anime endpoint: /anime/' + subPath + '. Available: /anime/random, /anime/json',
    404
  );
}
