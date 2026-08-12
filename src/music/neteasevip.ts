import { eapi, eapiDecrypt } from './crypto'

/**
 * NetEase VIP URL retrieval module
 *
 * Key discovery: Using eapi encryption with os=pc simulates the
 * NetEase desktop client, which can access VIP songs at 128kbps without
 * a VIP account. This returns the CORRECT original song directly from
 * NetEase, unlike third-party fallbacks that may return wrong versions.
 */

const UA_ANDROID = 'NeteaseMusic/9.1.65.240916182646(9001065);Dalvik/2.1.0 (Linux; U; Android 14)'

// Make HTTPS request using fetch and return { body, statusCode }
async function httpRequest(
  host: string,
  path: string,
  headers: Record<string, string>,
  body: string
): Promise<{ body: string; statusCode: number }> {
  const url = `https://${host}${path}`

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      ...headers,
    },
    body,
  })

  const responseBody = await response.text()
  return { body: responseBody, statusCode: response.status }
}

interface VipUrlResult {
  url: string
  br: number
  size: number
  type: string
  code: number
  source: string
  sourceType: string
  md5: string
  expiryTime: number
  time: number
  level?: string
}

/**
 * Try to get song URL from NetEase using eapi + os=pc (desktop client simulation)
 * This can access VIP songs at 128kbps without a VIP account.
 *
 * @param songId - Song ID
 * @param cookie - Optional user cookie (for higher quality if VIP)
 * @returns - Song URL data or null if failed
 */
export async function getVipUrl(songId: string | number, cookie = ''): Promise<VipUrlResult | null> {
  const apiUrl = '/api/song/enhance/player/url'
  const data = {
    ids: [String(songId)],
    br: 320000,
  }

  const encrypted = eapi(apiUrl, data)
  const body = new URLSearchParams(encrypted).toString()
  const eapiUrl = apiUrl.replace('/api/', '/eapi/')

  // Build cookie: user cookie + os=pc for desktop client simulation
  let reqCookie = cookie || ''
  if (reqCookie) {
    reqCookie += '; os=pc; appver=9.1.65.240916182646'
  } else {
    reqCookie = 'os=pc; appver=9.1.65.240916182646'
  }

  const result = await httpRequest('music.163.com', eapiUrl, {
    'User-Agent': UA_ANDROID,
    Referer: apiUrl,
    Origin: 'https://music.163.com',
    Cookie: reqCookie,
  }, body)

  let parsed: any
  try {
    parsed = JSON.parse(result.body)
  } catch {
    // eapi response is encrypted — decrypt it
    const decrypted = eapiDecrypt(result.body)
    if (decrypted) {
      try {
        parsed = JSON.parse(decrypted)
      } catch {
        return null
      }
    } else {
      return null
    }
  }

  if (parsed && parsed.data && Array.isArray(parsed.data) && parsed.data[0]) {
    const song = parsed.data[0]
    if (song.url && song.code === 200) {
      return {
        url: song.url,
        br: song.br,
        size: song.size || 0,
        type: song.type || 'mp3',
        code: 200,
        source: 'netease',
        sourceType: 'eapi-pc',
        md5: song.md5 || '',
        expiryTime: song.expi || 0,
        time: song.time || 0,
      }
    }
  }

  return null
}

/**
 * Try to get song URL from NetEase using eapi + os=pc with v1 endpoint
 * This supports quality levels (standard, exhigh, lossless, hires)
 *
 * @param songId - Song ID
 * @param level - Quality level: standard, exhigh, lossless, hires
 * @param cookie - Optional user cookie
 */
export async function getVipUrlV1(
  songId: string | number,
  level = 'standard',
  cookie = ''
): Promise<VipUrlResult | null> {
  const apiUrl = '/api/song/enhance/player/url/v1'
  const data = {
    ids: [String(songId)],
    level: level,
    encodeType: 'flac',
  }

  const encrypted = eapi(apiUrl, data)
  const body = new URLSearchParams(encrypted).toString()
  const eapiUrl = apiUrl.replace('/api/', '/eapi/')

  let reqCookie = cookie || ''
  if (reqCookie) {
    reqCookie += '; os=pc; appver=9.1.65.240916182646'
  } else {
    reqCookie = 'os=pc; appver=9.1.65.240916182646'
  }

  const result = await httpRequest('music.163.com', eapiUrl, {
    'User-Agent': UA_ANDROID,
    Referer: apiUrl,
    Origin: 'https://music.163.com',
    Cookie: reqCookie,
  }, body)

  let parsed: any
  try {
    parsed = JSON.parse(result.body)
  } catch {
    const decrypted = eapiDecrypt(result.body)
    if (decrypted) {
      try {
        parsed = JSON.parse(decrypted)
      } catch {
        return null
      }
    } else {
      return null
    }
  }

  if (parsed && parsed.data && Array.isArray(parsed.data) && parsed.data[0]) {
    const song = parsed.data[0]
    if (song.url && song.code === 200) {
      return {
        url: song.url,
        br: song.br,
        size: song.size || 0,
        type: song.type || 'mp3',
        code: 200,
        level: song.level || level,
        source: 'netease',
        sourceType: 'eapi-pc',
        md5: song.md5 || '',
        expiryTime: song.expi || 0,
        time: song.time || 0,
      }
    }
  }

  return null
}
