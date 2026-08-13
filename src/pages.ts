// ============================================================
// Unified HTML page generators for Jerry Combined API
// Dark theme with BA (Blue Archive) inspired aesthetic
// ============================================================

import { routes } from './music/routes'

// Extract route data for music docs (serializable only)
const musicRoutesData = JSON.stringify(
  Object.entries(routes).map(([path, config]) => ({
    path,
    desc: config.desc || '',
    params: config.params || [],
    crypto: config.crypto || 'weapi',
  }))
)

// ─── Shared CSS ───
const CSS = `
:root {
  --bg: #080b14;
  --bg-2: #0d1320;
  --card: rgba(16, 24, 40, 0.6);
  --card-hover: rgba(20, 30, 50, 0.8);
  --accent: #00d4ff;
  --accent-2: #4d8eff;
  --accent-3: #a855f7;
  --text: #e2e8f0;
  --text-2: #94a3b8;
  --text-3: #64748b;
  --border: rgba(0, 212, 255, 0.12);
  --border-hover: rgba(0, 212, 255, 0.3);
  --code-bg: #0a0f1a;
  --get: #3fb950;
  --post: #f0883e;
  --radius: 12px;
}
*, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }
body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Noto Sans SC', sans-serif;
  background: var(--bg);
  color: var(--text);
  min-height: 100vh;
  line-height: 1.6;
  -webkit-font-smoothing: antialiased;
}
body::before {
  content: '';
  position: fixed;
  inset: 0;
  background:
    radial-gradient(ellipse 800px 600px at 15% 0%, rgba(0, 212, 255, 0.06), transparent),
    radial-gradient(ellipse 600px 800px at 85% 100%, rgba(77, 142, 255, 0.05), transparent),
    radial-gradient(ellipse 1000px 500px at 50% 50%, rgba(168, 85, 247, 0.03), transparent);
  z-index: -1;
}
.navbar {
  position: sticky; top: 0; z-index: 100;
  background: rgba(8, 11, 20, 0.8);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid var(--border);
  padding: 0.75rem 2rem;
  display: flex; align-items: center; justify-content: space-between;
  flex-wrap: wrap; gap: 0.5rem;
}
.navbar-brand {
  font-size: 1.1rem; font-weight: 700; color: var(--accent);
  text-decoration: none; display: flex; align-items: center; gap: 0.5rem;
}
.navbar-brand img { width: 24px; height: 24px; border-radius: 4px; }
.navbar-links { display: flex; gap: 0.25rem; flex-wrap: wrap; }
.navbar-link {
  color: var(--text-2); text-decoration: none;
  padding: 0.4rem 0.8rem; border-radius: 8px;
  font-size: 0.875rem; transition: all 0.2s ease;
}
.navbar-link:hover { color: var(--text); background: rgba(0, 212, 255, 0.08); }
.navbar-link.active { color: var(--accent); background: rgba(0, 212, 255, 0.12); }
.container { max-width: 1100px; margin: 0 auto; padding: 2rem 1.5rem 4rem; }
.hero { text-align: center; padding: 3rem 0 2rem; }
.hero h1 {
  font-size: clamp(2rem, 5vw, 3rem); font-weight: 800; margin-bottom: 0.5rem;
  background: linear-gradient(135deg, var(--accent), var(--accent-2), var(--accent-3));
  -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
}
.hero p { color: var(--text-2); font-size: 1.1rem; }
.hero .badges { display: flex; gap: 0.5rem; justify-content: center; margin-top: 1rem; flex-wrap: wrap; }
.hero-badge {
  background: rgba(0, 212, 255, 0.08); border: 1px solid var(--border);
  color: var(--accent); padding: 0.3rem 0.8rem; border-radius: 20px; font-size: 0.8rem;
}
.cards-grid {
  display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem; margin-top: 2rem;
}
.card {
  background: var(--card); border: 1px solid var(--border); border-radius: var(--radius);
  padding: 1.75rem; text-decoration: none; color: inherit;
  transition: all 0.3s ease; backdrop-filter: blur(8px);
  position: relative; overflow: hidden; opacity: 0; animation: fadeInUp 0.5s ease forwards;
}
.card:nth-child(1) { animation-delay: 0.1s; }
.card:nth-child(2) { animation-delay: 0.2s; }
.card:nth-child(3) { animation-delay: 0.3s; }
.card:nth-child(4) { animation-delay: 0.4s; }
.card::before {
  content: ''; position: absolute; top: 0; left: 0; right: 0; height: 3px;
  background: linear-gradient(90deg, var(--accent), var(--accent-2));
  opacity: 0; transition: opacity 0.3s ease;
}
.card:hover {
  border-color: var(--border-hover); background: var(--card-hover);
  transform: translateY(-4px); box-shadow: 0 8px 32px rgba(0, 212, 255, 0.1);
}
.card:hover::before { opacity: 1; }
.card-icon { font-size: 2.5rem; margin-bottom: 1rem; }
.card h3 { font-size: 1.25rem; margin-bottom: 0.5rem; }
.card p { color: var(--text-2); font-size: 0.9rem; margin-bottom: 1rem; }
.card-meta { display: flex; gap: 0.5rem; align-items: center; }
.card-tag {
  background: rgba(0, 212, 255, 0.1); color: var(--accent);
  padding: 0.25rem 0.6rem; border-radius: 6px; font-size: 0.75rem; font-weight: 600;
}
.section { margin-bottom: 2.5rem; }
.section-title {
  font-size: 1.4rem; font-weight: 700; margin-bottom: 1rem;
  padding-bottom: 0.5rem; border-bottom: 1px solid var(--border);
}
.page-header { margin-bottom: 2rem; }
.back-link {
  color: var(--text-2); text-decoration: none; font-size: 0.875rem;
  margin-bottom: 1rem; display: inline-block; transition: color 0.2s;
}
.back-link:hover { color: var(--accent); }
.page-header h1 { font-size: 2rem; display: flex; align-items: center; gap: 0.75rem; }
.page-header .subtitle { color: var(--text-2); margin-top: 0.5rem; }
.table-wrap { overflow-x: auto; border-radius: var(--radius); border: 1px solid var(--border); }
table { width: 100%; border-collapse: collapse; font-size: 0.875rem; }
th {
  background: var(--bg-2); padding: 0.75rem 1rem; text-align: left;
  font-weight: 600; color: var(--text-2); white-space: nowrap;
}
td { padding: 0.75rem 1rem; border-top: 1px solid var(--border); vertical-align: top; }
tr:hover td { background: rgba(0, 212, 255, 0.03); }
.badge {
  display: inline-block; padding: 0.15rem 0.5rem; border-radius: 4px;
  font-size: 0.75rem; font-weight: 700; letter-spacing: 0.5px;
}
.badge-get { background: rgba(63, 185, 80, 0.15); color: var(--get); }
.badge-post { background: rgba(240, 136, 62, 0.15); color: var(--post); }
code {
  font-family: 'Fira Code', 'Cascadia Code', Consolas, monospace;
  font-size: 0.85rem; color: var(--accent);
}
.code-block {
  background: var(--code-bg); border: 1px solid var(--border);
  border-radius: var(--radius); overflow: hidden; margin: 1rem 0;
}
.code-header {
  display: flex; justify-content: space-between; align-items: center;
  padding: 0.5rem 1rem; background: rgba(0, 212, 255, 0.05);
  border-bottom: 1px solid var(--border);
}
.code-header span { font-size: 0.75rem; color: var(--text-2); }
.copy-btn {
  background: transparent; border: 1px solid var(--border); color: var(--text-2);
  padding: 0.25rem 0.75rem; border-radius: 6px; cursor: pointer;
  font-size: 0.75rem; transition: all 0.2s;
}
.copy-btn:hover { border-color: var(--accent); color: var(--accent); }
.copy-btn.copied { border-color: var(--get); color: var(--get); }
.code-block pre {
  padding: 1rem; overflow-x: auto;
  font-family: 'Fira Code', 'Cascadia Code', Consolas, monospace;
  font-size: 0.85rem; color: var(--text);
}
.param-tag {
  display: inline-block; background: rgba(77, 142, 255, 0.1); color: var(--accent-2);
  padding: 0.1rem 0.4rem; border-radius: 4px; font-size: 0.75rem; margin: 0.1rem;
}
.info-box {
  background: rgba(0, 212, 255, 0.05); border: 1px solid var(--border);
  border-radius: var(--radius); padding: 1rem 1.25rem; margin: 1rem 0;
}
.info-box-title { font-weight: 600; color: var(--accent); margin-bottom: 0.5rem; font-size: 0.9rem; }
.info-box ul { list-style: none; padding: 0; }
.info-box li { padding: 0.2rem 0; font-size: 0.85rem; color: var(--text-2); }
.info-box li::before { content: '> '; color: var(--accent); }
.try-btn {
  display: inline-flex; align-items: center; gap: 0.4rem;
  background: linear-gradient(135deg, var(--accent), var(--accent-2));
  color: var(--bg); padding: 0.5rem 1.25rem; border-radius: 8px;
  text-decoration: none; font-weight: 600; font-size: 0.875rem;
  transition: all 0.2s; border: none; cursor: pointer;
}
.try-btn:hover { transform: translateY(-2px); box-shadow: 0 4px 16px rgba(0, 212, 255, 0.3); }
/* ─── Preview Panel ─── */
.preview-panel {
  margin-top: 2rem;
  background: var(--card); border: 1px solid var(--border); border-radius: var(--radius);
  overflow: hidden;
}
.preview-header {
  display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 0.75rem;
  padding: 1rem 1.25rem;
  background: var(--bg-2); border-bottom: 1px solid var(--border);
}
.preview-header h3 { font-size: 1rem; color: var(--text); }
.preview-controls { display: flex; gap: 0.5rem; align-items: center; flex-wrap: wrap; }
.preview-input {
  padding: 0.45rem 0.75rem; background: var(--code-bg); border: 1px solid var(--border);
  border-radius: 6px; color: var(--text); font-size: 0.85rem; min-width: 160px;
  transition: border-color 0.2s;
}
.preview-input:focus { outline: none; border-color: var(--accent); }
.preview-input::placeholder { color: var(--text-3); }
.preview-select {
  padding: 0.45rem 0.75rem; background: var(--code-bg); border: 1px solid var(--border);
  border-radius: 6px; color: var(--text); font-size: 0.85rem; cursor: pointer;
  transition: border-color 0.2s;
}
.preview-select:focus { outline: none; border-color: var(--accent); }
.preview-btn {
  padding: 0.45rem 1rem; background: linear-gradient(135deg, var(--accent), var(--accent-2));
  color: var(--bg); border: none; border-radius: 6px; font-size: 0.85rem; font-weight: 600;
  cursor: pointer; transition: all 0.2s; white-space: nowrap;
}
.preview-btn:hover { transform: translateY(-1px); box-shadow: 0 4px 12px rgba(0, 212, 255, 0.25); }
.preview-btn:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }
.preview-body {
  padding: 1.25rem;
  min-height: 80px;
  display: flex; align-items: center; justify-content: center;
}
.preview-loading {
  display: flex; align-items: center; gap: 0.5rem; color: var(--text-2); font-size: 0.9rem;
}
.preview-spinner {
  width: 20px; height: 20px; border: 2px solid var(--border); border-top-color: var(--accent);
  border-radius: 50%; animation: spin 0.8s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }
.preview-result { width: 100%; }
.preview-error {
  color: #f87171; text-align: center; font-size: 0.9rem;
  padding: 1rem;
}
.preview-empty {
  color: var(--text-3); text-align: center; font-size: 0.9rem;
}
/* Image preview */
.preview-image {
  max-width: 100%; max-height: 400px; border-radius: 8px;
  display: block; margin: 0 auto; box-shadow: 0 4px 20px rgba(0,0,0,0.4);
}
.preview-image-info {
  text-align: center; margin-top: 0.75rem; color: var(--text-2); font-size: 0.85rem;
}
/* Quote preview */
.preview-quote {
  text-align: center; padding: 1.5rem 0;
}
.preview-quote-text {
  font-size: 1.3rem; color: var(--text); line-height: 1.8; margin-bottom: 0.75rem;
  font-style: italic;
}
.preview-quote-from {
  font-size: 0.9rem; color: var(--accent);
}
.preview-quote-category {
  display: inline-block; margin-left: 0.5rem; font-size: 0.75rem;
  background: rgba(0, 212, 255, 0.1); padding: 0.15rem 0.5rem; border-radius: 4px;
}
/* Hotsearch preview */
.preview-hot-list { list-style: none; padding: 0; }
.preview-hot-item {
  display: flex; align-items: center; gap: 0.75rem; padding: 0.5rem 0;
  border-bottom: 1px solid var(--border); font-size: 0.88rem;
}
.preview-hot-item:last-child { border-bottom: none; }
.preview-hot-rank {
  width: 26px; height: 26px; display: flex; align-items: center; justify-content: center;
  border-radius: 6px; font-weight: 700; font-size: 0.8rem; flex-shrink: 0;
}
.preview-hot-rank.top1 { background: #ef4444; color: #fff; }
.preview-hot-rank.top2 { background: #f97316; color: #fff; }
.preview-hot-rank.top3 { background: #eab308; color: #fff; }
.preview-hot-rank.normal { background: rgba(0, 212, 255, 0.1); color: var(--accent); }
.preview-hot-title { flex: 1; color: var(--text); }
.preview-hot-count { color: var(--text-3); font-size: 0.8rem; white-space: nowrap; }
/* Weather preview */
.preview-weather-card {
  display: flex; align-items: center; gap: 1.5rem; padding: 0.5rem;
  flex-wrap: wrap; justify-content: center;
}
.preview-weather-temp {
  font-size: 3rem; font-weight: 700; color: var(--text); line-height: 1;
}
.preview-weather-desc {
  font-size: 1rem; color: var(--text-2); margin-top: 0.25rem;
}
.preview-weather-detail {
  display: flex; gap: 1.5rem; flex-wrap: wrap; justify-content: center;
  margin-top: 1rem; padding-top: 1rem; border-top: 1px solid var(--border);
}
.preview-weather-meta { text-align: center; }
.preview-weather-meta .val { font-size: 1.1rem; font-weight: 600; color: var(--text); }
.preview-weather-meta .lbl { font-size: 0.75rem; color: var(--text-3); }
/* Music preview */
.preview-music-list { list-style: none; padding: 0; }
.preview-music-item {
  display: flex; align-items: center; gap: 0.75rem; padding: 0.5rem 0;
  border-bottom: 1px solid var(--border); font-size: 0.88rem;
}
.preview-music-item:last-child { border-bottom: none; }
.preview-music-name { flex: 1; color: var(--text); }
.preview-music-artist { color: var(--text-2); font-size: 0.8rem; }
.preview-music-album { color: var(--text-3); font-size: 0.8rem; margin-left: 0.5rem; }
.preview-json {
  background: var(--code-bg); border: 1px solid var(--border); border-radius: 8px;
  padding: 1rem; overflow-x: auto; font-size: 0.8rem; font-family: 'Fira Code', Consolas, monospace;
  color: var(--text); max-height: 400px; overflow-y: auto; white-space: pre-wrap; word-break: break-all;
}
@media (max-width: 640px) {
  width: 100%; padding: 0.6rem 1rem;
  background: var(--code-bg); border: 1px solid var(--border); border-radius: 8px;
  color: var(--text); font-size: 0.9rem; margin-bottom: 1rem; transition: border-color 0.2s;
}
.search-input:focus { outline: none; border-color: var(--accent); }
.search-input::placeholder { color: var(--text-3); }
.route-count { color: var(--text-2); font-size: 0.85rem; margin-bottom: 0.75rem; }
.footer {
  text-align: center; padding: 2rem; color: var(--text-3);
  font-size: 0.8rem; border-top: 1px solid var(--border);
}
.crypto-badge {
  display: inline-block; background: rgba(168, 85, 247, 0.1); color: var(--accent-3);
  padding: 0.1rem 0.4rem; border-radius: 4px; font-size: 0.7rem; font-family: monospace;
}
.feature-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1rem; margin: 1rem 0; }
.feature-item {
  background: var(--card); border: 1px solid var(--border); border-radius: 8px;
  padding: 1rem; font-size: 0.85rem;
}
.feature-item strong { color: var(--accent); display: block; margin-bottom: 0.3rem; }
@keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
@media (max-width: 640px) {
  .navbar { padding: 0.5rem 1rem; }
  .navbar-link { padding: 0.3rem 0.5rem; font-size: 0.8rem; }
  .container { padding: 1.5rem 1rem 3rem; }
  .hero { padding: 2rem 0 1.5rem; }
  .cards-grid { grid-template-columns: 1fr; }
  .page-header h1 { font-size: 1.5rem; }
}
`

// ─── Shared JS (no backticks or ${} inside) ───
const SHARED_JS = `
function copyText(text, btn) {
  navigator.clipboard.writeText(text).then(function() {
    var orig = btn.textContent;
    btn.textContent = '\\u2713 \\u5df2\\u590d\\u5236';
    btn.classList.add('copied');
    setTimeout(function() { btn.textContent = orig; btn.classList.remove('copied'); }, 1500);
  }).catch(function() {
    var ta = document.createElement('textarea');
    ta.value = text; document.body.appendChild(ta); ta.select();
    try { document.execCommand('copy'); } catch(e) {}
    document.body.removeChild(ta);
    var orig = btn.textContent;
    btn.textContent = '\\u2713 \\u5df2\\u590d\\u5236';
    btn.classList.add('copied');
    setTimeout(function() { btn.textContent = orig; btn.classList.remove('copied'); }, 1500);
  });
}
`

// ─── Helpers ───

function escapeHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

function navBar(active: string): string {
  const items = [
    { href: '/', label: '首页', key: 'home' },
    { href: '/ba', label: 'BA 随机图', key: 'ba' },
    { href: '/bing', label: 'Bing 壁纸', key: 'bing' },
    { href: '/hotsearch', label: '每日热搜', key: 'hotsearch' },
    { href: '/hitokoto', label: '一言', key: 'hitokoto' },
    { href: '/weather', label: '天气位置', key: 'weather' },
    { href: '/music', label: '网易云音乐', key: 'music' },
  ]
  const links = items.map(item =>
    `<a class="navbar-link${item.key === active ? ' active' : ''}" href="${item.href}">${item.label}</a>`
  ).join('')
  return `<nav class="navbar">
    <a class="navbar-brand" href="/">
      <img src="https://img.jerry-nis.top/d8703c5c-4c4a-49cc-bd94-3363c9eda2d8.png" alt="logo">
      Jerry Combined API
    </a>
    <div class="navbar-links">${links}</div>
  </nav>`
}

function page(title: string, active: string, content: string, extraScript: string = ''): string {
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} - Jerry Combined API</title>
  <link rel="icon" href="https://img.jerry-nis.top/d8703c5c-4c4a-49cc-bd94-3363c9eda2d8.png">
  <style>${CSS}</style>
</head>
<body>
  ${navBar(active)}
  <main class="container">${content}</main>
  <footer class="footer">Powered by Cloudflare Workers &middot; Jerry Combined API v1.0</footer>
  <script>${SHARED_JS}${extraScript}</script>
</body>
</html>`
}

function badge(method: string): string {
  const cls = method === 'GET' ? 'badge-get' : 'badge-post'
  return `<span class="badge ${cls}">${method}</span>`
}

function codeBlock(code: string, label: string = ''): string {
  const escaped = escapeHtml(code)
  return `<div class="code-block">
    <div class="code-header">
      <span>${label}</span>
      <button class="copy-btn" data-code="${escaped}" onclick="copyText(this.getAttribute('data-code'), this)">复制</button>
    </div>
    <pre>${escaped}</pre>
  </div>`
}

function infoBox(title: string, items: string[]): string {
  const list = items.map(i => `<li>${i}</li>`).join('')
  return `<div class="info-box"><div class="info-box-title">${title}</div><ul>${list}</ul></div>`
}

// ─── Navigation Page ───

export function navPage(): string {
  const cards = [
    { icon: '🎲', title: 'BA 随机图', desc: 'Blue Archive 随机图片服务，支持 302 重定向和 JSON 返回', tag: '3 端点', href: '/ba' },
    { icon: '🖼️', title: 'Bing 每日壁纸', desc: '必应每日高清壁纸，支持 UHD、随机、列表等多种格式', tag: '5 端点', href: '/bing' },
    { icon: '🔥', title: '每日热搜', desc: '知乎、微博、B站、头条热搜聚合，B站 WBI 签名鉴权', tag: '5 端点', href: '/hotsearch' },
    { icon: '💭', title: '一言', desc: '582 条语录随机返回，动漫/文学/诗词/电影/哲理/情感/网络', tag: '580+ 条', href: '/hitokoto' },
    { icon: '🎵', title: '网易云音乐', desc: '歌曲/搜索/歌单/评论，VIP 歌曲多音源解灰', tag: '100+ 端点', href: '/music' },
    { icon: '🌤️', title: '天气 & 位置', desc: 'Open-Meteo 天气数据，IP 定位回退链，48h 逐时预报', tag: '3 端点', href: '/weather' },
  ]
  const cardHtml = cards.map(c =>
    `<a class="card" href="${c.href}">
      <div class="card-icon">${c.icon}</div>
      <h3>${c.title}</h3>
      <p>${c.desc}</p>
      <div class="card-meta"><span class="card-tag">${c.tag}</span></div>
    </a>`
  ).join('')

  const content = `
    <div class="hero">
      <h1>Jerry Combined API</h1>
      <p>六合一 API 服务 &middot; 部署于 Cloudflare Workers</p>
      <div class="badges">
        <span class="hero-badge">Cloudflare Workers</span>
        <span class="hero-badge">TypeScript</span>
        <span class="hero-badge">CORS Ready</span>
        <span class="hero-badge">零依赖</span>
      </div>
    </div>
    <div class="cards-grid">${cardHtml}</div>
  `
  return page('首页', 'home', content)
}

// ─── BA Random Image Docs ───

const baPreviewScript = `
function loadBaPreview() {
  var btn = document.getElementById('baPreviewBtn');
  var body = document.getElementById('baPreviewBody');
  btn.disabled = true;
  btn.textContent = '⏳ 加载中...';
  body.innerHTML = '<div class="preview-loading"><div class="preview-spinner"></div><span>加载中...</span></div>';
  fetch('/ba/json')
    .then(function(r) { return r.json(); })
    .then(function(data) {
      body.innerHTML = '<div class="preview-result">'
        + '<img class="preview-image" src="' + data.url + '" alt="BA Random Image" onload="document.getElementById(\\'baPreviewBtn\\').disabled=false;document.getElementById(\\'baPreviewBtn\\').textContent=\\'🔄 刷新随机图片\\';">'
        + '<div class="preview-image-info">图片已加载 · 共 ' + data.total + ' 张</div>'
        + '</div>';
    })
    .catch(function(err) {
      body.innerHTML = '<div class="preview-error">加载失败: ' + err.message + '</div>';
      btn.disabled = false;
      btn.textContent = '🔄 刷新随机图片';
    });
}
loadBaPreview();
`

export function baDocPage(): string {
  const content = `
    <div class="page-header">
      <a class="back-link" href="/">&larr; 返回首页</a>
      <h1>🎲 BA 随机图 API</h1>
      <p class="subtitle">返回随机 Blue Archive 图片，支持 302 重定向和 JSON 格式</p>
    </div>

    <div class="section">
      <h2 class="section-title">端点列表</h2>
      <div class="table-wrap"><table>
        <thead><tr><th>方法</th><th>路径</th><th>说明</th></tr></thead>
        <tbody>
          <tr><td>${badge('GET')}</td><td><code>/ba/random</code></td><td>302 重定向到随机 BA 图片</td></tr>
          <tr><td>${badge('GET')}</td><td><code>/ba/json</code></td><td>JSON 格式返回随机图片 URL</td></tr>
          <tr><td>${badge('GET')}</td><td><code>/ba/list</code></td><td>返回所有图片 URL 列表</td></tr>
        </tbody>
      </table></div>
    </div>

    <div class="section">
      <h2 class="section-title">使用示例</h2>
      ${codeBlock('GET /ba/random', '302 重定向')}
      ${codeBlock('GET /ba/json', 'JSON 响应')}
      ${codeBlock('GET /ba/list', '全部图片')}
    </div>

    <div class="section">
      <h2 class="section-title">响应示例</h2>
      ${codeBlock('{\n  "code": 200,\n  "message": "success",\n  "url": "https://cdn.jsdmirror.com/gh/Jerrynis2/image-host@main/public/74955ca0-6c54-4fa3-a634-230f5cd2e25a.png",\n  "total": 365,\n  "source": "jsdelivr-cdn"\n}', '/ba/json 响应')}
    </div>

    ${infoBox('详细信息', [
      '图片来源：jsDelivr CDN (cdn.jsdmirror.com)',
      '图库：GitHub Jerrynis2/image-host',
      '图片数量：365+ 张',
      '无参数，无缓存',
    ])}

    <div style="margin-top: 1.5rem;">
      <a class="try-btn" href="/ba/json" target="_blank">试一试 /ba/json →</a>
    </div>

    <div class="preview-panel">
      <div class="preview-header">
        <h3>📸 在线预览</h3>
        <div class="preview-controls">
          <button class="preview-btn" id="baPreviewBtn" onclick="loadBaPreview()">🔄 刷新随机图片</button>
        </div>
      </div>
      <div class="preview-body" id="baPreviewBody">
        <span class="preview-empty">点击按钮加载随机 BA 图片</span>
      </div>
    </div>
  `
  return page('BA 随机图', 'ba', content, baPreviewScript)
}

// ─── Hot Search Docs ───

const hotsearchPreviewScript = `
function loadHotPreview() {
  var btn = document.getElementById('hotPreviewBtn');
  var body = document.getElementById('hotPreviewBody');
  var sel = document.getElementById('hotSource');
  btn.disabled = true;
  btn.textContent = '⏳ 加载中...';
  body.innerHTML = '<div class="preview-loading"><div class="preview-spinner"></div><span>加载中...</span></div>';
  fetch('/hotsearch/' + sel.value)
    .then(function(r) { return r.json(); })
    .then(function(data) {
      var items = [];
      var sources = data.sources || data.data || [];
      if (data.sources) {
        // /all response
        for (var i = 0; i < sources.length; i++) {
          var s = sources[i];
          items = items.concat((s.data || []).slice(0, 10));
        }
      } else {
        items = sources.slice(0, 15);
      }
      if (items.length === 0) {
        body.innerHTML = '<div class="preview-empty">暂无数据</div>';
        btn.disabled = false;
        btn.textContent = '🔥 查询';
        return;
      }
      var html = '<ul class="preview-hot-list">';
      for (var i = 0; i < items.length; i++) {
        var item = items[i];
        var rank = i + 1;
        var rankCls = rank === 1 ? 'top1' : rank === 2 ? 'top2' : rank === 3 ? 'top3' : 'normal';
        html += '<li class="preview-hot-item">'
          + '<span class="preview-hot-rank ' + rankCls + '">' + rank + '</span>'
          + '<span class="preview-hot-title">' + (item.title || item.name || '') + '</span>'
          + '<span class="preview-hot-count">' + (item.hot || item.score || '') + '</span>'
          + '</li>';
      }
      html += '</ul>';
      body.innerHTML = '<div class="preview-result">' + html + '</div>';
      btn.disabled = false;
      btn.textContent = '🔥 查询';
    })
    .catch(function(err) {
      body.innerHTML = '<div class="preview-error">加载失败: ' + err.message + '</div>';
      btn.disabled = false;
      btn.textContent = '🔥 查询';
    });
}
loadHotPreview();
`

export function hotsearchDocPage(): string {
  const content = `
    <div class="page-header">
      <a class="back-link" href="/">&larr; 返回首页</a>
      <h1>🔥 每日热搜 API</h1>
      <p class="subtitle">聚合知乎、微博、B站、头条多个平台的热搜数据</p>
    </div>

    <div class="section">
      <h2 class="section-title">端点列表</h2>
      <div class="table-wrap"><table>
        <thead><tr><th>方法</th><th>路径</th><th>说明</th><th>数据源</th></tr></thead>
        <tbody>
          <tr><td>${badge('GET')}</td><td><code>/hotsearch/all</code></td><td>聚合所有平台</td><td>知乎 + 微博 + B站 + 头条</td></tr>
          <tr><td>${badge('GET')}</td><td><code>/hotsearch/zhihu</code></td><td>知乎热榜</td><td>api.zhihu.com</td></tr>
          <tr><td>${badge('GET')}</td><td><code>/hotsearch/weibo</code></td><td>微博热搜榜</td><td>weibo.com</td></tr>
          <tr><td>${badge('GET')}</td><td><code>/hotsearch/bilibili</code></td><td>B站热门排行</td><td>api.bilibili.com (WBI)</td></tr>
          <tr><td>${badge('GET')}</td><td><code>/hotsearch/toutiao</code></td><td>头条热榜</td><td>toutiao.com</td></tr>
        </tbody>
      </table></div>
    </div>

    <div class="section">
      <h2 class="section-title">使用示例</h2>
      ${codeBlock('GET /hotsearch/all', '全部平台')}
      ${codeBlock('GET /hotsearch/zhihu', '仅知乎')}
      ${codeBlock('GET /hotsearch/bilibili', '仅B站')}
    </div>

    <div class="section">
      <h2 class="section-title">响应结构</h2>
      ${codeBlock('{\n  "code": 200,\n  "message": "success",\n  "updateTime": "2026-08-12T10:00:00Z",\n  "fromCache": false,\n  "sources": [\n    {\n      "name": "zhihu",\n      "title": "知乎",\n      "type": "热榜",\n      "total": 50,\n      "fromCache": false,\n      "updateTime": "...",\n      "data": [\n        { "id": "...", "title": "...", "hot": 123456, "url": "..." }\n      ]\n    }\n  ]\n}', '/hotsearch/all 响应')}
    </div>

    ${infoBox('详细信息', [
      '缓存策略：60 分钟内存缓存（Workers isolate 级别）',
      'B站接口：使用 WBI 签名鉴权，含备用无签名接口',
      '请求超时：10 秒（AbortController）',
      '并发请求：聚合模式使用 Promise.allSettled，互不阻塞',
      '统一字段：id, title, desc, hot, url, mobileUrl, cover, author, timestamp',
    ])}

    <div style="margin-top: 1.5rem;">
      <a class="try-btn" href="/hotsearch/all" target="_blank">试一试 /hotsearch/all →</a>
    </div>

    <div class="preview-panel">
      <div class="preview-header">
        <h3>🔥 实时预览</h3>
        <div class="preview-controls">
          <select class="preview-select" id="hotSource" onchange="loadHotPreview()">
            <option value="all">全部平台</option>
            <option value="zhihu">知乎</option>
            <option value="weibo">微博</option>
            <option value="bilibili">B站</option>
            <option value="toutiao">头条</option>
          </select>
          <button class="preview-btn" id="hotPreviewBtn" onclick="loadHotPreview()">🔥 查询</button>
        </div>
      </div>
      <div class="preview-body" id="hotPreviewBody">
        <span class="preview-empty">加载中...</span>
      </div>
    </div>
  `
  return page('每日热搜', 'hotsearch', content, hotsearchPreviewScript)
}

// ─── Weather Docs ───

const weatherPreviewScript = `
function loadWeatherPreview() {
  var btn = document.getElementById('weatherPreviewBtn');
  var body = document.getElementById('weatherPreviewBody');
  var inp = document.getElementById('weatherCity');
  btn.disabled = true;
  btn.textContent = '⏳ 加载中...';
  body.innerHTML = '<div class="preview-loading"><div class="preview-spinner"></div><span>加载中...</span></div>';
  var city = inp.value.trim() || '北京';
  fetch('/weather/query?city=' + encodeURIComponent(city))
    .then(function(r) { return r.json(); })
    .then(function(data) {
      if (!data.current) {
        body.innerHTML = '<div class="preview-error">未找到该城市天气数据</div>';
        btn.disabled = false;
        btn.textContent = '🌤️ 查询天气';
        return;
      }
      var c = data.current;
      var loc = data.location || {};
      var html = '<div class="preview-result">'
        + '<div class="preview-weather-card">'
        + '<div style="text-align:center;">'
        + '<div class="preview-weather-temp">' + c.temperature + '°</div>'
        + '<div class="preview-weather-desc">' + c.weatherDescriptionZh + ' · ' + (loc.city || '') + '</div>'
        + '</div>'
        + '</div>'
        + '<div class="preview-weather-detail">'
        + '<div class="preview-weather-meta"><div class="val">' + c.humidity + '%</div><div class="lbl">湿度</div></div>'
        + '<div class="preview-weather-meta"><div class="val">' + c.windSpeed + ' km/h</div><div class="lbl">风速</div></div>'
        + '<div class="preview-weather-meta"><div class="val">' + c.uvIndex + '</div><div class="lbl">紫外线</div></div>'
        + '<div class="preview-weather-meta"><div class="val">' + c.visibility + 'm</div><div class="lbl">能见度</div></div>'
        + '</div></div>';
      body.innerHTML = html;
      btn.disabled = false;
      btn.textContent = '🌤️ 查询天气';
    })
    .catch(function(err) {
      body.innerHTML = '<div class="preview-error">加载失败: ' + err.message + '</div>';
      btn.disabled = false;
      btn.textContent = '🌤️ 查询天气';
    });
}
loadWeatherPreview();
`

export function weatherDocPage(): string {
  const content = `
    <div class="page-header">
      <a class="back-link" href="/">&larr; 返回首页</a>
      <h1>🌤️ 天气 & 位置 API</h1>
      <p class="subtitle">基于 Open-Meteo 的天气查询服务，支持城市名、坐标、GPS、IP 定位</p>
    </div>

    <div class="section">
      <h2 class="section-title">端点列表</h2>
      <div class="table-wrap"><table>
        <thead><tr><th>方法</th><th>路径</th><th>说明</th></tr></thead>
        <tbody>
          <tr><td>${badge('GET')}</td><td><code>/weather/query</code></td><td>天气查询（支持城市名/坐标/IP）</td></tr>
          <tr><td>${badge('GET')}</td><td><code>/weather/gps</code></td><td>GPS 反向地理编码 + 天气查询</td></tr>
          <tr><td>${badge('GET')}</td><td><code>/weather/location</code></td><td>IP 地理定位调试</td></tr>
          <tr><td>${badge('GET')}</td><td><code>/weather/health</code></td><td>健康检查</td></tr>
        </tbody>
      </table></div>
    </div>

    <div class="section">
      <h2 class="section-title">GPS 定位端点 (/weather/gps)</h2>
      <p style="color: var(--text-2); font-size: 0.9rem; margin-bottom: 0.75rem;">
        将浏览器 GPS 坐标反向解析为实际地址，并返回当地天气。适用于需要精确城市定位的场景。
      </p>
      <div class="table-wrap"><table>
        <thead><tr><th>参数</th><th>类型</th><th>必填</th><th>说明</th></tr></thead>
        <tbody>
          <tr><td><code>lat</code></td><td>number</td><td>✅ 是</td><td>纬度（-90 ~ 90）</td></tr>
          <tr><td><code>lon</code></td><td>number</td><td>✅ 是</td><td>经度（-180 ~ 180）</td></tr>
          <tr><td><code>weather</code></td><td>string</td><td>否</td><td>设为 false 仅返回位置，不返回天气</td></tr>
        </tbody>
      </table></div>
    </div>

    <div class="section">
      <h2 class="section-title">参数说明 (/weather/query)</h2>
      <div class="table-wrap"><table>
        <thead><tr><th>参数</th><th>类型</th><th>说明</th><th>优先级</th></tr></thead>
        <tbody>
          <tr><td><code>city</code></td><td>string</td><td>城市名（中英文均可）</td><td>1（最高）</td></tr>
          <tr><td><code>lat</code></td><td>number</td><td>纬度（需配合 lon）</td><td>2</td></tr>
          <tr><td><code>lon</code></td><td>number</td><td>经度（需配合 lat）</td><td>2</td></tr>
          <tr><td><code>ip</code></td><td>string</td><td>指定 IP 地址查询</td><td>3</td></tr>
        </tbody>
      </table></div>
      <p style="color: var(--text-2); font-size: 0.85rem; margin-top: 0.5rem;">
        若不提供任何参数，将自动检测请求者 IP 并定位。
      </p>
    </div>

    <div class="section">
      <h2 class="section-title">使用示例</h2>
      ${codeBlock('GET /weather/query?city=北京', '按城市名查询')}
      ${codeBlock('GET /weather/query?lat=39.9&lon=116.4', '按坐标查询')}
      ${codeBlock('GET /weather/query?ip=8.8.8.8', '按 IP 查询')}
      ${codeBlock('GET /weather/query', '自动检测 IP')}
      ${codeBlock('GET /weather/gps?lat=39.9&lon=116.4', 'GPS 反向定位 + 天气')}
      ${codeBlock('GET /weather/gps?lat=39.9&lon=116.4&weather=false', 'GPS 仅定位')}
      ${codeBlock('GET /weather/location', 'IP 定位调试')}
    </div>

    <div class="section">
      <h2 class="section-title">GPS 响应结构</h2>
      ${codeBlock('{\n  "success": true,\n  "coordinates": { "latitude": 39.9, "longitude": 116.4 },\n  "location": {\n    "city": "北京",\n    "locality": "北京",\n    "region": "北京市",\n    "country": "China",\n    "countryCode": "CN",\n    "continent": "Asia"\n  },\n  "reverseGeoProvider": "bigdatacloud",\n  "weather": {\n    "current": { "temperature": 25.3, "weatherDescriptionZh": "晴天", ... },\n    "hourly": [ ... 48小时逐时预报 ... ],\n    "daily": [ ... 7天每日预报 ... ]\n  },\n  "units": { "temperature": "°C", ... },\n  "timestamp": "2026-08-12T10:00:00Z"\n}', '/weather/gps 响应')}
    </div>

    <div class="section">
      <h2 class="section-title">/weather/query 响应结构</h2>
      ${codeBlock('{\n  "success": true,\n  "location": {\n    "city": "北京",\n    "country": "China",\n    "latitude": 39.90,\n    "longitude": 116.40,\n    "timezone": "Asia/Shanghai"\n  },\n  "current": {\n    "temperature": 25.3,\n    "weatherDescriptionZh": "晴天",\n    "humidity": 45,\n    "windSpeed": 12.5,\n    "uvIndex": 6.2\n  },\n  "hourly": [ ... 48小时逐时预报 ... ],\n  "daily": [ ... 7天每日预报 ... ],\n  "fetchedAt": "2026-08-12T10:00:00Z",\n  "units": { "temperature": "°C", "windSpeed": "km/h", ... }\n}', '/weather/query 响应')}
    </div>

    ${infoBox('详细信息', [
      '天气数据源：Open-Meteo (免费、无需 API Key)',
      '地理编码：Open-Meteo Geocoding API',
      '反向地理：BigDataCloud → Nominatim/OSM → 坐标（三重回退，可靠性高）',
      'IP 定位回退链：Cloudflare cf → ipinfo.io → ipwho.is',
      'GPS 定位：/weather/gps 接收浏览器坐标，反向解析为城市名',
      '缓存策略：5 分钟内存缓存',
      '预报范围：当前天气 + 48 小时逐时 + 7 天每日',
      'WMO 天气代码：双语描述（中/英）',
    ])}

    <div style="margin-top: 1.5rem; display: flex; gap: 1rem; flex-wrap: wrap;">
      <a class="try-btn" href="/weather/query?city=北京" target="_blank">试一试 /weather/query →</a>
      <a class="try-btn" href="/weather/gps?lat=39.9&lon=116.4" target="_blank">试一试 /weather/gps →</a>
      <a class="try-btn" href="/weather/health" target="_blank">健康检查 →</a>
    </div>

    <div class="preview-panel">
      <div class="preview-header">
        <h3>🌤️ 实时天气预览</h3>
        <div class="preview-controls">
          <input type="text" class="preview-input" id="weatherCity" placeholder="输入城市名，如：上海、Tokyo" value="北京" onkeydown="if(event.key==='Enter')loadWeatherPreview()">
          <button class="preview-btn" id="weatherPreviewBtn" onclick="loadWeatherPreview()">🌤️ 查询天气</button>
        </div>
      </div>
      <div class="preview-body" id="weatherPreviewBody">
        <span class="preview-empty">加载中...</span>
      </div>
    </div>
  `
  return page('天气位置', 'weather', content, weatherPreviewScript)
}

// ─── Music Docs ───

const musicPreviewScript = `
function loadMusicPreview() {
  var btn = document.getElementById('musicPreviewBtn');
  var body = document.getElementById('musicPreviewBody');
  var inp = document.getElementById('musicSearchInput');
  btn.disabled = true;
  btn.textContent = '⏳ 搜索中...';
  body.innerHTML = '<div class="preview-loading"><div class="preview-spinner"></div><span>搜索中...</span></div>';
  var kw = inp.value.trim() || '周杰伦';
  fetch('/music/search?keywords=' + encodeURIComponent(kw) + '&limit=10')
    .then(function(r) { return r.json(); })
    .then(function(data) {
      var songs = (data.result && data.result.songs) || [];
      if (songs.length === 0) {
        body.innerHTML = '<div class="preview-empty">未找到歌曲</div>';
        btn.disabled = false;
        btn.textContent = '🎵 搜索';
        return;
      }
      var html = '<ul class="preview-music-list">';
      for (var i = 0; i < songs.length; i++) {
        var s = songs[i];
        var artists = [];
        if (s.ar) for (var j = 0; j < s.ar.length; j++) artists.push(s.ar[j].name);
        html += '<li class="preview-music-item">'
          + '<span class="preview-music-name">' + (i + 1) + '. ' + s.name + '</span>'
          + '<span class="preview-music-artist">' + artists.join('/') + '</span>'
          + '<span class="preview-music-album">' + (s.al ? s.al.name : '') + '</span>'
          + '</li>';
      }
      html += '</ul>';
      body.innerHTML = '<div class="preview-result">' + html + '</div>';
      btn.disabled = false;
      btn.textContent = '🎵 搜索';
    })
    .catch(function(err) {
      body.innerHTML = '<div class="preview-error">加载失败: ' + err.message + '</div>';
      btn.disabled = false;
      btn.textContent = '🎵 搜索';
    });
}
loadMusicPreview();
`

export function musicDocPage(): string {
  const musicScript = `
var allRoutes = ${musicRoutesData};
var tableBody = document.getElementById('routeTableBody');
var searchInput = document.getElementById('routeSearch');
var countLabel = document.getElementById('routeCount');

function renderRoutes(list) {
  var html = '';
  for (var i = 0; i < list.length; i++) {
    var r = list[i];
    var paramsHtml = '';
    if (r.params && r.params.length > 0) {
      for (var j = 0; j < r.params.length; j++) {
        paramsHtml += '<span class="param-tag">' + r.params[j] + '</span>';
      }
    } else {
      paramsHtml = '<span style="color:var(--text-3);font-size:0.8rem;">无</span>';
    }
    html += '<tr>'
      + '<td><code>/music/' + r.path + '</code></td>'
      + '<td>' + (r.desc || '-') + '</td>'
      + '<td><span class="crypto-badge">' + r.crypto + '</span></td>'
      + '<td>' + paramsHtml + '</td>'
      + '</tr>';
  }
  tableBody.innerHTML = html;
  countLabel.textContent = '\\u5171 ' + list.length + ' \\u4e2a\\u7aef\\u70b9';
}

searchInput.addEventListener('input', function() {
  var q = this.value.toLowerCase();
  var filtered = allRoutes.filter(function(r) {
    return r.path.toLowerCase().indexOf(q) !== -1
      || (r.desc && r.desc.toLowerCase().indexOf(q) !== -1)
      || (r.params && r.params.some(function(p) { return p.toLowerCase().indexOf(q) !== -1; }));
  });
  renderRoutes(filtered);
});

renderRoutes(allRoutes);
`

  const content = `
    <div class="page-header">
      <a class="back-link" href="/">&larr; 返回首页</a>
      <h1>🎵 网易云音乐 API</h1>
      <p class="subtitle">网易云音乐接口服务，支持 VIP 歌曲多音源解灰、Cookie 登录、120+ 端点</p>
    </div>

    <div class="section">
      <h2 class="section-title">特性</h2>
      <div class="feature-grid">
        <div class="feature-item">
          <strong>VIP 歌曲解灰</strong>
          多音源解灰（6个第三方API）→ eapi+os=pc → Kuwo 兜底，自动检测 freeTrialInfo
        </div>
        <div class="feature-item">
          <strong>加密算法</strong>
          支持 weapi、linuxapi、eapi 三种加密方式，自动匹配路由
        </div>
        <div class="feature-item">
          <strong>Cookie 登录</strong>
          支持通过 cookie 参数或 Cookie 请求头传递 MUSIC_U 等登录凭证
        </div>
        <div class="feature-item">
          <strong>GET / POST</strong>
          所有端点同时支持 GET 和 POST 请求，参数可放在 URL 或 body 中
        </div>
      </div>
    </div>

    <div class="section">
      <h2 class="section-title">常用端点</h2>
      <div class="table-wrap"><table>
        <thead><tr><th>方法</th><th>路径</th><th>说明</th><th>参数</th></tr></thead>
        <tbody>
          <tr><td>${badge('GET')}</td><td><code>/music/search</code></td><td>搜索歌曲</td><td><span class="param-tag">keywords</span><span class="param-tag">limit</span><span class="param-tag">offset</span></td></tr>
          <tr><td>${badge('GET')}</td><td><code>/music/song/url</code></td><td>获取歌曲播放链接</td><td><span class="param-tag">id</span><span class="param-tag">br</span></td></tr>
          <tr><td>${badge('GET')}</td><td><code>/music/song/url/v1</code></td><td>获取歌曲播放链接(v1多音质)</td><td><span class="param-tag">id</span><span class="param-tag">level</span></td></tr>
          <tr><td>${badge('GET')}</td><td><code>/music/song/detail</code></td><td>歌曲详情</td><td><span class="param-tag">ids</span></td></tr>
          <tr><td>${badge('GET')}</td><td><code>/music/song/lyric</code></td><td>获取歌词</td><td><span class="param-tag">id</span></td></tr>
          <tr><td>${badge('GET')}</td><td><code>/music/playlist/detail</code></td><td>歌单详情</td><td><span class="param-tag">id</span></td></tr>
          <tr><td>${badge('GET')}</td><td><code>/music/login/cellphone</code></td><td>手机登录</td><td><span class="param-tag">phone</span><span class="param-tag">password</span></td></tr>
          <tr><td>${badge('GET')}</td><td><code>/music/login/qr/key</code></td><td>二维码登录-生成key</td><td><span class="param-tag">type</span></td></tr>
          <tr><td>${badge('GET')}</td><td><code>/music/cloudsearch</code></td><td>云搜索(更多结果)</td><td><span class="param-tag">keywords</span></td></tr>
          <tr><td>${badge('GET')}</td><td><code>/music/toplist</code></td><td>所有排行榜</td><td>无</td></tr>
        </tbody>
      </table></div>
    </div>

    <div class="section">
      <h2 class="section-title">使用示例</h2>
      ${codeBlock('GET /music/search?keywords=布拉格广场&limit=10', '搜索歌曲')}
      ${codeBlock('GET /music/song/url?id=210049&br=320000', '获取播放链接')}
      ${codeBlock('GET /music/song/lyric?id=210049', '获取歌词')}
      ${codeBlock('GET /music/playlist/detail?id=377867846', '获取歌单详情')}
    </div>

    <div class="section">
      <h2 class="section-title">VIP 解灰说明</h2>
      ${infoBox('解灰策略（优先级从高到低）', [
        '1. 多音源解灰（unblock）：从 6 个第三方 API 获取完整歌曲文件',
        '2. eapi + os=pc：模拟网易云音乐桌面客户端请求',
        '3. Kuwo 音乐匹配：酷我音乐搜索匹配作为最后兜底',
        '4. 试听片段：若以上均失败，返回 30 秒试听片段',
        '自动检测：通过 freeTrialInfo 字段判断是否需要解灰',
        '响应字段：source (netease/unblock/kuwo)、sourceType、freeTrialInfo',
      ])}
    </div>

    <div class="section">
      <h2 class="section-title">Cookie 登录</h2>
      ${codeBlock('GET /music/song/url?id=210049&cookie=MUSIC_U=your_token_here', '通过参数传递 Cookie')}
      ${codeBlock('GET /music/song/url?id=210049\\nCookie: MUSIC_U=your_token_here', '通过请求头传递 Cookie')}
      ${infoBox('Cookie 说明', [
        'MUSIC_U：登录后获取的令牌，用于 VIP 歌曲高品质播放',
        '可通过 /music/login/cellphone 或 /music/login/qr/* 获取',
        'Cookie 同时支持 query 参数和 HTTP Cookie 请求头',
      ])}
    </div>

    <div class="section">
      <h2 class="section-title">全部端点 (${Object.keys(routes).length} 个)</h2>
      <input type="text" class="search-input" id="routeSearch" placeholder="搜索端点名称、描述或参数...">
      <div class="route-count" id="routeCount"></div>
      <div class="table-wrap"><table>
        <thead><tr><th>路径</th><th>描述</th><th>加密</th><th>参数</th></tr></thead>
        <tbody id="routeTableBody"></tbody>
      </table></div>
    </div>

    <div style="margin-top: 1.5rem;">
      <a class="try-btn" href="/music/search?keywords=布拉格广场&limit=5" target="_blank">试一试 /music/search →</a>
    </div>

    <div class="preview-panel">
      <div class="preview-header">
        <h3>🎵 歌曲搜索预览</h3>
        <div class="preview-controls">
          <input type="text" class="preview-input" id="musicSearchInput" placeholder="输入歌曲名或歌手名" value="周杰伦" onkeydown="if(event.key==='Enter')loadMusicPreview()">
          <button class="preview-btn" id="musicPreviewBtn" onclick="loadMusicPreview()">🎵 搜索</button>
        </div>
      </div>
      <div class="preview-body" id="musicPreviewBody">
        <span class="preview-empty">加载中...</span>
      </div>
    </div>
  `
  return page('网易云音乐', 'music', content, musicScript + musicPreviewScript)
}

// ─── Bing Wallpaper Docs ───

const bingPreviewScript = `
function loadBingPreview() {
  var btn = document.getElementById('bingPreviewBtn');
  var body = document.getElementById('bingPreviewBody');
  btn.disabled = true;
  btn.textContent = '⏳ 加载中...';
  body.innerHTML = '<div class="preview-loading"><div class="preview-spinner"></div><span>加载中...</span></div>';
  fetch('/bing/today')
    .then(function(r) { return r.json(); })
    .then(function(data) {
      var d = data.data;
      var img = d.resolutions ? d.resolutions['1920x1080'] : d.url;
      body.innerHTML = '<div class="preview-result">'
        + '<img class="preview-image" src="' + img + '" alt="Bing Wallpaper" onload="document.getElementById(\\'bingPreviewBtn\\').disabled=false;document.getElementById(\\'bingPreviewBtn\\').textContent=\\'🔄 刷新\\';">'
        + '<div class="preview-image-info">' + d.title + ' · ' + d.date + '<br>' + d.copyright + '</div>'
        + '</div>';
    })
    .catch(function(err) {
      body.innerHTML = '<div class="preview-error">加载失败: ' + err.message + '</div>';
      btn.disabled = false;
      btn.textContent = '🔄 刷新';
    });
}
loadBingPreview();
`

export function bingDocPage(): string {
  const content = `
    <div class="page-header">
      <a class="back-link" href="/">&larr; 返回首页</a>
      <h1>🖼️ Bing 每日壁纸 API</h1>
      <p class="subtitle">获取必应每日高清壁纸，支持 302 重定向、JSON 返回、UHD 超高清</p>
    </div>

    <div class="section">
      <h2 class="section-title">端点列表</h2>
      <div class="table-wrap"><table>
        <thead><tr><th>方法</th><th>路径</th><th>说明</th></tr></thead>
        <tbody>
          <tr><td>${badge('GET')}</td><td><code>/bing/today</code></td><td>获取今日壁纸信息（JSON）</td></tr>
          <tr><td>${badge('GET')}</td><td><code>/bing/image</code></td><td>302 重定向到今日壁纸（1920x1080）</td></tr>
          <tr><td>${badge('GET')}</td><td><code>/bing/image/uhd</code></td><td>302 重定向到今日壁纸（UHD 超高清）</td></tr>
          <tr><td>${badge('GET')}</td><td><code>/bing/random</code></td><td>302 重定向到近 8 天随机壁纸</td></tr>
          <tr><td>${badge('GET')}</td><td><code>/bing/list</code></td><td>获取近 8 天壁纸列表（JSON）</td></tr>
        </tbody>
      </table></div>
    </div>

    <div class="section">
      <h2 class="section-title">参数说明 (/bing/list)</h2>
      <div class="table-wrap"><table>
        <thead><tr><th>参数</th><th>类型</th><th>默认</th><th>说明</th></tr></thead>
        <tbody>
          <tr><td><code>count</code></td><td>number</td><td>8</td><td>返回数量（1-8）</td></tr>
        </tbody>
      </table></div>
    </div>

    <div class="section">
      <h2 class="section-title">使用示例</h2>
      ${codeBlock('GET /bing/today', '今日壁纸信息')}
      ${codeBlock('GET /bing/image', '302 重定向到壁纸')}
      ${codeBlock('GET /bing/image/uhd', 'UHD 超高清壁纸')}
      ${codeBlock('GET /bing/random', '随机壁纸')}
      ${codeBlock('GET /bing/list?count=3', '获取 3 天壁纸列表')}
    </div>

    <div class="section">
      <h2 class="section-title">响应示例</h2>
      ${codeBlock('{\n  "code": 200,\n  "message": "success",\n  "data": {\n    "title": "Berck sur Mer",\n    "date": "2026-08-12",\n    "url": "https://cn.bing.com/th?id=OHR.BerckSurMer_ZH-CN...",\n    "copyright": "Berck sur Mer, France (© Mathieu de Fossey/Getty)",\n    "resolutions": {\n      "1920x1080": "https://cn.bing.com/th?id=OHR..._1920x1080.jpg",\n      "UHD": "https://cn.bing.com/th?id=OHR..._UHD.jpg",\n      "1080x1920": "https://cn.bing.com/th?id=OHR..._1080x1920.jpg"\n    }\n  }\n}', '/bing/today 响应')}
    </div>

    ${infoBox('详细信息', [
      '数据源：Bing 中国官网 (cn.bing.com)',
      '壁纸分辨率：1920x1080 / UHD / 1080x1920(竖屏) / 1366x768',
      '缓存策略：30 分钟内存缓存',
      '壁纸范围：最近 8 天',
      '地区：zh-CN（中国区必应）',
    ])}

    <div style="margin-top: 1.5rem; display: flex; gap: 1rem; flex-wrap: wrap;">
      <a class="try-btn" href="/bing/today" target="_blank">试一试 /bing/today →</a>
      <a class="try-btn" href="/bing/image" target="_blank">查看今日壁纸 →</a>
    </div>

    <div class="preview-panel">
      <div class="preview-header">
        <h3>🖼️ 在线预览</h3>
        <div class="preview-controls">
          <button class="preview-btn" id="bingPreviewBtn" onclick="loadBingPreview()">🔄 刷新</button>
        </div>
      </div>
      <div class="preview-body" id="bingPreviewBody">
        <span class="preview-empty">加载中...</span>
      </div>
    </div>
  `
  return page('Bing 壁纸', 'bing', content, bingPreviewScript)
}

// ─── Hitokoto Docs ───

const hitokotoPreviewScript = `
function loadHitokotoPreview() {
  var btn = document.getElementById('hitoPreviewBtn');
  var body = document.getElementById('hitoPreviewBody');
  var sel = document.getElementById('hitoCategory');
  btn.disabled = true;
  btn.textContent = '⏳ 加载中...';
  body.innerHTML = '<div class="preview-loading"><div class="preview-spinner"></div><span>加载中...</span></div>';
  var url = '/hitokoto/random';
  if (sel.value) url += '?category=' + sel.value;
  fetch(url)
    .then(function(r) { return r.json(); })
    .then(function(data) {
      var d = data.data;
      body.innerHTML = '<div class="preview-result"><div class="preview-quote">'
        + '<div class="preview-quote-text">"' + d.text + '"</div>'
        + '<div class="preview-quote-from">—— ' + d.from + '<span class="preview-quote-category">' + d.category + '</span></div>'
        + '</div></div>';
      btn.disabled = false;
      btn.textContent = '🎲 随机一言';
    })
    .catch(function(err) {
      body.innerHTML = '<div class="preview-error">加载失败: ' + err.message + '</div>';
      btn.disabled = false;
      btn.textContent = '🎲 随机一言';
    });
}
loadHitokotoPreview();
`

export function hitokotoDocPage(): string {
  const content = `
    <div class="page-header">
      <a class="back-link" href="/">&larr; 返回首页</a>
      <h1>💭 一言 API</h1>
      <p class="subtitle">582 条语录随机返回，涵盖动漫、文学、诗词、电影、哲理、情感、网络七大分类</p>
    </div>

    <div class="section">
      <h2 class="section-title">端点列表</h2>
      <div class="table-wrap"><table>
        <thead><tr><th>方法</th><th>路径</th><th>说明</th></tr></thead>
        <tbody>
          <tr><td>${badge('GET')}</td><td><code>/hitokoto/random</code></td><td>随机返回一条语录（JSON）</td></tr>
          <tr><td>${badge('GET')}</td><td><code>/hitokoto/list</code></td><td>获取语录列表（支持分页、分类筛选）</td></tr>
          <tr><td>${badge('GET')}</td><td><code>/hitokoto/categories</code></td><td>获取所有分类及数量统计</td></tr>
          <tr><td>${badge('GET')}</td><td><code>/hitokoto/count</code></td><td>获取语录总数</td></tr>
          <tr><td>${badge('GET')}</td><td><code>/hitokoto/:id</code></td><td>按 ID 获取指定语录</td></tr>
        </tbody>
      </table></div>
    </div>

    <div class="section">
      <h2 class="section-title">参数说明</h2>
      <div class="table-wrap"><table>
        <thead><tr><th>参数</th><th>端点</th><th>说明</th></tr></thead>
        <tbody>
          <tr><td><code>category</code></td><td>/hitokoto/random, /list</td><td>分类筛选（动漫/文学/诗词/电影/哲理/情感/网络）</td></tr>
          <tr><td><code>format</code></td><td>/hitokoto/random</td><td>返回格式：json（默认）/ text（纯文本）</td></tr>
          <tr><td><code>callback</code></td><td>/hitokoto/random</td><td>JSONP 回调函数名</td></tr>
          <tr><td><code>page</code></td><td>/hitokoto/list</td><td>页码（默认 1）</td></tr>
          <tr><td><code>size</code></td><td>/hitokoto/list</td><td>每页数量（默认 50，最大 200）</td></tr>
        </tbody>
      </table></div>
    </div>

    <div class="section">
      <h2 class="section-title">分类统计</h2>
      <div class="table-wrap"><table>
        <thead><tr><th>分类</th><th>说明</th><th>数量</th></tr></thead>
        <tbody>
          <tr><td><span class="param-tag">动漫</span></td><td>进击的巨人、鬼灭之刃、你的名字、EVA 等</td><td>96 条</td></tr>
          <tr><td><span class="param-tag">文学</span></td><td>鲁迅、余华、村上春树、太宰治等</td><td>80 条</td></tr>
          <tr><td><span class="param-tag">诗词</span></td><td>李白、杜甫、苏轼、李清照等</td><td>83 条</td></tr>
          <tr><td><span class="param-tag">电影</span></td><td>肖申克的救赎、阿甘正传、霸王别姬等</td><td>78 条</td></tr>
          <tr><td><span class="param-tag">哲理</span></td><td>尼采、叔本华、加缪、庄子等</td><td>83 条</td></tr>
          <tr><td><span class="param-tag">情感</span></td><td>情感/浪漫语录</td><td>80 条</td></tr>
          <tr><td><span class="param-tag">网络</span></td><td>网络流行语和名言</td><td>82 条</td></tr>
        </tbody>
      </table></div>
    </div>

    <div class="section">
      <h2 class="section-title">使用示例</h2>
      ${codeBlock('GET /hitokoto/random', '随机一条语录')}
      ${codeBlock('GET /hitokoto/random?category=动漫', '指定分类')}
      ${codeBlock('GET /hitokoto/random?format=text', '纯文本格式')}
      ${codeBlock('GET /hitokoto/random?callback=cb', 'JSONP 格式')}
      ${codeBlock('GET /hitokoto/list?category=诗词&page=1&size=10', '分页+分类')}
      ${codeBlock('GET /hitokoto/categories', '所有分类')}
      ${codeBlock('GET /hitokoto/42', '按 ID 获取')}
    </div>

    <div class="section">
      <h2 class="section-title">响应示例</h2>
      ${codeBlock('{\n  "code": 200,\n  "message": "success",\n  "data": {\n    "id": 42,\n    "text": "世界是美丽的，就算它充满了悲伤和泪水",\n    "from": "CLANNAD",\n    "category": "动漫"\n  },\n  "total": 582,\n  "timestamp": "2026-08-12T10:00:00Z"\n}', '/hitokoto/random 响应')}
    </div>

    ${infoBox('详细信息', [
      '语录总数：582 条',
      '分类数量：7 个',
      '返回格式：JSON（默认）/ 纯文本 / JSONP',
      '零外部依赖：所有语录内置，无需调用外部 API',
      '支持分页：/hitokoto/list?page=1&size=50',
      '支持分类筛选：?category=动漫',
    ])}

    <div style="margin-top: 1.5rem; display: flex; gap: 1rem; flex-wrap: wrap;">
      <a class="try-btn" href="/hitokoto/random" target="_blank">试一试 /hitokoto/random →</a>
      <a class="try-btn" href="/hitokoto/categories" target="_blank">查看分类统计 →</a>
    </div>

    <div class="preview-panel">
      <div class="preview-header">
        <h3>💭 在线预览</h3>
        <div class="preview-controls">
          <select class="preview-select" id="hitoCategory" onchange="loadHitokotoPreview()">
            <option value="">全部</option>
            <option value="动漫">动漫</option>
            <option value="文学">文学</option>
            <option value="诗词">诗词</option>
            <option value="电影">电影</option>
            <option value="哲理">哲理</option>
            <option value="情感">情感</option>
            <option value="网络">网络</option>
          </select>
          <button class="preview-btn" id="hitoPreviewBtn" onclick="loadHitokotoPreview()">🎲 随机一言</button>
        </div>
      </div>
      <div class="preview-body" id="hitoPreviewBody">
        <span class="preview-empty">加载中...</span>
      </div>
    </div>
  `
  return page('一言', 'hitokoto', content, hitokotoPreviewScript)
}
