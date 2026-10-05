// ============================================================
// 二次元随机图片 Handler
//  · 图片仓库（jsdmirror 主源 / R2 回源），横屏 6600 张 / 竖屏 1600 张
//  · 默认按设备自动适配横竖屏，orientation 可强制指定
//  · Worker 直出图片字节，不 302 跳转到图床域名
// ============================================================

import { jsonResponse, errorResponse, pickFromPool, resolveOrientation } from '../shared';
import { servePic, selfUrl } from '../picstore';
import { ANIME_LANDSCAPE } from './images-landscape';
import { ANIME_PORTRAIT } from './images-portrait';

export async function handleAnime(request: Request, url: URL, ctx: ExecutionContext): Promise<Response> {
  const subPath = url.pathname.replace(/^\/anime\/?/, '').toLowerCase();
  const orientation = url.searchParams.get('orientation');
  // 时间戳种子：提供 t 或 ts 时，同一值固定返回同一张图；缺省则随机
  const seed = url.searchParams.get('t') || url.searchParams.get('ts');

  const key = resolveOrientation(orientation, request);
  const pool = key === 'landscape' ? ANIME_LANDSCAPE : ANIME_PORTRAIT;

  if (subPath === 'random' || subPath === 'anime' || subPath === '') {
    return servePic(pickFromPool(pool, seed || undefined), ctx);
  }

  if (subPath === 'json') {
    return jsonResponse({
      code: 200,
      message: 'success',
      url: selfUrl(request, '/anime/random', ['orientation', 't', 'ts']),
      type: 'image',
      orientation: key,
    });
  }

  return errorResponse(
    'Unknown anime endpoint: /anime/' + subPath + '. Available: /anime/random, /anime/json',
    404
  );
}
