/**
 * 热搜 API - Cloudflare Workers 处理器
 *
 * 从 Vercel Serverless 移植到 Cloudflare Workers。
 * 使用 Web API（Request/Response/fetch），WBI 签名使用 node:crypto（nodejs_compat）。
 *
 * 路由（/hotsearch/ 之后的部分）：
 * - 'all' 或空 → 聚合所有平台（知乎+微博+B站+头条）
 * - 'zhihu'    → 仅知乎
 * - 'weibo'    → 仅微博
 * - 'bilibili' → 仅B站
 * - 'toutiao'  → 仅头条
 * - 其他       → 404
 *
 * 数据源：
 * - 知乎:  https://api.zhihu.com/topstory/hot-lists/total
 * - 微博:  https://weibo.com/ajax/side/hotSearch
 * - B站:   https://api.bilibili.com/x/web-interface/ranking/v2 (WBI 签名)
 * - 头条:  https://www.toutiao.com/hot-event/hot-board/
 */

import crypto from 'node:crypto'
import {
  jsonResponse,
  errorResponse,
  handleOptions,
  CORS_HEADERS,
  getCache,
  setCache,
} from '../shared'

// ──────────────────────────────── 类型定义 ────────────────────────────────

/** 单条热搜项 */
interface HotItem {
  id: string
  title: string
  desc?: string
  hot?: number
  url: string
  mobileUrl?: string
  cover?: string
  author?: string
  timestamp?: string
}

/** 单个平台的完整响应 */
interface SourceResult {
  name: string
  title: string
  type: string
  link: string
  total: number
  fromCache: boolean
  updateTime: string
  data: HotItem[]
  error?: string
}

/** HTTP GET 请求选项 */
interface FetchOptions {
  url: string
  headers?: Record<string, string>
  noCache?: boolean
  ttl?: number
}

/** HTTP GET 请求结果 */
interface FetchResult<T> {
  fromCache: boolean
  updateTime: string
  data: T
}

/** 缓存条目（存储原始数据 + 写入时间） */
interface CacheEntry<T> {
  data: T
  updateTime: string
}

// ──────────────────────────────── 常量 ────────────────────────────────

/** 默认缓存 60 分钟 */
const DEFAULT_TTL = 60 * 60 * 1000

/** 默认请求头 */
const DEFAULT_HEADERS: Record<string, string> = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  Accept: 'application/json, text/plain, */*',
  'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
}

// ──────────────────────────────── HTTP 工具 ────────────────────────────────

/**
 * 带缓存的 GET 请求
 *
 * 使用 Workers 原生 fetch，配合 AbortController 实现 10 秒超时。
 * 缓存通过 shared.ts 的全局 Map 实现（Workers isolate 可能被复用）。
 */
async function getJSON<T>(options: FetchOptions): Promise<FetchResult<T>> {
  const { url, headers = {}, noCache = false, ttl = DEFAULT_TTL } = options

  // 检查缓存
  if (!noCache) {
    const cached = getCache<CacheEntry<T>>(url)
    if (cached) {
      return { fromCache: true, updateTime: cached.updateTime, data: cached.data }
    }
  }

  // 发起请求（带 10 秒超时）
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 10000)

  try {
    const response = await fetch(url, {
      headers: { ...DEFAULT_HEADERS, ...headers },
      signal: controller.signal,
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status} ${response.statusText}`)
    }

    const data = (await response.json()) as T
    const updateTime = new Date().toISOString()

    // 写入缓存
    if (!noCache) {
      setCache(url, { data, updateTime }, ttl)
    }

    return { fromCache: false, updateTime, data }
  } finally {
    clearTimeout(timeout)
  }
}

// ──────────────────────────────── WBI 签名 ────────────────────────────────

/**
 * Bilibili WBI 签名鉴权
 *
 * B站部分接口需要 WBI 签名才能返回数据。
 * 流程：获取 nav 接口的 img_key/sub_key → 打乱生成 mixin_key → md5 签名
 *
 * 参考：https://socialsisteryi.github.io/bilibili-API-collect/
 */

/** 混淆密钥表 - 固定不变 */
const MIXIN_KEY_ENC_TAB = [
  46, 47, 18, 2, 53, 8, 23, 32, 15, 50, 10, 31, 58, 3, 45, 35, 27, 43, 5, 49, 33, 9, 42, 19, 29, 28,
  14, 39, 12, 38, 41, 13, 37, 48, 7, 16, 24, 55, 40, 61, 26, 17, 0, 1, 60, 51, 30, 4, 22, 25, 54,
  21, 56, 59, 6, 63, 57, 62, 11, 36, 20, 34, 44, 52,
]

/** 从 img_key + sub_key 生成 mixin_key */
function getMixinKey(orig: string): string {
  return MIXIN_KEY_ENC_TAB.map((n) => orig[n]).join('').slice(0, 32)
}

/** md5 哈希（使用 node:crypto，项目已启用 nodejs_compat） */
function md5(str: string): string {
  return crypto.createHash('md5').update(str).digest('hex')
}

interface WbiKeys {
  imgKey: string
  subKey: string
}

/** 从 nav 接口获取最新的 img_key 和 sub_key */
async function getWbiKeys(): Promise<WbiKeys> {
  const cookie = getBiliCookie()
  const response = await fetch('https://api.bilibili.com/x/web-interface/nav', {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      Referer: 'https://www.bilibili.com/',
      Cookie: cookie,
    },
  })
  const json = (await response.json()) as {
    data?: { wbi_img?: { img_url?: string; sub_url?: string } }
  }
  const img_url = json.data?.wbi_img?.img_url ?? ''
  const sub_url = json.data?.wbi_img?.sub_url ?? ''
  return {
    imgKey: img_url.slice(img_url.lastIndexOf('/') + 1, img_url.lastIndexOf('.')),
    subKey: sub_url.slice(sub_url.lastIndexOf('/') + 1, sub_url.lastIndexOf('.')),
  }
}

/** B 站 cookie 缓存（含过期时间） */
let biliCookieCache: { cookie: string; expireAt: number } | null = null

/**
 * 生成随机 buvid3 cookie
 *
 * B 站风控会对数据中心 IP（如 Cloudflare Workers）返回 HTTP 412。
 * buvid3 本质是 UUID + "infoc" 后缀的访问标识，无需真实访问首页获取，
 * 直接随机生成即可绕过 412 风控（实测有效）。
 */
function getBiliCookie(): string {
  if (biliCookieCache && Date.now() < biliCookieCache.expireAt) {
    return biliCookieCache.cookie
  }

  const uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
  const buvid3 = uuid.toUpperCase() + 'infoc'
  const cookie = `buvid3=${buvid3}`
  // 缓存 30 分钟，避免每次请求都重新生成
  biliCookieCache = { cookie, expireAt: Date.now() + 30 * 60 * 1000 }
  return cookie
}

/**
 * 生成 WBI 签名参数
 * 返回可直接拼接到 URL 的 query string（含 wts 和 w_rid）
 */
async function getWbiSign(params: Record<string, string | number>): Promise<string> {
  const { imgKey, subKey } = await getWbiKeys()
  const mixinKey = getMixinKey(imgKey + subKey)
  const currentTime = Math.round(Date.now() / 1000)
  const chrFilter = /[!'()*]/g

  // 添加 wts 时间戳
  const allParams: Record<string, string> = {
    ...Object.fromEntries(
      Object.entries(params).map(([k, v]) => [k, String(v)])
    ),
    wts: String(currentTime),
  }

  // 按 key 排序
  const query = Object.keys(allParams)
    .sort()
    .map((key) => {
      const value = allParams[key].replace(chrFilter, '')
      return `${encodeURIComponent(key)}=${encodeURIComponent(value)}`
    })
    .join('&')

  const wRid = md5(query + mixinKey)
  return `${query}&w_rid=${wRid}`
}

// ──────────────────────────────── 数据源：知乎 ────────────────────────────────

interface ZhihuItem {
  target: {
    id: string
    title: string
    excerpt: string
    created: number
    url: string
  }
  children: { thumbnail: string }[]
  detail_text: string
}

async function fetchZhihu(): Promise<SourceResult> {
  const url = 'https://api.zhihu.com/topstory/hot-lists/total?limit=50'
  try {
    const result = await getJSON<{ data: ZhihuItem[] }>({ url })

    if (!result.data?.data) {
      throw new Error('知乎返回数据格式异常')
    }

    const data = result.data.data.map((v) => {
      const questionId = v.target.url.split('/').pop() || v.target.id
      const hotNum = parseFloat(v.detail_text.split(' ')[0]) * 10000
      return {
        id: v.target.id,
        title: v.target.title,
        desc: v.target.excerpt,
        cover: v.children[0]?.thumbnail,
        timestamp: new Date(v.target.created * 1000).toISOString(),
        hot: isNaN(hotNum) ? undefined : hotNum,
        url: `https://www.zhihu.com/question/${questionId}`,
        mobileUrl: `https://www.zhihu.com/question/${questionId}`,
      }
    })

    return {
      name: 'zhihu',
      title: '知乎',
      type: '热榜',
      link: 'https://www.zhihu.com/hot',
      total: data.length,
      fromCache: result.fromCache,
      updateTime: result.updateTime,
      data,
    }
  } catch (err) {
    return errorResult('zhihu', '知乎', '热榜', 'https://www.zhihu.com/hot', err)
  }
}

// ──────────────────────────────── 数据源：微博 ────────────────────────────────

interface WeiboRealtimeItem {
  mid?: string
  word?: string
  word_scheme?: string
  onboard_time?: number
  num?: number
  category?: string
  label_name?: string
}

async function fetchWeibo(): Promise<SourceResult> {
  const url = 'https://weibo.com/ajax/side/hotSearch'
  try {
    const result = await getJSON<{ data?: { realtime: WeiboRealtimeItem[] } }>({
      url,
      headers: {
        Referer: 'https://weibo.com/',
      },
    })

    if (!result.data?.data?.realtime) {
      throw new Error('微博返回数据格式异常')
    }

    const data = result.data.data.realtime.map((v, index) => {
      const title = v.word || v.word_scheme || `热搜${index + 1}`
      return {
        id: v.mid || v.word_scheme || `weibo-${index}`,
        title,
        desc: v.label_name || v.word_scheme || `#${title}#`,
        hot: v.num,
        timestamp: v.onboard_time
          ? new Date(v.onboard_time * 1000).toISOString()
          : undefined,
        url: `https://s.weibo.com/weibo?q=${encodeURIComponent(title)}`,
        mobileUrl: `https://s.weibo.com/weibo?q=${encodeURIComponent(title)}`,
      }
    })

    return {
      name: 'weibo',
      title: '微博',
      type: '热搜榜',
      link: 'https://s.weibo.com/top/summary/',
      total: data.length,
      fromCache: result.fromCache,
      updateTime: result.updateTime,
      data,
    }
  } catch (err) {
    return errorResult('weibo', '微博', '热搜榜', 'https://s.weibo.com/top/summary/', err)
  }
}

// ──────────────────────────────── 数据源：哔哩哔哩 ────────────────────────────────

interface BiliItem {
  bvid: string
  title: string
  desc: string
  pic?: string
  owner?: { name: string }
  author?: string
  pubdate: number
  stat?: { view: number }
  video_review?: number
  short_link_v2?: string
}

async function fetchBilibili(): Promise<SourceResult> {
  const link = 'https://www.bilibili.com/v/popular/rank/all'
  const cookie = getBiliCookie()
  const biliHeaders = {
    Referer: 'https://www.bilibili.com/ranking/all',
    Cookie: cookie,
    'Sec-Ch-Ua': '"Google Chrome";v="124", "Not:A-Brand";v="8", "Chromium";v="124"',
    'Sec-Ch-Ua-Mobile': '?0',
    'Sec-Ch-Ua-Platform': '"Windows"',
    'Sec-Fetch-Dest': 'document',
    'Sec-Fetch-Mode': 'navigate',
    'Sec-Fetch-Site': 'same-origin',
  }
  const errors: string[] = []

  // 主接口：带 WBI 签名的 ranking v2
  try {
    const wbi = await getWbiSign({ foo: '114', bar: '514', baz: '1919810' })
    const url = `https://api.bilibili.com/x/web-interface/ranking/v2?rid=0&type=all&${wbi}`
    const result = await getJSON<{ data?: { list: BiliItem[] } }>({
      url,
      headers: biliHeaders,
      noCache: true,
    })

    if (result.data?.data?.list?.length) {
      return buildBiliResult(result, result.data.data.list)
    }
    errors.push(`ranking/v2: 返回空数据`)
  } catch (e) {
    errors.push(`ranking/v2: ${e instanceof Error ? e.message : String(e)}`)
  }

  // 备用接口（不需要 WBI）
  try {
    const fallbackUrl = 'https://api.bilibili.com/x/web-interface/ranking?rid=0&type=all'
    const fallbackResult = await getJSON<{ data?: { list: BiliItem[] } }>({
      url: fallbackUrl,
      headers: biliHeaders,
      noCache: true,
    })

    if (fallbackResult.data?.data?.list?.length) {
      return buildBiliResult(fallbackResult, fallbackResult.data.data.list)
    }
    errors.push(`ranking: 返回空数据`)
  } catch (e) {
    errors.push(`ranking: ${e instanceof Error ? e.message : String(e)}`)
  }

  // 兜底：热门推荐接口（结构与排行榜一致，同样来自官方）
  try {
    const popularUrl = 'https://api.bilibili.com/x/web-interface/popular?ps=30&pn=1'
    const popularResult = await getJSON<{ data?: { list: BiliItem[] } }>({
      url: popularUrl,
      headers: { ...biliHeaders, Referer: 'https://www.bilibili.com/' },
      noCache: true,
    })

    if (popularResult.data?.data?.list?.length) {
      return buildBiliResult(popularResult, popularResult.data.data.list)
    }
    errors.push(`popular: 返回空数据`)
  } catch (e) {
    errors.push(`popular: ${e instanceof Error ? e.message : String(e)}`)
  }

  // 兜底：搜索热词接口（s.search.bilibili.com 子域）
  try {
    const hotwordUrl = 'https://s.search.bilibili.com/main/hotword'
    const hotwordResult = await getJSON<{ code?: number; list?: BiliHotwordItem[] }>({
      url: hotwordUrl,
      headers: { ...biliHeaders, Referer: 'https://www.bilibili.com/' },
      noCache: true,
    })

    if (hotwordResult.data?.list?.length) {
      return buildBiliHotwordResult(hotwordResult, hotwordResult.data.list)
    }
    errors.push(`hotword: 返回空数据`)
  } catch (e) {
    errors.push(`hotword: ${e instanceof Error ? e.message : String(e)}`)
  }

  // 最终兜底：抓取 B 站移动端网页（m.bilibili.com 子域，服务端渲染，可绕过 api 子域风控）
  try {
    const mobileResult = await fetchBiliMobile()
    if (mobileResult) {
      return mobileResult
    }
    errors.push(`mobile: 网页解析失败`)
  } catch (e) {
    errors.push(`mobile: ${e instanceof Error ? e.message : String(e)}`)
  }

  return errorResult(
    'bilibili',
    '哔哩哔哩',
    '热门榜',
    link,
    new Error(`所有 B站接口均不可用 (${errors.join(' | ')})`)
  )
}

/** B 站搜索热词条目 */
interface BiliHotwordItem {
  hot_id: number
  keyword: string
  show_name?: string
  score?: number
  pos?: number
  icon?: string
}

/** B 站移动端页面条目 */
interface BiliMobileItem {
  bvid: string
  aid: number
  title: string
  pic: string
  pubdate: number
  duration: number
  author: { mid: number; name: string; face: string }
  owner: { mid: number; name: string; face: string }
  stat: { view: number; danmaku: number; reply: number; favorite: number; coin: number; share: number; like: number }
  hot_desc: string
  tname: string
  tags: string[]
}

/**
 * 抓取 B 站移动端网页排行榜数据
 *
 * B 站 API（api.bilibili.com）会对数据中心 IP 返回 HTTP 412 风控。
 * m.bilibili.com 是不同子域，服务端渲染的 __INITIAL_STATE__ 中包含完整的热门视频数据，
 * 使用移动端 User-Agent 即可获取，可作为最终兜底方案。
 */
async function fetchBiliMobile(): Promise<SourceResult | null> {
  // 缓存 10 分钟，避免每次请求都抓取完整 HTML
  const cacheKey = 'bili-mobile-ranking'
  const cached = getCache<SourceResult>(cacheKey)
  if (cached) {
    return cached
  }

  const mobileUA =
    'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1'
  const response = await fetch('https://m.bilibili.com/ranking', {
    headers: {
      'User-Agent': mobileUA,
      Referer: 'https://m.bilibili.com/',
      Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'zh-CN,zh;q=0.9',
    },
  })

  if (!response.ok) {
    throw new Error(`HTTP ${response.status} ${response.statusText}`)
  }

  const html = await response.text()
  const match = html.match(/window\.__INITIAL_STATE__\s*=\s*(\{.*?\});\s*\(function\(\)\{var s;/s)
  if (!match) {
    return null
  }

  const state = JSON.parse(match[1])
  const list: BiliMobileItem[] = state.home?.hotList?.result
  if (!list?.length) {
    return null
  }

  const data = list.map((v) => ({
    id: v.bvid,
    title: v.title,
    desc: v.tname || '热门视频',
    cover: v.pic?.replace(/^http:/, 'https:'),
    author: v.author?.name || v.owner?.name,
    hot: v.stat?.view || 0,
    url: `https://www.bilibili.com/video/${v.bvid}`,
    mobileUrl: `https://m.bilibili.com/video/${v.bvid}`,
  }))

  const result: SourceResult = {
    name: 'bilibili',
    title: '哔哩哔哩',
    type: '热门榜',
    link: 'https://m.bilibili.com/ranking',
    total: data.length,
    fromCache: false,
    updateTime: new Date().toISOString(),
    data,
  }

  setCache(cacheKey, result, 10 * 60 * 1000)
  return result
}

/** 将 B 站搜索热词转换为统一格式 */
function buildBiliHotwordResult(
  result: { fromCache: boolean; updateTime: string },
  list: BiliHotwordItem[]
): SourceResult {
  const data = list.map((v) => ({
    id: String(v.hot_id),
    title: v.show_name || v.keyword,
    desc: 'B站搜索热词',
    hot: Math.round((v.score || 0) * 10000) || undefined,
    url: `https://search.bilibili.com/all?keyword=${encodeURIComponent(v.keyword)}`,
    mobileUrl: `https://m.bilibili.com/search?keyword=${encodeURIComponent(v.keyword)}`,
  }))

  return {
    name: 'bilibili',
    title: '哔哩哔哩',
    type: '热搜榜',
    link: 'https://www.bilibili.com/v/popular/rank/all',
    total: data.length,
    fromCache: result.fromCache,
    updateTime: result.updateTime,
    data,
  }
}

function buildBiliResult(
  result: { fromCache: boolean; updateTime: string },
  list: BiliItem[]
): SourceResult {
  const data = list.map((v) => ({
    id: v.bvid,
    title: v.title,
    desc: v.desc || '该视频暂无简介',
    cover: v.pic?.replace(/http:/, 'https:'),
    author: v.owner?.name || v.author,
    timestamp: v.pubdate ? new Date(v.pubdate * 1000).toISOString() : undefined,
    hot: v.stat?.view || v.video_review || 0,
    url: v.short_link_v2 || `https://www.bilibili.com/video/${v.bvid}`,
    mobileUrl: `https://m.bilibili.com/video/${v.bvid}`,
  }))

  return {
    name: 'bilibili',
    title: '哔哩哔哩',
    type: '热门榜',
    link: 'https://www.bilibili.com/v/popular/rank/all',
    total: data.length,
    fromCache: result.fromCache,
    updateTime: result.updateTime,
    data,
  }
}

// ──────────────────────────────── 数据源：今日头条 ────────────────────────────────

interface ToutiaoItem {
  ClusterIdStr: string
  Title: string
  Image: { url: string }
  HotValue: string
}

async function fetchToutiao(): Promise<SourceResult> {
  const url = 'https://www.toutiao.com/hot-event/hot-board/?origin=toutiao_pc'
  try {
    const result = await getJSON<{ data: ToutiaoItem[] }>({ url })

    if (!result.data?.data) {
      throw new Error('头条返回数据格式异常')
    }

    const data = result.data.data.map((v) => ({
      id: v.ClusterIdStr,
      title: v.Title,
      cover: v.Image?.url,
      hot: Number(v.HotValue) || undefined,
      url: `https://www.toutiao.com/trending/${v.ClusterIdStr}/`,
      mobileUrl: `https://www.toutiao.com/trending/${v.ClusterIdStr}/`,
    }))

    return {
      name: 'toutiao',
      title: '今日头条',
      type: '热榜',
      link: 'https://www.toutiao.com/',
      total: data.length,
      fromCache: result.fromCache,
      updateTime: result.updateTime,
      data,
    }
  } catch (err) {
    return errorResult('toutiao', '今日头条', '热榜', 'https://www.toutiao.com/', err)
  }
}

// ──────────────────────────────── 工具函数 ────────────────────────────────

function errorResult(
  name: string,
  title: string,
  type: string,
  link: string,
  err: unknown
): SourceResult {
  const message = err instanceof Error ? err.message : String(err)
  return {
    name,
    title,
    type,
    link,
    total: 0,
    fromCache: false,
    updateTime: new Date().toISOString(),
    data: [],
    error: message,
  }
}

/** 聚合获取所有平台热搜（并发请求，互不阻塞） */
async function fetchAllSources(): Promise<SourceResult[]> {
  const [zhihu, weibo, bilibili, toutiao] = await Promise.allSettled([
    fetchZhihu(),
    fetchWeibo(),
    fetchBilibili(),
    fetchToutiao(),
  ])

  return [zhihu, weibo, bilibili, toutiao].map((result, index) => {
    const names = ['zhihu', 'weibo', 'bilibili', 'toutiao']
    if (result.status === 'fulfilled') {
      return result.value
    }
    // 理论上不会走到这里（每个 fetcher 内部已 try/catch），但以防万一
    return errorResult(names[index], names[index], '热榜', '', result.reason)
  })
}

// ──────────────────────────────── 路由 ────────────────────────────────

/** 提取 url.pathname 中 /hotsearch/ 之后的部分 */
function extractRoute(url: URL): string {
  const path = url.pathname
  const marker = '/hotsearch/'
  const idx = path.indexOf(marker)
  if (idx === -1) {
    // /hotsearch（无尾部斜杠）
    return ''
  }
  return path.slice(idx + marker.length)
}

// ──────────────────────────────── 主处理函数 ────────────────────────────────

export async function handleHotSearch(
  request: Request,
  url: URL,
  env: any
): Promise<Response> {
  // OPTIONS 预检请求 → 204 + CORS 头
  if (request.method === 'OPTIONS') {
    return handleOptions()
  }

  const route = extractRoute(url).toLowerCase()

  try {
    // 聚合所有平台
    if (route === '' || route === 'all') {
      const sources = await fetchAllSources()
      return jsonResponse({
        code: 200,
        message: 'success',
        updateTime: new Date().toISOString(),
        fromCache: sources.some((s) => s.fromCache),
        sources,
      })
    }

    // 单平台：知乎
    if (route === 'zhihu') {
      const data = await fetchZhihu()
      return jsonResponse({
        code: 200,
        message: 'success',
        updateTime: new Date().toISOString(),
        fromCache: data.fromCache,
        data,
      })
    }

    // 单平台：微博
    if (route === 'weibo') {
      const data = await fetchWeibo()
      return jsonResponse({
        code: 200,
        message: 'success',
        updateTime: new Date().toISOString(),
        fromCache: data.fromCache,
        data,
      })
    }

    // 单平台：B站
    if (route === 'bilibili') {
      const data = await fetchBilibili()
      return jsonResponse({
        code: 200,
        message: 'success',
        updateTime: new Date().toISOString(),
        fromCache: data.fromCache,
        data,
      })
    }

    // 单平台：头条
    if (route === 'toutiao') {
      const data = await fetchToutiao()
      return jsonResponse({
        code: 200,
        message: 'success',
        updateTime: new Date().toISOString(),
        fromCache: data.fromCache,
        data,
      })
    }

    // 未知路由 → 404
    return errorResponse(`未知的平台: ${route}`, 404)
  } catch (err) {
    return errorResponse(`服务器内部错误: ${String(err)}`, 500)
  }
}
