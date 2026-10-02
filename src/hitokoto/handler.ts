// ============================================================
// Hitokoto (一言) API Module
// Returns random quotes from a large embedded collection
// ============================================================

import { jsonResponse, errorResponse, withEdgeCache } from '../shared'
import { hitokotoData, type Hitokoto } from './data'

// Pre-compute category list and index for fast lookup
const categorySet = new Set(hitokotoData.map(q => q.category))
const categories = Array.from(categorySet)

const categoryIndex = new Map<string, number[]>()
for (let i = 0; i < hitokotoData.length; i++) {
  const cat = hitokotoData[i].category
  if (!categoryIndex.has(cat)) categoryIndex.set(cat, [])
  categoryIndex.get(cat)!.push(i)
}

// 直接返回数组下标，避免调用方对全量数据做 O(n) indexOf 线性查找
function getRandomIndex(category?: string): number {
  if (category) {
    let indices = categoryIndex.get(category)
    if (!indices) {
      const lowerCat = category.toLowerCase()
      const matchedCat = categories.find(c => c.toLowerCase() === lowerCat)
      if (matchedCat) indices = categoryIndex.get(matchedCat)
    }
    if (!indices || indices.length === 0) return -1
    return indices[Math.floor(Math.random() * indices.length)]
  }
  return Math.floor(Math.random() * hitokotoData.length)
}

export async function handleHitokoto(request: Request, url: URL, env: any, ctx?: ExecutionContext): Promise<Response> {
  const subPath = url.pathname.replace(/^\/hitokoto\/?/, '').toLowerCase()

  // /hitokoto/random or /hitokoto/ → random quote (JSON)
  if (subPath === 'random' || subPath === '') {
    const cat = url.searchParams.get('category') || url.searchParams.get('cat') || undefined
    const idx = getRandomIndex(cat)
    if (idx < 0) {
      return errorResponse(`Category "${cat}" not found. Available: ${categories.join(', ')}`, 404)
    }
    const quote: Hitokoto = hitokotoData[idx]

    // Support ?format=text for plain text response
    const format = url.searchParams.get('format')
    if (format === 'text') {
      return new Response(quote.text, {
        headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Access-Control-Allow-Origin': '*' },
      })
    }

    // Support ?encode=jsonp for JSONP
    const callback = url.searchParams.get('callback')
    const body = {
      code: 200,
      message: 'success',
      data: {
        id: idx,
        text: quote.text,
        from: quote.from,
        category: quote.category,
      },
      total: hitokotoData.length,
      timestamp: new Date().toISOString(),
    }

    if (callback) {
      return new Response(`${callback}(${JSON.stringify(body)})`, {
        headers: { 'Content-Type': 'application/javascript; charset=utf-8', 'Access-Control-Allow-Origin': '*' },
      })
    }

    return jsonResponse(body)
  }

  // /hitokoto/list → all quotes (with optional category filter)
  if (subPath === 'list') {
    const cat = url.searchParams.get('category') || url.searchParams.get('cat')
    let data = hitokotoData
    if (cat) {
      data = hitokotoData.filter(q => q.category === cat)
      if (data.length === 0) {
        return errorResponse(`Category "${cat}" not found. Available: ${categories.join(', ')}`, 404)
      }
    }

    // Support pagination
    const page = parseInt(url.searchParams.get('page') || '1')
    const size = Math.min(parseInt(url.searchParams.get('size') || '50'), 200)
    const start = (page - 1) * size
    const paged = data.slice(start, start + size)

    return jsonResponse({
      code: 200,
      message: 'success',
      total: data.length,
      page,
      size,
      pages: Math.ceil(data.length / size),
      data: paged.map((q, i) => ({
        id: start + i,
        text: q.text,
        from: q.from,
        category: q.category,
      })),
      timestamp: new Date().toISOString(),
    })
  }

  // /hitokoto/categories → list all categories with counts
  if (subPath === 'categories') {
    const catCounts = categories.map(cat => ({
      name: cat,
      count: categoryIndex.get(cat)!.length,
    })).sort((a, b) => b.count - a.count)

    return jsonResponse({
      code: 200,
      message: 'success',
      total: hitokotoData.length,
      categories: catCounts,
      timestamp: new Date().toISOString(),
    })
  }

  // /hitokoto/count → total quote count
  if (subPath === 'count') {
    return jsonResponse({
      code: 200,
      message: 'success',
      total: hitokotoData.length,
      categories: categories.length,
      timestamp: new Date().toISOString(),
    })
  }

  // /hitokoto/:id → get quote by ID
  const idMatch = subPath.match(/^(\d+)$/)
  if (idMatch) {
    const id = parseInt(idMatch[1])
    if (id < 0 || id >= hitokotoData.length) {
      return errorResponse(`ID ${id} out of range. Total: ${hitokotoData.length}`, 404)
    }
    const quote = hitokotoData[id]
    return jsonResponse({
      code: 200,
      message: 'success',
      data: {
        id,
        text: quote.text,
        from: quote.from,
        category: quote.category,
      },
      timestamp: new Date().toISOString(),
    })
  }

  return errorResponse(
    `Unknown endpoint: /hitokoto/${subPath}. Available: /hitokoto/random, /hitokoto/list, /hitokoto/categories, /hitokoto/count, /hitokoto/:id`,
    404
  )
}
