import { jsonResponse, errorResponse, handleOptions } from '../shared'
import { createRequest, buildCookie } from './request'
import { routes } from './routes'
import * as kuwo from './kuwo'
import * as neteasevip from './neteasevip'
import * as unblock from './unblock'

// Merge query params and body params
function mergeParams(query: Record<string, any>, body: Record<string, any>): Record<string, any> {
  const params: Record<string, any> = {}
  if (query) {
    for (const key in query) {
      if (key === 'cookie' || key === 'timestamp' || key === 'realIP') continue
      params[key] = query[key]
    }
  }
  if (body) {
    for (const key in body) {
      if (key === 'cookie' || key === 'timestamp' || key === 'realIP') continue
      params[key] = body[key]
    }
  }
  return params
}

// Convert string ids "1,2,3" to array [1,2,3]
function parseIds(value: any): any {
  if (Array.isArray(value)) return value
  if (typeof value === 'string' && value.includes(',')) {
    return value.split(',').map((s) => s.trim())
  }
  return value
}

// Get song name and artist from NetEase for Kuwo fallback
async function getNetEaseSongDetail(songId: string | number): Promise<{ name: string; artists: string[] } | null> {
  try {
    const path = `/api/v3/song/detail?c=[{"id":"${songId}"}]`
    const url = `https://music.163.com${path}`
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
        Referer: 'https://music.163.com',
      },
    })
    const data = await response.text()
    const json = JSON.parse(data)
    if (json.songs && json.songs[0]) {
      const song = json.songs[0]
      return {
        name: song.name,
        artists: song.ar ? song.ar.map((a: any) => a.name) : [],
      }
    }
    return null
  } catch {
    return null
  }
}

// Check if any song in the response needs unblocking
// Uses the same logic as api-enhanced's ENABLE_GENERAL_UNBLOCK:
// freeTrialInfo !== null, missing URL, trial URL, or VIP/album fee
function needsUnblockCheck(result: any): boolean {
  if (!result.body || !result.body.data) return false
  const songs = Array.isArray(result.body.data) ? result.body.data : [result.body.data]
  return songs.some((s: any) => unblock.needsUnblock(s))
}

// Apply VIP fallback: multi-source unblock first, then eapi, then Kuwo
// Priority: unblock sources (full songs) > eapi+os=pc > trial URL > Kuwo
async function applyVipFallback(result: any, originalIds: any[], userCookie: string): Promise<any> {
  if (!result.body || !result.body.data) return result

  const songs = Array.isArray(result.body.data) ? result.body.data : [result.body.data]

  for (let i = 0; i < songs.length; i++) {
    const song = songs[i]

    if (!unblock.needsUnblock(song)) {
      // Song is already playable (not a trial)
      if (song.url) song.source = 'netease'
      continue
    }

    // Strategy 1: Multi-source unblock (gets FULL song from third-party APIs)
    // This is the primary method - returns complete songs from NetEase CDN
    const unblockResult = await unblock.matchID(song.id)
    if (unblockResult) {
      song.url = unblockResult.url
      song.br = 320000
      song.size = 0
      song.type = 'mp3'
      song.code = 200
      song.source = 'unblock'
      song.sourceType = unblockResult.source
      song.freeTrialInfo = null
      continue
    }

    // Strategy 2: Try NetEase eapi + os=pc (desktop client simulation)
    // May return full song if user has VIP cookie, or trial clip otherwise
    const neteaseResult = await neteasevip.getVipUrl(song.id, userCookie)
    if (neteaseResult && !unblock.isTrialUrl(neteaseResult.url)) {
      song.url = neteaseResult.url
      song.br = neteaseResult.br
      song.size = neteaseResult.size
      song.type = neteaseResult.type
      song.code = 200
      song.source = 'netease'
      song.sourceType = 'eapi-pc'
      song.md5 = neteaseResult.md5
      song.freeTrialInfo = null
      continue
    }

    // Strategy 3: Kuwo fallback (may return different version, last resort)
    const detail = await getNetEaseSongDetail(song.id)
    if (detail) {
      const kuwoResult = await kuwo.getSongUrl(detail.name, detail.artists)
      if (kuwoResult) {
        song.url = kuwoResult.url
        song.br = kuwoResult.br
        song.type = kuwoResult.type
        song.code = 200
        song.source = 'kuwo'
        song.sourceName = kuwoResult.name
        song.sourceArtist = kuwoResult.artist
        song.matchScore = kuwoResult.matchScore
        song.freeTrialInfo = null
        continue
      }
    }

    // Strategy 4: If we still have a trial URL from eapi, use it (better than nothing)
    if (neteaseResult && neteaseResult.url) {
      song.url = neteaseResult.url
      song.br = neteaseResult.br
      song.code = 200
      song.source = 'netease'
      song.sourceType = 'eapi-pc-trial'
      song.message = 'VIP歌曲仅可播放30秒试听片段，完整歌曲需登录VIP账号'
      continue
    }

    // All strategies failed
    if (!song.url) {
      song.source = 'netease'
      song.message = 'VIP歌曲无法获取：所有音源均未返回可用链接'
    }
  }

  result.body.data = Array.isArray(result.body.data) ? songs : songs[0]
  return result
}

/**
 * Main handler function for Cloudflare Workers
 * Handles all /music/* routes
 *
 * @param request - The incoming Request object
 * @param url - The parsed URL object
 * @param env - Environment variables (from wrangler.toml [vars] or secrets)
 */
export async function handleMusic(request: Request, url: URL, env: any): Promise<Response> {
  // Handle CORS preflight
  if (request.method === 'OPTIONS') {
    return handleOptions()
  }

  // Set useFlac from env before any unblock logic runs
  const useFlac = env.DISABLE_FLAC !== 'true'
  unblock.setUseFlac(useFlac)

  // Extract route from path: /music/song/url -> song/url
  let route = url.pathname.replace(/^\/music\//, '').replace(/^\//, '')

  // Remove trailing slash
  route = route.replace(/\/$/, '')

  if (!route) {
    return errorResponse('Missing API route. Usage: /music/<route>', 400)
  }

  // Parse query parameters
  const query: Record<string, any> = {}
  url.searchParams.forEach((value, key) => {
    if (key === 'cookie' || key === 'realIP') {
      query[key] = value
    } else {
      // Handle array params (e.g. ids[]=1&ids[]=2)
      if (query[key]) {
        if (Array.isArray(query[key])) {
          query[key].push(value)
        } else {
          query[key] = [query[key], value]
        }
      } else {
        query[key] = value
      }
    }
  })

  // Parse body for POST requests
  let body: Record<string, any> = {}
  if (request.method === 'POST') {
    const contentType = request.headers.get('content-type') || ''
    const rawBody = await request.text()
    if (rawBody) {
      if (contentType.includes('application/json')) {
        try {
          body = JSON.parse(rawBody)
        } catch {
          // Ignore parse errors
        }
      } else {
        // Try form-encoded
        const params = new URLSearchParams(rawBody)
        params.forEach((value, key) => {
          body[key] = value
        })
      }
    }
  }

  // Merge params
  const data = mergeParams(query, body)

  // Parse ids arrays
  if (data.ids) {
    data.ids = parseIds(data.ids)
  }

  // Build cookie
  const cookieHeader = request.headers.get('cookie') || ''
  const queryCookie = query.cookie || body.cookie || ''
  const cookie = buildCookie(cookieHeader, queryCookie)
  const realIP = query.realIP || body.realIP || request.headers.get('x-real-ip') || undefined

  // Look up route configuration
  const routeConfig = routes[route]

  let apiUrl: string
  let cryptoType: string
  let dataToSend: Record<string, any>

  if (routeConfig) {
    // URL can be a string or a function that takes query data
    apiUrl = typeof routeConfig.url === 'function' ? routeConfig.url(data) : routeConfig.url
    cryptoType = routeConfig.crypto || 'weapi'

    // Apply data transformation if defined
    if (routeConfig.dataTransform) {
      dataToSend = routeConfig.dataTransform(data)
    } else {
      dataToSend = { ...data }
    }
  } else {
    // Default: /api/<route> with weapi encryption
    apiUrl = `/api/${route}`
    cryptoType = 'weapi'
    dataToSend = { ...data }
  }

  try {
    const result = await createRequest(request.method || 'GET', apiUrl, dataToSend, {
      cookie,
      crypto: cryptoType,
      realIP,
    })

    // VIP fallback: multi-source unblock for VIP/trial songs
    if ((route === 'song/url' || route === 'song/url/v1') && needsUnblockCheck(result)) {
      const songIds = dataToSend.ids || [data.id]
      await applyVipFallback(result, songIds, cookie)
    }

    // Build response with Set-Cookie headers from NetEase response
    // Use Headers.append() for multiple Set-Cookie headers (Cloudflare Workers requirement)
    if (result.cookie) {
      const cookieParts = result.cookie.split('; ').filter(Boolean)
      if (cookieParts.length > 0) {
        const response = jsonResponse(result.body, result.status || 200)
        const headers = new Headers(response.headers)
        cookieParts.forEach((c: string) => {
          headers.append('Set-Cookie', c + '; Path=/; HttpOnly; SameSite=Lax')
        })
        return new Response(response.body, { status: response.status, headers })
      }
    }

    return jsonResponse(result.body, result.status || 200)
  } catch (err: any) {
    return errorResponse(err.message || 'Internal Server Error', 500)
  }
}
