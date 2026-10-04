// ============================================================
// 二次元随机图片 Handler
//  · 来源 R2 (r2.jerrynis.com)，横屏 1600 张 / 竖屏 1600 张
//  · 默认按设备自动适配横竖屏，orientation 可强制指定
// ============================================================

import { redirectResponse, jsonResponse, errorResponse, pickFromPool, resolveOrientation } from '../shared';
import { ANIME_LANDSCAPE } from './images-landscape';
import { ANIME_PORTRAIT } from './images-portrait';

export async function handleAnime(request: Request, url: URL): Promise<Response> {
  const subPath = url.pathname.replace(/^\/anime\/?/, '').toLowerCase();
  const orientation = url.searchParams.get('orientation');
  // 时间戳种子：提供 t 或 ts 时，同一值固定返回同一张图；缺省则随机
  const seed = url.searchParams.get('t') || url.searchParams.get('ts') || undefined;

  if (subPath === 'random' || subPath === 'anime' || subPath === '') {
    const key = resolveOrientation(orientation, request);
    return redirectResponse(pickFromPool(key === 'landscape' ? ANIME_LANDSCAPE : ANIME_PORTRAIT, seed));
  }

  if (subPath === 'json') {
    const key = resolveOrientation(orientation, request);
    return jsonResponse({
      code: 200,
      message: 'success',
      url: pickFromPool(key === 'landscape' ? ANIME_LANDSCAPE : ANIME_PORTRAIT, seed),
      source: 'r2-cdn',
      orientation: key,
    });
  }

  return errorResponse(
    'Unknown anime endpoint: /anime/' + subPath + '. Available: /anime/random, /anime/json',
    404
  );
}
