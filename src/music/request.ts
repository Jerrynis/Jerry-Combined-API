import { weapi, eapi, eapiDecrypt, linuxapi } from './crypto'

const BASE_URL = 'music.163.com'

// Extract cookie value by name
export function getCookieValue(cookieStr: string, name: string): string {
  if (!cookieStr) return ''
  const match = cookieStr.match(new RegExp(`(?:^|;\\s*)${name}=([^;]+)`))
  return match ? match[1] : ''
}

// Build cookie string from raw cookie + query cookie param
export function buildCookie(rawCookie: string, queryCookie: string): string {
  let cookie = rawCookie || ''
  if (queryCookie) {
    // queryCookie can be "MUSIC_U=xxx; __csrf=yyy" format
    cookie = (cookie ? cookie + '; ' : '') + queryCookie
  }
  return cookie
}

// Extract Set-Cookie headers from a fetch Response and join them
function extractCookies(response: Response): string {
  // Try getSetCookie() first (modern fetch API, available in Cloudflare Workers runtime)
  // Cast to any because the type definitions may not include getSetCookie()
  let setCookies: string[] = []
  const headers = response.headers as any
  if (typeof headers.getSetCookie === 'function') {
    setCookies = headers.getSetCookie()
  } else {
    // Fallback: parse the raw set-cookie header
    const raw = response.headers.get('set-cookie')
    if (raw) {
      setCookies = raw.split(/,\s*(?=[^;]+?=)/)
    }
  }
  return setCookies
    .map((c) => c.split(';')[0])
    .join('; ')
}

// Make HTTPS request using fetch and return { body, cookies }
async function httpRequest(
  method: string,
  host: string,
  path: string,
  headers: Record<string, string>,
  body?: string
): Promise<{ body: string; cookies: string; statusCode: number }> {
  const protocol = host.includes('localhost') || host.includes('127.0.0.1') ? 'http' : 'https'
  const url = `${protocol}://${host}${path}`

  const response = await fetch(url, {
    method: method.toUpperCase(),
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      ...headers,
    },
    body: body || undefined,
  })

  const responseBody = await response.text()
  const cookies = extractCookies(response)

  return {
    body: responseBody,
    cookies,
    statusCode: response.status,
  }
}

interface RequestOptions {
  cookie?: string
  crypto?: string
  realIP?: string
  proxy?: string
}

interface RequestResult {
  status: number
  body: any
  cookie: string
}

/**
 * Create an encrypted request to NetEase Music API
 * @param method - HTTP method (GET/POST)
 * @param url - API path (e.g. /api/song/detail)
 * @param data - Request parameters
 * @param options - { cookie, crypto, realIP, proxy }
 */
export async function createRequest(
  method: string,
  url: string,
  data: Record<string, any> = {},
  options: RequestOptions = {}
): Promise<RequestResult> {
  const { cookie = '', crypto: cryptoType = 'weapi', realIP } = options

  let encryptData: Record<string, any> = {}
  let apiUrl = url
  const host = BASE_URL
  const csrfToken = getCookieValue(cookie, '__csrf')

  const commonHeaders: Record<string, string> = {
    'User-Agent':
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
    Referer: 'https://music.163.com',
    Origin: 'https://music.163.com',
    Cookie: cookie,
    'X-Real-IP': realIP || '116.25.146.37',
    'X-Forwarded-For': realIP || '116.25.146.37',
  }

  switch (cryptoType) {
    case 'weapi':
      // Replace /api/ or /api/linux/ with /weapi/
      apiUrl = url.replace('/api/', '/weapi/')
      data.csrf_token = csrfToken
      encryptData = weapi(data)
      commonHeaders['Content-Type'] = 'application/x-www-form-urlencoded'
      commonHeaders['Referer'] = 'https://music.163.com'
      break

    case 'eapi':
      apiUrl = url.replace('/api/', '/eapi/')
      encryptData = eapi(url, data)
      commonHeaders['Content-Type'] = 'application/x-www-form-urlencoded'
      // eapi uses mobile client UA — more permissive for VIP songs
      commonHeaders['User-Agent'] =
        'NeteaseMusic/9.1.65.240916182646(9001065);Dalvik/2.1.0 (Linux; U; Android 14)'
      commonHeaders['Referer'] = url
      commonHeaders['Origin'] = 'https://music.163.com'
      // Append os=android cookie for mobile client simulation
      commonHeaders['Cookie'] = cookie ? cookie + '; os=android' : 'os=android'
      break

    case 'linuxapi':
      apiUrl = '/api/linux/forward'
      encryptData = linuxapi({
        method: method.toUpperCase(),
        url: `http://music.163.com${url}`,
        params: data,
      })
      commonHeaders['Content-Type'] = 'application/x-www-form-urlencoded'
      commonHeaders['User-Agent'] =
        'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/60.0.3112.90 Safari/537.36'
      break

    default:
      break
  }

  const body = new URLSearchParams(encryptData).toString()

  const { body: responseBody, cookies, statusCode } = await httpRequest(
    'POST',
    host,
    apiUrl,
    commonHeaders,
    body
  )

  // Try to parse JSON response
  let parsed: any
  try {
    parsed = JSON.parse(responseBody)
  } catch {
    // eapi response is encrypted — try decrypting
    if (cryptoType === 'eapi' && responseBody) {
      const decrypted = eapiDecrypt(responseBody)
      if (decrypted) {
        try {
          parsed = JSON.parse(decrypted)
        } catch {
          parsed = { code: statusCode, message: decrypted.substring(0, 500) }
        }
      } else {
        parsed = { code: statusCode, message: responseBody.substring(0, 500) }
      }
    } else {
      parsed = { code: statusCode, message: responseBody.substring(0, 500) }
    }
  }

  return {
    status: statusCode,
    body: parsed,
    cookie: cookies,
  }
}
