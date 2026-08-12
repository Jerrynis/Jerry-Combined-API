/**
 * 天气 & 位置 API - Cloudflare Workers 处理器
 *
 * 从 Vercel Serverless 移植到 Cloudflare Workers。
 * 使用 Web API（Request/Response/fetch）。
 *
 * 路由（/weather/ 之后的部分）：
 * - 'query'    → 天气查询（参数：city, lat, lon, ip）
 * - 'location' → IP 定位调试（参数：ip）
 * - 'health'   → 健康检查
 * - 其他       → 404
 *
 * 数据源：
 * - 地理编码:  https://geocoding-api.open-meteo.com/v1/search
 * - 天气数据:  https://api.open-meteo.com/v1/forecast
 * - 反向地理:  https://api.bigdatacloud.net/data/reverse-geocode-client
 * - IP 定位:   Cloudflare cf → ipinfo.io → ipwho.is
 */

import {
  jsonResponse,
  errorResponse,
  handleOptions,
  getCache,
  setCache,
} from '../shared'

// ──────────────────────────────── 类型定义 ────────────────────────────────

/** 地理位置信息 */
interface GeoLocation {
  ip: string
  city: string
  region: string
  country: string
  countryCode: string
  latitude: number
  longitude: number
  timezone: string
  isp?: string
  provider?: string
}

/** 当前天气状况 */
interface CurrentWeather {
  temperature: number
  apparentTemperature: number
  weatherCode: number
  weatherDescription: string
  weatherDescriptionZh: string
  humidity: number
  pressure: number
  surfacePressure: number
  windSpeed: number
  windDirection: number
  windDirectionText: string
  windGusts: number
  cloudCover: number
  precipitation: number
  rain: number
  snowfall: number
  isDay: boolean
  uvIndex: number
  visibility: number
  observedAt: string
}

/** 逐时预报条目 */
interface HourlyForecast {
  time: string
  temperature: number
  apparentTemperature: number
  humidity: number
  precipitationProbability: number
  precipitation: number
  weatherCode: number
  weatherDescription: string
  weatherDescriptionZh: string
  visibility: number
  windSpeed: number
  uvIndex: number
  isDay: boolean
}

/** 每日预报条目 */
interface DailyForecast {
  date: string
  weatherCode: number
  weatherDescription: string
  weatherDescriptionZh: string
  tempMax: number
  tempMin: number
  sunrise: string
  sunset: string
  uvIndexMax: number
  precipitationSum: number
  precipitationProbabilityMax: number
  windSpeedMax: number
}

/** 完整 API 响应 */
interface WeatherApiResponse {
  success: boolean
  cached?: boolean
  location: GeoLocation
  current: CurrentWeather
  hourly: HourlyForecast[]
  daily: DailyForecast[]
  fetchedAt: string
  units: {
    temperature: string
    windSpeed: string
    precipitation: string
    pressure: string
    visibility: string
    humidity: string
  }
}

/** Cloudflare request.cf 对象的地理信息字段 */
interface CloudflareCfProperties {
  city?: string
  country?: string
  region?: string
  regionCode?: string
  latitude?: string | number
  longitude?: string | number
  timezone?: string
  postalCode?: string
}

// ──────────────────────────────── WMO 天气代码 ────────────────────────────────

interface WeatherCodeInfo {
  description: string
  descriptionZh: string
  icon: string
}

const weatherCodeMap: Record<number, WeatherCodeInfo> = {
  0:  { description: 'Clear sky',                      descriptionZh: '晴天',       icon: '☀️' },
  1:  { description: 'Mainly clear',                    descriptionZh: '大部晴朗',   icon: '🌤️' },
  2:  { description: 'Partly cloudy',                  descriptionZh: '多云',       icon: '⛅' },
  3:  { description: 'Overcast',                       descriptionZh: '阴天',       icon: '☁️' },
  45: { description: 'Fog',                            descriptionZh: '雾',         icon: '🌫️' },
  48: { description: 'Depositing rime fog',            descriptionZh: '雾凇',       icon: '🌫️' },
  51: { description: 'Light drizzle',                  descriptionZh: '小毛毛雨',   icon: '🌦️' },
  53: { description: 'Moderate drizzle',               descriptionZh: '中毛毛雨',   icon: '🌦️' },
  55: { description: 'Dense drizzle',                  descriptionZh: '大毛毛雨',   icon: '🌧️' },
  56: { description: 'Light freezing drizzle',         descriptionZh: '冻毛毛雨',   icon: '🌧️' },
  57: { description: 'Dense freezing drizzle',         descriptionZh: '强冻毛毛雨', icon: '🌧️' },
  61: { description: 'Slight rain',                    descriptionZh: '小雨',       icon: '🌦️' },
  63: { description: 'Moderate rain',                  descriptionZh: '中雨',       icon: '🌧️' },
  65: { description: 'Heavy rain',                     descriptionZh: '大雨',       icon: '🌧️' },
  66: { description: 'Light freezing rain',            descriptionZh: '冻雨',       icon: '🌧️' },
  67: { description: 'Heavy freezing rain',            descriptionZh: '强冻雨',     icon: '🌧️' },
  71: { description: 'Slight snow fall',               descriptionZh: '小雪',       icon: '🌨️' },
  73: { description: 'Moderate snow fall',             descriptionZh: '中雪',       icon: '🌨️' },
  75: { description: 'Heavy snow fall',                descriptionZh: '大雪',       icon: '❄️' },
  77: { description: 'Snow grains',                    descriptionZh: '冰粒',       icon: '🌨️' },
  80: { description: 'Slight rain showers',            descriptionZh: '小阵雨',     icon: '🌦️' },
  81: { description: 'Moderate rain showers',         descriptionZh: '中阵雨',     icon: '🌧️' },
  82: { description: 'Violent rain showers',           descriptionZh: '强阵雨',     icon: '⛈️' },
  85: { description: 'Slight snow showers',            descriptionZh: '小阵雪',     icon: '🌨️' },
  86: { description: 'Heavy snow showers',             descriptionZh: '强阵雪',     icon: '❄️' },
  95: { description: 'Thunderstorm',                   descriptionZh: '雷暴',       icon: '⛈️' },
  96: { description: 'Thunderstorm with slight hail',  descriptionZh: '雷暴伴小冰雹', icon: '⛈️' },
  99: { description: 'Thunderstorm with heavy hail',   descriptionZh: '雷暴伴大冰雹', icon: '⛈️' },
}

function getWeatherInfo(code: number): WeatherCodeInfo {
  return weatherCodeMap[code] ?? {
    description: 'Unknown',
    descriptionZh: '未知',
    icon: '❓',
  }
}

function getWeatherDescription(code: number): string {
  return getWeatherInfo(code).description
}

function getWeatherDescriptionZh(code: number): string {
  return getWeatherInfo(code).descriptionZh
}

/**
 * 将风向角度转换为指南针文字。
 */
function windDirectionToText(degrees: number): string {
  const directions = [
    'N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE',
    'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW',
  ]
  const index = Math.round(degrees / 22.5) % 16
  return directions[index]
}

// ──────────────────────────────── IP 工具 ────────────────────────────────

/**
 * 检查 IP 是否为私有/本地地址。
 */
function isPrivateIp(ip: string): boolean {
  if (!ip) return true
  return (
    ip === '127.0.0.1' ||
    ip === '::1' ||
    ip === '0.0.0.0' ||
    ip.startsWith('10.') ||
    ip.startsWith('172.16.') ||
    ip.startsWith('172.17.') ||
    ip.startsWith('172.18.') ||
    ip.startsWith('172.19.') ||
    ip.startsWith('172.2') ||
    ip.startsWith('172.3') ||
    ip.startsWith('192.168.') ||
    ip.startsWith('169.254.') ||
    ip.startsWith('fc') ||
    ip.startsWith('fe80')
  )
}

/**
 * 从请求头中提取客户端 IP。
 * Cloudflare Workers 环境优先级：cf-connecting-ip > x-forwarded-for > x-real-ip > x-client-ip
 */
function getClientIp(headers: Headers): string {
  const headerKeys = [
    'cf-connecting-ip',
    'x-forwarded-for',
    'x-real-ip',
    'x-client-ip',
  ]

  for (const key of headerKeys) {
    const value = headers.get(key)
    if (value) {
      const ip = value.split(',')[0].trim()
      if (ip && ip !== 'unknown') return ip
    }
  }

  return '127.0.0.1'
}

// ──────────────────────────────── 地理定位 ────────────────────────────────

/**
 * 从 Cloudflare request.cf 对象构造 GeoLocation。
 * cf 字段：city, country, region, regionCode, latitude, longitude, timezone, postalCode
 * latitude/longitude 为字符串，需要 parseFloat。
 */
function getGeoFromCf(
  cf: CloudflareCfProperties | undefined | null,
  ip: string
): GeoLocation | null {
  if (!cf) return null

  const latRaw = cf.latitude
  const lonRaw = cf.longitude
  if (latRaw == null || lonRaw == null) return null

  const latitude = parseFloat(String(latRaw))
  const longitude = parseFloat(String(lonRaw))
  if (isNaN(latitude) || isNaN(longitude)) return null

  return {
    ip,
    city: cf.city || 'Unknown',
    region: cf.region || cf.regionCode || '',
    country: cf.country || '',
    countryCode: cf.country || '',
    latitude,
    longitude,
    timezone: cf.timezone || 'auto',
    provider: 'cloudflare',
  }
}

/**
 * 从 ipinfo.io 获取地理位置（免费，HTTPS，每月 50k 次免 API key）。
 */
async function getGeoFromIpInfo(ip: string): Promise<GeoLocation | null> {
  const url = isPrivateIp(ip)
    ? 'https://ipinfo.io/json'
    : `https://ipinfo.io/${ip}/json`
  const response = await fetch(url)
  if (!response.ok) return null

  const data = (await response.json()) as any
  if (!data.ip || !data.loc) return null

  const [lat, lon] = data.loc.split(',').map((v: string) => parseFloat(v))
  if (isNaN(lat) || isNaN(lon)) return null

  return {
    ip: data.ip,
    city: data.city || 'Unknown',
    region: data.region || '',
    country: data.country || '',
    countryCode: data.country || '',
    latitude: lat,
    longitude: lon,
    timezone: data.timezone || 'auto',
    isp: data.org || undefined,
  }
}

/**
 * 从 ipwho.is 获取地理位置（免费，HTTPS，无需 API key）。
 */
async function getGeoFromIpWhoIs(ip: string): Promise<GeoLocation | null> {
  const url = isPrivateIp(ip) ? 'https://ipwho.is/' : `https://ipwho.is/${ip}`
  const response = await fetch(url)
  if (!response.ok) return null

  const data = (await response.json()) as any
  if (!data.success) return null

  return {
    ip: data.ip || ip,
    city: data.city || 'Unknown',
    region: data.region || '',
    country: data.country || '',
    countryCode: data.country_code || '',
    latitude: data.latitude,
    longitude: data.longitude,
    timezone: data.timezone?.id || 'auto',
    isp: data.connection?.isp || undefined,
  }
}

/**
 * 获取 IP 的地理位置。
 *
 * Cloudflare Workers 回退链：
 *   1. request.cf（Cloudflare 原生地理信息，最快，无外部调用）
 *   2. ipinfo.io（HTTPS，对中国 IP 准确度好）
 *   3. ipwho.is（HTTPS，通用）
 *
 * 跳过 ip-api.com（免费版仅支持 HTTP，Workers 不支持 HTTP fetch）
 * 跳过 Vercel headers（Workers 环境不存在）
 *
 * 注意：如果提供了 ipOverride（查询指定 IP），则跳过 cf，
 * 因为 cf 反映的是实际请求客户端的位置，而非指定的 IP。
 */
async function getGeoLocation(
  request: Request,
  ipOverride?: string
): Promise<GeoLocation> {
  const headers = request.headers
  const ip = ipOverride || getClientIp(headers)

  // 如果未提供 IP 覆盖，优先使用 Cloudflare cf 对象
  if (!ipOverride) {
    const cf = (request as any).cf as CloudflareCfProperties | undefined
    const cfGeo = getGeoFromCf(cf, ip)
    if (cfGeo) return cfGeo
  }

  // 尝试 ipinfo.io（HTTPS）
  try {
    const geo = await getGeoFromIpInfo(ip)
    if (geo) return geo
  } catch (e) {
    console.error('ipinfo.io failed:', e)
  }

  // 尝试 ipwho.is（HTTPS）
  try {
    const geo = await getGeoFromIpWhoIs(ip)
    if (geo) return geo
  } catch (e) {
    console.error('ipwho.is failed:', e)
  }

  throw new Error('Unable to determine geolocation from IP address. All geolocation providers failed.')
}

interface GeoLocationResult {
  location: GeoLocation
  provider: string
}

/**
 * 获取地理位置并返回提供者信息（用于调试端点）。
 */
async function getGeoLocationWithProvider(
  request: Request,
  ipOverride?: string
): Promise<GeoLocationResult> {
  const headers = request.headers
  const ip = ipOverride || getClientIp(headers)

  if (!ipOverride) {
    const cf = (request as any).cf as CloudflareCfProperties | undefined
    const cfGeo = getGeoFromCf(cf, ip)
    if (cfGeo) return { location: cfGeo, provider: 'cloudflare' }
  }

  try {
    const geo = await getGeoFromIpInfo(ip)
    if (geo) return { location: geo, provider: 'ipinfo.io' }
  } catch (e) {
    console.error('ipinfo.io failed:', e)
  }

  try {
    const geo = await getGeoFromIpWhoIs(ip)
    if (geo) return { location: geo, provider: 'ipwho.is' }
  } catch (e) {
    console.error('ipwho.is failed:', e)
  }

  throw new Error('Unable to determine geolocation from IP address. All geolocation providers failed.')
}

// ──────────────────────────────── 天气数据 ────────────────────────────────

/**
 * 使用 Open-Meteo 地理编码 API 将城市名转换为坐标。
 * 支持中文和英文城市名。
 */
async function geocodeCity(cityName: string, language: string = 'zh'): Promise<GeoLocation> {
  const params = new URLSearchParams({
    name: cityName,
    count: '1',
    language,
    format: 'json',
  })

  const url = `https://geocoding-api.open-meteo.com/v1/search?${params.toString()}`
  const response = await fetch(url)

  if (!response.ok) {
    throw new Error(`Geocoding API error: ${response.status}`)
  }

  const data = (await response.json()) as any

  if (!data.results || data.results.length === 0) {
    throw new Error(`未找到城市: ${cityName}`)
  }

  const result = data.results[0]

  return {
    ip: 'geocoded',
    city: result.name,
    region: result.admin1 || '',
    country: result.country || '',
    countryCode: result.country_code || '',
    latitude: result.latitude,
    longitude: result.longitude,
    timezone: result.timezone || 'auto',
  }
}

/**
 * 从 Open-Meteo 获取完整天气数据。
 * 包含当前天气、48 小时逐时预报、7 天每日预报。
 */
async function fetchWeather(
  latitude: number,
  longitude: number,
  timezone: string = 'auto'
): Promise<{ current: CurrentWeather; hourly: HourlyForecast[]; daily: DailyForecast[] }> {
  const params = new URLSearchParams({
    latitude: latitude.toString(),
    longitude: longitude.toString(),
    timezone: timezone === 'auto' ? 'auto' : timezone,

    // 当前天气变量
    current: [
      'temperature_2m',
      'relative_humidity_2m',
      'apparent_temperature',
      'is_day',
      'precipitation',
      'rain',
      'snowfall',
      'weather_code',
      'cloud_cover',
      'pressure_msl',
      'surface_pressure',
      'wind_speed_10m',
      'wind_direction_10m',
      'wind_gusts_10m',
      'uv_index',
      'visibility',
    ].join(','),

    // 逐时预报变量（48 小时）
    hourly: [
      'temperature_2m',
      'relative_humidity_2m',
      'apparent_temperature',
      'precipitation_probability',
      'precipitation',
      'weather_code',
      'visibility',
      'wind_speed_10m',
      'uv_index',
      'is_day',
    ].join(','),

    // 每日预报变量（7 天）
    daily: [
      'weather_code',
      'temperature_2m_max',
      'temperature_2m_min',
      'sunrise',
      'sunset',
      'uv_index_max',
      'precipitation_sum',
      'precipitation_probability_max',
      'wind_speed_10m_max',
    ].join(','),

    forecast_days: '7',
    forecast_hours: '48',
  })

  const url = `https://api.open-meteo.com/v1/forecast?${params.toString()}`
  const response = await fetch(url)

  if (!response.ok) {
    throw new Error(`Open-Meteo API error: ${response.status} ${response.statusText}`)
  }

  const data = (await response.json()) as any

  // 构建当前天气对象
  const current: CurrentWeather = {
    temperature: data.current.temperature_2m,
    apparentTemperature: data.current.apparent_temperature,
    weatherCode: data.current.weather_code,
    weatherDescription: getWeatherDescription(data.current.weather_code),
    weatherDescriptionZh: getWeatherDescriptionZh(data.current.weather_code),
    humidity: data.current.relative_humidity_2m,
    pressure: data.current.pressure_msl,
    surfacePressure: data.current.surface_pressure,
    windSpeed: data.current.wind_speed_10m,
    windDirection: data.current.wind_direction_10m,
    windDirectionText: windDirectionToText(data.current.wind_direction_10m),
    windGusts: data.current.wind_gusts_10m,
    cloudCover: data.current.cloud_cover,
    precipitation: data.current.precipitation,
    rain: data.current.rain,
    snowfall: data.current.snowfall,
    isDay: data.current.is_day === 1,
    uvIndex: data.current.uv_index,
    visibility: data.current.visibility,
    observedAt: data.current.time,
  }

  // 构建逐时预报（未来 48 小时）
  const hourly: HourlyForecast[] = []
  const now = new Date()
  const hourlyTimes: string[] = data.hourly.time
  const startIndex = hourlyTimes.findIndex((t: string) => new Date(t) >= now)

  for (let i = Math.max(0, startIndex); i < hourlyTimes.length && i < Math.max(0, startIndex) + 48; i++) {
    hourly.push({
      time: data.hourly.time[i],
      temperature: data.hourly.temperature_2m[i],
      apparentTemperature: data.hourly.apparent_temperature[i],
      humidity: data.hourly.relative_humidity_2m[i],
      precipitationProbability: data.hourly.precipitation_probability[i] ?? 0,
      precipitation: data.hourly.precipitation[i],
      weatherCode: data.hourly.weather_code[i],
      weatherDescription: getWeatherDescription(data.hourly.weather_code[i]),
      weatherDescriptionZh: getWeatherDescriptionZh(data.hourly.weather_code[i]),
      visibility: data.hourly.visibility[i],
      windSpeed: data.hourly.wind_speed_10m[i],
      uvIndex: data.hourly.uv_index[i],
      isDay: data.hourly.is_day[i] === 1,
    })
  }

  // 构建每日预报（7 天）
  const daily: DailyForecast[] = data.daily.time.map((date: string, i: number) => ({
    date,
    weatherCode: data.daily.weather_code[i],
    weatherDescription: getWeatherDescription(data.daily.weather_code[i]),
    weatherDescriptionZh: getWeatherDescriptionZh(data.daily.weather_code[i]),
    tempMax: data.daily.temperature_2m_max[i],
    tempMin: data.daily.temperature_2m_min[i],
    sunrise: data.daily.sunrise[i],
    sunset: data.daily.sunset[i],
    uvIndexMax: data.daily.uv_index_max[i],
    precipitationSum: data.daily.precipitation_sum[i],
    precipitationProbabilityMax: data.daily.precipitation_probability_max[i] ?? 0,
    windSpeedMax: data.daily.wind_speed_10m_max[i],
  }))

  return { current, hourly, daily }
}

// ──────────────────────────────── 常量 ────────────────────────────────

/** 缓存有效期：5 分钟 */
const CACHE_TTL = 5 * 60 * 1000

/** 模块加载时间（用于 health 端点的 uptime，Workers isolate 级别） */
const startTime = Date.now()

// ──────────────────────────────── 路由处理 ────────────────────────────────

/**
 * 天气查询
 * GET /weather/query?city=邢台
 * GET /weather/query?lat=37&lon=114
 * GET /weather/query?ip=8.8.8.8
 * GET /weather/query （自动检测 IP）
 */
async function handleQuery(request: Request, url: URL): Promise<Response> {
  if (request.method !== 'GET') {
    return errorResponse(`Method ${request.method} is not supported. Use GET.`, 405)
  }

  try {
    // 解析查询参数
    const city = url.searchParams.get('city') || undefined
    const latParam = url.searchParams.get('lat')
    const lonParam = url.searchParams.get('lon')
    const lat = latParam ? parseFloat(latParam) : undefined
    const lon = lonParam ? parseFloat(lonParam) : undefined
    const ipOverride = url.searchParams.get('ip') || undefined

    let cacheKey: string
    let location: GeoLocation

    if (city) {
      // 1. 城市名 → 地理编码
      cacheKey = `weather:city:${city}`
      const cached = getCache<WeatherApiResponse>(cacheKey)
      if (cached) {
        return jsonResponse({ ...cached, cached: true })
      }
      location = await geocodeCity(city)
    } else if (lat !== undefined && lon !== undefined && !isNaN(lat) && !isNaN(lon)) {
      // 2. 坐标 → 反向地理编码获取城市名
      cacheKey = `weather:coords:${lat.toFixed(2)},${lon.toFixed(2)}`
      const cached = getCache<WeatherApiResponse>(cacheKey)
      if (cached) {
        return jsonResponse({ ...cached, cached: true })
      }

      // 反向地理编码 GPS 坐标，获取真实城市名
      let cityName = 'GPS 定位'
      let regionName = ''
      let countryName = ''
      let countryCode = ''

      try {
        const geoResp = await fetch(
          `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=zh`
        )
        if (geoResp.ok) {
          const geoData = (await geoResp.json()) as any
          cityName = geoData.city || geoData.locality || geoData.principalSubdivision || '未知位置'
          regionName = geoData.principalSubdivision || ''
          countryName = geoData.countryName || ''
          countryCode = geoData.countryCode || ''
        }
      } catch (e) {
        console.error('Reverse geocoding failed:', e)
      }

      location = {
        ip: 'coordinates',
        city: cityName,
        region: regionName,
        country: countryName,
        countryCode,
        latitude: lat,
        longitude: lon,
        timezone: 'auto',
        provider: 'gps',
      }
    } else {
      // 3. 自动检测 IP（或使用 IP 覆盖）
      cacheKey = `weather:ip:${ipOverride || getClientIp(request.headers)}`
      const cached = getCache<WeatherApiResponse>(cacheKey)
      if (cached) {
        return jsonResponse({ ...cached, cached: true })
      }
      location = await getGeoLocation(request, ipOverride)
    }

    // 获取天气数据
    const { current, hourly, daily } = await fetchWeather(
      location.latitude,
      location.longitude,
      location.timezone
    )

    const responseData: WeatherApiResponse = {
      success: true,
      location,
      current,
      hourly,
      daily,
      fetchedAt: new Date().toISOString(),
      units: {
        temperature: '°C',
        windSpeed: 'km/h',
        precipitation: 'mm',
        pressure: 'hPa',
        visibility: 'meters',
        humidity: '%',
      },
    }

    // 写入缓存
    setCache(cacheKey, responseData, CACHE_TTL)

    return jsonResponse(responseData)
  } catch (error: any) {
    console.error('Weather query error:', error)
    return errorResponse(error.message || 'An unexpected error occurred', 500)
  }
}

/**
 * IP 定位调试
 * GET /weather/location        — 自动检测 IP 并显示地理位置
 * GET /weather/location?ip=x   — 显示指定 IP 的地理位置
 */
async function handleLocation(request: Request, url: URL): Promise<Response> {
  if (request.method !== 'GET') {
    return errorResponse(`Method ${request.method} is not supported. Use GET.`, 405)
  }

  try {
    const ipOverride = url.searchParams.get('ip') || undefined
    const detectedIp = ipOverride || getClientIp(request.headers)
    const { location, provider } = await getGeoLocationWithProvider(request, ipOverride)

    return jsonResponse({
      success: true,
      detectedIp,
      provider,
      location,
      timestamp: new Date().toISOString(),
    })
  } catch (error: any) {
    return errorResponse(error.message || 'An unexpected error occurred', 500)
  }
}

/**
 * 健康检查
 * GET /weather/health
 */
function handleHealth(): Response {
  return jsonResponse({
    success: true,
    status: 'ok',
    service: 'JerryWeatherAPI',
    version: '1.2.0',
    timestamp: new Date().toISOString(),
    uptime: `${((Date.now() - startTime) / 1000).toFixed(1)}s`,
  })
}

// ──────────────────────────────── 路由工具 ────────────────────────────────

/**
 * 提取 url.pathname 中 /weather/ 之后的部分。
 * 例如 /weather/query → 'query'
 */
function extractRoute(url: URL): string {
  const path = url.pathname
  const marker = '/weather/'
  const idx = path.indexOf(marker)
  if (idx === -1) {
    // /weather（无尾部斜杠）
    return ''
  }
  return path.slice(idx + marker.length).replace(/\/+$/, '')
}

// ──────────────────────────────── 主处理函数 ────────────────────────────────

export async function handleWeather(
  request: Request,
  url: URL,
  env: any
): Promise<Response> {
  // OPTIONS 预检请求 → 204 + CORS 头
  if (request.method === 'OPTIONS') {
    return handleOptions()
  }

  const route = extractRoute(url).toLowerCase()

  switch (route) {
    case 'query':
      return await handleQuery(request, url)

    case 'location':
      return await handleLocation(request, url)

    case 'health':
      return handleHealth()

    default:
      return errorResponse(`Not Found: /weather/${route}`, 404)
  }
}
