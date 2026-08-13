/**
 * Multi-source song URL unblock module
 *
 * When NetEase returns 30-second trial clips for VIP songs, this module
 * tries multiple third-party music APIs to get the full song URL.
 *
 * Sources referenced from @neteasecloudmusicapienhanced/unblockmusic-utils
 * https://github.com/NeteaseCloudMusicApiEnhanced/UnblockNeteaseMusic-utils
 *
 * Detection logic referenced from api-enhanced project:
 * https://github.com/NeteaseCloudMusicApiEnhanced/api-enhanced
 */

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'

// Quality level: controlled by setUseFlac() — handler sets this from env.DISABLE_FLAC
let useFlac = true

/**
 * Set the FLAC quality flag from the handler (reads from env.DISABLE_FLAC)
 * @param value - true if FLAC is enabled, false if disabled
 */
export function setUseFlac(value: boolean): void {
  useFlac = value
}

interface HttpGetResult {
  body: string
  statusCode: number
  location: string
}

/**
 * HTTP GET request with redirect handling using fetch
 * @param url - URL to fetch
 * @param noRedirect - If true, don't follow redirects (capture Location header)
 * @returns {Promise<HttpGetResult | null>}
 */
async function httpGet(url: string, noRedirect = false): Promise<HttpGetResult | null> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 8000)

  try {
    const response = await fetch(url, {
      headers: { 'User-Agent': UA, Accept: '*/*' },
      redirect: noRedirect ? 'manual' : 'follow',
      signal: controller.signal,
    })

    // Capture redirect Location without following
    if (noRedirect && response.status >= 300 && response.status < 400) {
      const location = response.headers.get('location') || ''
      clearTimeout(timeoutId)
      return { body: '', statusCode: response.status, location }
    }

    const body = await response.text()
    const location = response.headers.get('location') || ''
    clearTimeout(timeoutId)
    return { body, statusCode: response.status, location }
  } catch {
    clearTimeout(timeoutId)
    return null
  }
}

// Source 1: GD Music API (returns JSON with url field)
async function gdmusic(id: string): Promise<string | null> {
  const br = useFlac ? 999 : 320
  const result = await httpGet(`https://music-api.gdstudio.xyz/api.php?types=url&source=netease&id=${id}&br=${br}`)
  if (!result || !result.body) return null
  try {
    const json = JSON.parse(result.body)
    if (json.url) return json.url
  } catch {}
  return null
}

// Source 2: Qijieya Plus API (returns JSON like NetEase API format)
async function qijieyaPlus(id: string): Promise<string | null> {
  const level = useFlac ? 'hi-res' : 'exhigh'
  const result = await httpGet(`https://163api.qijieya.cn/song/url/v1?id=${id}&level=${level}`)
  if (!result || !result.body) return null
  try {
    const json = JSON.parse(result.body)
    if (json.data && Array.isArray(json.data) && json.data[0] && json.data[0].url) {
      return json.data[0].url
    }
  } catch {}
  return null
}

// Source 3: Bikonoo API (returns JSON with url field)
async function bikonoo(id: string): Promise<string | null> {
  const level = useFlac ? 'lossless' : 'exhigh'
  const result = await httpGet(`https://ncm.bikonoo.com/api/163_music.php?ids=${id}&level=${level}&type=json`)
  if (!result || !result.body) return null
  try {
    const json = JSON.parse(result.body)
    if (json.url) return json.url
  } catch {}
  return null
}

// Source 4: Byfuns API (may redirect or return text URL)
async function byfuns(id: string): Promise<string | null> {
  const level = useFlac ? 'lossless' : 'exhigh'
  const result = await httpGet(`https://api.byfuns.top/1/?id=${id}&level=${level}`, true)
  if (!result) return null
  if (result.location) return result.location
  if (result.body) {
    const url = result.body.trim()
    if (url.startsWith('http')) return url
  }
  return null
}

// Source 5: Qijieya API (may redirect or return text/JSON URL)
async function qijieya(id: string): Promise<string | null> {
  // First try without redirect
  const result = await httpGet(`https://163api.qijieya.cn/meting/?type=url&id=${id}`, true)
  if (!result) return null
  if (result.location) return result.location
  if (result.body) {
    try {
      const json = JSON.parse(result.body)
      if (json.url) return json.url
    } catch {
      const url = result.body.trim()
      if (url.startsWith('http')) return url
    }
  }
  return null
}

// Source 6: Msls API (may redirect or return JSON URL)
async function msls(id: string): Promise<string | null> {
  const result = await httpGet(`https://api.msls1441.com/?type=url&id=${id}`, true)
  if (!result) return null
  if (result.location) return result.location
  if (result.body) {
    try {
      const json = JSON.parse(result.body)
      if (json.url) return json.url
    } catch {
      const url = result.body.trim()
      if (url.startsWith('http')) return url
    }
  }
  return null
}

interface SourceDef {
  name: string
  fn: (id: string) => Promise<string | null>
}

// All sources in priority order (most reliable first)
const sources: SourceDef[] = [
  { name: 'gdmusic', fn: gdmusic },
  { name: 'qijieyaPlus', fn: qijieyaPlus },
  { name: 'bikonoo', fn: bikonoo },
  { name: 'byfuns', fn: byfuns },
  { name: 'qijieya', fn: qijieya },
  { name: 'msls', fn: msls },
]

interface MatchIDResult {
  url: string
  source: string
}

/**
 * Get full song URL from multiple sources (tries each source in order)
 * Mirrors api-enhanced's matchID(id, source): an optional source name can be
 * given to force a specific音源, otherwise sources are tried in priority order.
 *
 * @param songId - NetEase song ID
 * @param sourceName - Optional source name to force (e.g. 'gdmusic', 'unm')
 * @returns {Promise<MatchIDResult | null>}
 */
export async function matchID(songId: string | number, sourceName?: string): Promise<MatchIDResult | null> {
  const id = String(songId)

  // Force a specific source if requested
  if (sourceName) {
    const target = sources.find((s) => s.name === sourceName)
    if (target) {
      try {
        const url = await target.fn(id)
        if (url && url.startsWith('http') && !isTrialUrl(url)) {
          return { url, source: target.name }
        }
      } catch {}
    }
    return null
  }

  for (const source of sources) {
    try {
      const url = await source.fn(id)
      if (url && url.startsWith('http') && !isTrialUrl(url)) {
        return { url, source: source.name }
      }
    } catch {}
  }
  return null
}

/**
 * Check if a NetEase URL is a 30-second trial clip.
 * Trial URLs contain "jd-musicrep-ts" or similar patterns in the path.
 */
export function isTrialUrl(url: string | null | undefined): boolean {
  if (!url) return false
  const lowerUrl = url.toLowerCase()
  return lowerUrl.includes('jd-musicrep-ts') ||
         lowerUrl.includes('musicrep-ts') ||
         lowerUrl.includes('404.html')
}

/**
 * Check if a song needs unblocking.
 * This follows the same logic as api-enhanced's ENABLE_GENERAL_UNBLOCK:
 * - song.freeTrialInfo is not null (official NetEase trial indicator)
 * - song.url is missing
 * - song.fee is 1 (VIP) or 4 (album-only)
 * - song.url is a trial URL
 *
 * @param song - Song object from NetEase API response
 * @returns - True if the song needs unblocking
 */
export function needsUnblock(song: any): boolean {
  if (!song) return false

  // Check freeTrialInfo (official indicator from NetEase)
  if (song.freeTrialInfo !== null && song.freeTrialInfo !== undefined) {
    return true
  }

  // Check if URL is missing
  if (!song.url) {
    return true
  }

  // Check if URL is a trial clip
  if (isTrialUrl(song.url)) {
    return true
  }

  // Check fee: 1 = VIP song, 4 = album-only song
  // These are likely to return trial clips even with URL present
  if ([1, 4].includes(song.fee) && song.freeTrialInfo !== null) {
    return true
  }

  return false
}

export { sources }
