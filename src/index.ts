// ============================================================
// Jerry Combined API - Main Router Entry Point
// Cloudflare Workers
//
// 路由结构：
//   GET /              → 导航页（HTML）
//   GET /ba            → BA 随机图文档（HTML）
//   GET /ba/*          → BA 随机图 API
//   GET /bing          → Bing 壁纸文档（HTML）
//   GET /bing/*        → Bing 壁纸 API
//   GET /hitokoto      → 一言文档（HTML）
//   GET /hitokoto/*    → 一言 API
//   GET /hotsearch     → 热搜文档（HTML）
//   GET /hotsearch/*   → 热搜 API
//   GET /weather       → 天气文档（HTML）
//   GET /weather/*     → 天气 API
//   GET /music         → 音乐文档（HTML）
//   GET /music/*       → 网易云音乐 API
//   GET /health        → 健康检查
//   GET /favicon.ico   → 重定向到图标
// ============================================================

import { navPage, baDocPage, bingDocPage, hitokotoDocPage, hotsearchDocPage, weatherDocPage, musicDocPage } from './pages'
import { handleBa } from './ba/handler'
import { handleBing } from './bing/handler'
import { handleHitokoto } from './hitokoto/handler'
import { handleHotSearch } from './hotsearch/handler'
import { handleWeather } from './weather/handler'
import { handleMusic } from './music/handler'
import { jsonResponse, htmlResponse, errorResponse, handleOptions } from './shared'

export default {
  async fetch(request: Request, env: any): Promise<Response> {
    const url = new URL(request.url)

    // Handle CORS preflight for all routes
    if (request.method === 'OPTIONS') {
      return handleOptions()
    }

    // Normalize path: remove trailing slashes (except root)
    let path = url.pathname.replace(/\/+$/, '')
    if (path === '') path = '/'

    // ─── Favicon ───
    if (path === '/favicon.ico') {
      return new Response(null, {
        status: 302,
        headers: { Location: 'https://img.jerry-nis.top/d8703c5c-4c4a-49cc-bd94-3363c9eda2d8.png' },
      })
    }

    // ─── Health check ───
    if (path === '/health') {
      return jsonResponse({
        status: 'ok',
        service: 'jerry-combined-api',
        version: '1.1.0',
        timestamp: new Date().toISOString(),
        modules: ['ba', 'bing', 'hitokoto', 'hotsearch', 'weather', 'music'],
      })
    }

    // ─── Documentation / Navigation pages (exact matches) ───
    if (path === '/') {
      return htmlResponse(navPage())
    }
    if (path === '/ba') {
      return htmlResponse(baDocPage())
    }
    if (path === '/bing') {
      return htmlResponse(bingDocPage())
    }
    if (path === '/hitokoto') {
      return htmlResponse(hitokotoDocPage())
    }
    if (path === '/hotsearch') {
      return htmlResponse(hotsearchDocPage())
    }
    if (path === '/weather') {
      return htmlResponse(weatherDocPage())
    }
    if (path === '/music') {
      return htmlResponse(musicDocPage())
    }

    // ─── API routes ───
    if (path.startsWith('/ba/')) {
      return handleBa(request, url, env)
    }
    if (path.startsWith('/bing/')) {
      return handleBing(request, url, env)
    }
    if (path.startsWith('/hitokoto/')) {
      return handleHitokoto(request, url, env)
    }
    if (path.startsWith('/hotsearch/')) {
      return handleHotSearch(request, url, env)
    }
    if (path.startsWith('/weather/')) {
      return handleWeather(request, url, env)
    }
    if (path.startsWith('/music/')) {
      return handleMusic(request, url, env)
    }

    // ─── 404 ───
    if (request.headers.get('accept')?.includes('text/html')) {
      return htmlResponse(navPage(), 200)
    }
    return errorResponse('Not Found. Visit / for API documentation.', 404)
  },
}
