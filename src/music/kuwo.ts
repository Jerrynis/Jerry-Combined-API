/**
 * Kuwo Music fallback module
 * When NetEase returns no URL for VIP songs, search and get URL from Kuwo Music
 * Only returns high-confidence matches to avoid returning wrong songs
 */

// Keywords that indicate non-original versions
const BAD_KEYWORDS = [
  'cover', '翻唱', '现场', 'Live', 'live', 'LIVE',
  '片段', '伴奏', '钢琴版', '吉他版', '纯音乐',
  'remix', 'Remix', 'DJ', 'dj', '剪辑',
  'cover:', 'Cover', 'COVER',
  '演唱会', '巡回', '盛典', '现场版',
  '致敬', '模仿', '改编',
  '短暂', '试听', 'preview',
  '串烧', '组曲', 'mashup', 'Mashup',
  '正式版', '电台版', '伴奏版', 'remake',
]

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'

interface KuwoSearchResult {
  id: string
  name: string
  artist: string
}

interface KuwoMatchResult extends KuwoSearchResult {
  score: number
}

// Search on Kuwo (old API, no token needed)
async function search(keyword: string): Promise<KuwoSearchResult[]> {
  const path = `/r.s?all=${encodeURIComponent(keyword)}&ft=music&itemset=1&rformat=json&encoding=utf8&pn=0&rn=30`
  const url = `https://search.kuwo.cn${path}`

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': UA,
        Referer: 'https://www.kuwo.cn/',
      },
    })
    const data = await response.text()

    const validJson = data
      .replace(/'/g, '"')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&apos;/g, "'")
      .replace(/&quot;/g, '"')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')

    const json = JSON.parse(validJson)
    if (json.abslist) {
      return json.abslist.map((s: any) => ({
        id: (s.MUSICRID || '').replace('MUSIC_', ''),
        name: (s.SONGNAME || '').trim(),
        artist: (s.ARTIST || '').trim(),
      }))
    }
    return []
  } catch {
    return []
  }
}

// Get play URL from Kuwo antiserver (follows 302 redirect)
async function getUrl(rid: string): Promise<string | null> {
  const path = `/anti.s?useless=&rid=${rid}&response=res&format=mp3|aac&type=convert_url&br=320kmp3`
  const url = `https://antiserver.kuwo.cn${path}`

  try {
    // Use redirect: 'manual' to capture 302 redirect
    const response = await fetch(url, {
      headers: {
        'User-Agent': UA,
        Referer: 'https://www.kuwo.cn/',
      },
      redirect: 'manual',
    })

    // Check for 302 redirect with Location header
    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get('location')
      if (location) return location
    }

    // If not a redirect, read the body
    const data = await response.text()
    const match = data.match(/href="([^"]+)"/)
    if (match) return match[1]
    if (data.trim().startsWith('http')) return data.trim()
    return null
  } catch {
    return null
  }
}

// Check if a result is likely a non-original version
function isBadVersion(name: string): boolean {
  return BAD_KEYWORDS.some(kw => name.includes(kw))
}

// Calculate match score for a result (0-100)
function scoreMatch(result: KuwoSearchResult, songName: string, artists: string[]): number {
  let score = 0
  const artistNames = artists || []

  // Reject non-original versions entirely
  if (isBadVersion(result.name)) return 0

  // Reject medleys (names with + or & separating multiple songs)
  if (/[+&]/.test(result.name) && result.name.includes(songName)) {
    // e.g. "骑士精神+海盗+看我72变" — this is a medley, not the original
    return 0
  }

  // Name matching (up to 60 points)
  if (result.name === songName) {
    score += 60
  } else if (result.name.includes(songName)) {
    // Song name is contained in result name — check if the extra text is just minor decoration
    const extraText = result.name.replace(songName, '').trim()
    // Allow minor decorations like parentheses with year, but reject long extra text
    if (extraText.length <= 5 && /^[(（].*[)）]?$/.test(extraText)) {
      score += 55 // e.g. "晴天 (2003)" — very close
    } else {
      score += 35 // Has significant extra text — lower confidence
    }
  } else if (songName.includes(result.name) && result.name.length >= 2) {
    score += 30
  } else {
    return 0
  }

  // Artist matching (up to 40 points)
  if (artistNames.length > 0) {
    const hasArtistMatch = artistNames.some(a => {
      if (!a) return false
      return result.artist.includes(a) || a.includes(result.artist)
    })
    if (hasArtistMatch) {
      score += 40
    } else {
      score -= 30
    }
  } else {
    score += 15
  }

  return Math.max(0, score)
}

// Find best matching song from Kuwo search results
function findBestMatch(results: KuwoSearchResult[], songName: string, artists: string[]): KuwoMatchResult | null {
  if (results.length === 0) return null

  // Score all results
  const scored = results.map(r => ({
    ...r,
    score: scoreMatch(r, songName, artists),
  }))

  // Sort by score descending
  scored.sort((a, b) => b.score - a.score)

  // Only return results with score >= 70 (high confidence — exact or near-exact match)
  if (scored[0] && scored[0].score >= 70) {
    return scored[0]
  }

  return null
}

interface KuwoSongUrl {
  url: string
  source: string
  name: string
  artist: string
  br: number
  size: number
  type: string
  matchScore: number
}

/**
 * Get song URL from Kuwo as fallback
 * @param songName - Song name
 * @param artists - Array of artist names
 * @returns - Song URL data or null
 */
export async function getSongUrl(songName: string, artists: string[]): Promise<KuwoSongUrl | null> {
  const artistStr = artists && artists.length > 0 ? artists[0] : ''

  // Strategy 1: Search with "song name + artist" for best precision
  let results: KuwoSearchResult[] = []
  let bestMatch: KuwoMatchResult | null = null

  if (artistStr) {
    results = await search(`${songName} ${artistStr}`)
    bestMatch = findBestMatch(results, songName, artists)
  }

  // Strategy 2: Search with just song name
  if (!bestMatch) {
    results = await search(songName)
    bestMatch = findBestMatch(results, songName, artists)
  }

  // Strategy 3: Try with all artists combined
  if (!bestMatch && artists && artists.length > 1) {
    const allArtists = artists.join(' ')
    results = await search(`${songName} ${allArtists}`)
    bestMatch = findBestMatch(results, songName, artists)
  }

  if (!bestMatch) {
    return null
  }

  // Get the play URL
  const url = await getUrl(bestMatch.id)
  if (url) {
    return {
      url,
      source: 'kuwo',
      name: bestMatch.name,
      artist: bestMatch.artist,
      br: 320000,
      size: 0,
      type: 'mp3',
      matchScore: bestMatch.score,
    }
  }

  return null
}

export { search, getUrl, findBestMatch, scoreMatch, isBadVersion }
