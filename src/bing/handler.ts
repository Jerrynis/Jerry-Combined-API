// ============================================================
// Bing Daily Wallpaper API Module
// Fetches daily wallpapers from Bing
// ============================================================

import { jsonResponse, errorResponse, getCache, setCache } from '../shared'

const BING_BASE = 'https://cn.bing.com'
const BING_API = `${BING_BASE}/HPImageArchive.aspx`
const CACHE_TTL = 30 * 60 * 1000 // 30 minutes

interface BingImage {
  url: string
  urlbase: string
  copyright: string
  copyrightlink: string
  title: string
  hsh: string
 startdate: string
  fullUrl: string
  fullUrlBase: string
}

interface BingResponse {
  images: Array<{
    url: string
    urlbase: string
    copyright: string
    copyrightlink: string
    title: string
    hsh: string
    startdate: string
    fullstartdate: string
    enddate: string
    wp: boolean
    bot: number
    top: number
    quiz: string
  }>
}

async function fetchBingImages(count: number = 8, offset: number = 0): Promise<BingImage[]> {
  const cacheKey = `bing_images_${count}_${offset}`
  const cached = getCache<BingImage[]>(cacheKey)
  if (cached) return cached

  const apiUrl = `${BING_API}?format=js&idx=${offset}&n=${count}&mkt=zh-CN`
  const resp = await fetch(apiUrl, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      'Accept': 'application/json',
    },
  })

  if (!resp.ok) {
    throw new Error(`Bing API returned ${resp.status}`)
  }

  const data = (await resp.json()) as BingResponse
  const images: BingImage[] = data.images.map(img => ({
    url: `${BING_BASE}${img.url}`,
    urlbase: `${BING_BASE}${img.urlbase}`,
    copyright: img.copyright,
    copyrightlink: img.copyrightlink,
    title: img.title,
    hsh: img.hsh,
    startdate: img.startdate,
    fullUrl: `${BING_BASE}${img.url}`,
    fullUrlBase: `${BING_BASE}${img.urlbase}`,
  }))

  setCache(cacheKey, images, CACHE_TTL)
  return images
}

function formatDate(startdate: string): string {
  // Bing format: 20260812
  const y = startdate.substring(0, 4)
  const m = startdate.substring(4, 6)
  const d = startdate.substring(6, 8)
  return `${y}-${m}-${d}`
}

export async function handleBing(request: Request, url: URL, env: any): Promise<Response> {
  const subPath = url.pathname.replace(/^\/bing\/?/, '').toLowerCase()

  // /bing/today → today's wallpaper info
  if (subPath === 'today' || subPath === '') {
    try {
      const images = await fetchBingImages(1, 0)
      if (images.length === 0) {
        return errorResponse('No wallpaper available', 404)
      }
      const img = images[0]
      return jsonResponse({
        code: 200,
        message: 'success',
        data: {
          title: img.title,
          date: formatDate(img.startdate),
          url: img.fullUrl,
          urlbase: img.fullUrlBase,
          copyright: img.copyright,
          copyrightLink: img.copyrightlink.startsWith('http') ? img.copyrightlink : `${BING_BASE}${img.copyrightlink}`,
          hash: img.hsh,
          resolutions: {
            '1920x1080': img.fullUrl,
            'UHD': `${img.fullUrlBase}_UHD.jpg`,
            '1080x1920': `${img.fullUrlBase}_1080x1920.jpg`,
            '1366x768': `${img.fullUrlBase}_1366x768.jpg`,
          },
        },
        fromCache: false,
        timestamp: new Date().toISOString(),
      })
    } catch (e: any) {
      return errorResponse(`Failed to fetch Bing wallpaper: ${e.message}`, 500)
    }
  }

  // /bing/image → 302 redirect to today's wallpaper image
  if (subPath === 'image') {
    try {
      const images = await fetchBingImages(1, 0)
      if (images.length === 0) {
        return errorResponse('No wallpaper available', 404)
      }
      return new Response(null, {
        status: 302,
        headers: {
          Location: images[0].fullUrl,
          'Cache-Control': 'public, max-age=1800',
        },
      })
    } catch (e: any) {
      return errorResponse(`Failed to fetch Bing wallpaper: ${e.message}`, 500)
    }
  }

  // /bing/image/uhd → 302 redirect to UHD wallpaper
  if (subPath === 'image/uhd') {
    try {
      const images = await fetchBingImages(1, 0)
      if (images.length === 0) return errorResponse('No wallpaper available', 404)
      return new Response(null, {
        status: 302,
        headers: { Location: `${images[0].fullUrlBase}_UHD.jpg`, 'Cache-Control': 'public, max-age=1800' },
      })
    } catch (e: any) {
      return errorResponse(`Failed: ${e.message}`, 500)
    }
  }

  // /bing/random → random day's wallpaper from last 8 days
  if (subPath === 'random') {
    try {
      const images = await fetchBingImages(8, 0)
      if (images.length === 0) return errorResponse('No wallpaper available', 404)
      const random = images[Math.floor(Math.random() * images.length)]
      return new Response(null, {
        status: 302,
        headers: { Location: random.fullUrl, 'Cache-Control': 'public, max-age=1800' },
      })
    } catch (e: any) {
      return errorResponse(`Failed: ${e.message}`, 500)
    }
  }

  // /bing/list → list of recent wallpapers
  if (subPath === 'list') {
    const countParam = url.searchParams.get('count')
    const count = countParam ? Math.min(Math.max(parseInt(countParam) || 8, 1), 8) : 8
    try {
      const images = await fetchBingImages(count, 0)
      return jsonResponse({
        code: 200,
        message: 'success',
        total: images.length,
        data: images.map(img => ({
          title: img.title,
          date: formatDate(img.startdate),
          url: img.fullUrl,
          urlUHD: `${img.fullUrlBase}_UHD.jpg`,
          copyright: img.copyright,
          copyrightLink: img.copyrightlink.startsWith('http') ? img.copyrightlink : `${BING_BASE}${img.copyrightlink}`,
          hash: img.hsh,
        })),
        fromCache: false,
        timestamp: new Date().toISOString(),
      })
    } catch (e: any) {
      return errorResponse(`Failed: ${e.message}`, 500)
    }
  }

  return errorResponse(`Unknown Bing endpoint: /bing/${subPath}. Available: /bing/today, /bing/image, /bing/image/uhd, /bing/random, /bing/list`, 404)
}
