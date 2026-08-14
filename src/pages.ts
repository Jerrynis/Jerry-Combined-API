// ============================================================
// Unified HTML page generators for Jerry Combined API
// "Aurora" dark theme — BA (Blue Archive) inspired, modern & refined
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
  --bg: #070b15;
  --bg-2: #0c1322;
  --panel: rgba(255, 255, 255, 0.035);
  --panel-2: rgba(255, 255, 255, 0.06);
  --stroke: rgba(148, 184, 255, 0.12);
  --stroke-2: rgba(148, 184, 255, 0.28);
  --accent: #5aa2ff;
  --accent-2: #38bdf8;
  --accent-3: #a78bfa;
  --accent-4: #f472b6;
  --text: #e8eefb;
  --text-2: #9aa8c4;
  --text-3: #5d6b8a;
  --get: #34d399;
  --post: #fbbf24;
  --radius: 16px;
  --font: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Noto Sans SC', 'PingFang SC', 'Microsoft YaHei', sans-serif;
  --mono: 'JetBrains Mono', 'Fira Code', 'Cascadia Code', Consolas, monospace;
}
*, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }
html { scroll-behavior: smooth; }
body {
  font-family: var(--font);
  background: var(--bg);
  color: var(--text);
  min-height: 100vh;
  line-height: 1.7;
  -webkit-font-smoothing: antialiased;
  overflow-x: hidden;
}
/* Aurora background */
.bg-scene {
  position: fixed; inset: 0; z-index: -2; overflow: hidden;
  background:
    radial-gradient(1200px 700px at 12% -8%, rgba(90, 162, 255, 0.16), transparent 60%),
    radial-gradient(1000px 700px at 88% 0%, rgba(167, 139, 250, 0.13), transparent 60%),
    radial-gradient(900px 900px at 50% 115%, rgba(56, 189, 248, 0.10), transparent 60%),
    var(--bg);
}
.bg-scene::before {
  content: ''; position: absolute; inset: 0;
  background-image:
    linear-gradient(rgba(148,184,255,0.045) 1px, transparent 1px),
    linear-gradient(90deg, rgba(148,184,255,0.045) 1px, transparent 1px);
  background-size: 56px 56px;
  mask-image: radial-gradient(ellipse 80% 60% at 50% 0%, #000 30%, transparent 75%);
  -webkit-mask-image: radial-gradient(ellipse 80% 60% at 50% 0%, #000 30%, transparent 75%);
}
.orb {
  position: absolute; border-radius: 50%; filter: blur(90px); opacity: 0.5;
  animation: float 16s ease-in-out infinite;
}
.orb-1 { width: 420px; height: 420px; background: rgba(90,162,255,0.28); top: -120px; left: -80px; }
.orb-2 { width: 360px; height: 360px; background: rgba(167,139,250,0.24); top: 20%; right: -100px; animation-delay: -6s; }
.orb-3 { width: 300px; height: 300px; background: rgba(56,189,248,0.20); bottom: -80px; left: 30%; animation-delay: -11s; }
@keyframes float {
  0%, 100% { transform: translate(0, 0) scale(1); }
  50% { transform: translate(30px, -30px) scale(1.08); }
}

/* ─── Navbar ─── */
.navbar {
  position: sticky; top: 0; z-index: 100;
  background: rgba(7, 11, 21, 0.72);
  backdrop-filter: blur(18px) saturate(140%);
  -webkit-backdrop-filter: blur(18px) saturate(140%);
  border-bottom: 1px solid var(--stroke);
  padding: 0.7rem 2rem;
  display: flex; align-items: center; justify-content: space-between;
  flex-wrap: wrap; gap: 0.6rem;
}
.navbar-brand {
  font-size: 1.05rem; font-weight: 800; color: var(--text);
  text-decoration: none; display: flex; align-items: center; gap: 0.6rem;
  letter-spacing: 0.2px;
}
.navbar-brand .logo {
  width: 30px; height: 30px; border-radius: 9px;
  box-shadow: 0 0 0 1px var(--stroke-2), 0 6px 18px rgba(90,162,255,0.35);
}
.navbar-brand .brand-name { background: linear-gradient(90deg, var(--accent), var(--accent-2)); -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent; }
.navbar-links { display: flex; gap: 0.2rem; flex-wrap: wrap; }
.navbar-link {
  color: var(--text-2); text-decoration: none;
  padding: 0.42rem 0.85rem; border-radius: 10px;
  font-size: 0.86rem; font-weight: 500; transition: all 0.22s ease;
  position: relative;
}
.navbar-link:hover { color: var(--text); background: var(--panel-2); }
.navbar-link.active { color: #fff; background: linear-gradient(135deg, rgba(90,162,255,0.22), rgba(56,189,248,0.14)); box-shadow: inset 0 0 0 1px var(--stroke-2); }

/* ─── Layout ─── */
.container { max-width: 1120px; margin: 0 auto; padding: 2.2rem 1.5rem 5rem; }
.footer {
  text-align: center; padding: 2.2rem; color: var(--text-3);
  font-size: 0.8rem; border-top: 1px solid var(--stroke);
  background: rgba(7,11,21,0.5);
}
.footer .dot { color: var(--accent); }

/* ─── Hero ─── */
.hero { text-align: center; padding: 4.5rem 0 3rem; position: relative; }
.hero .eyebrow {
  display: inline-flex; align-items: center; gap: 0.5rem;
  font-size: 0.78rem; letter-spacing: 2px; text-transform: uppercase;
  color: var(--accent-2); font-weight: 600;
  padding: 0.35rem 1rem; border-radius: 30px;
  background: rgba(56,189,248,0.08); border: 1px solid var(--stroke);
  margin-bottom: 1.4rem;
}
.hero .eyebrow .pulse { width: 7px; height: 7px; border-radius: 50%; background: var(--get); box-shadow: 0 0 0 0 rgba(52,211,153,0.6); animation: pulse 2s infinite; }
@keyframes pulse { 0% { box-shadow: 0 0 0 0 rgba(52,211,153,0.55); } 70% { box-shadow: 0 0 0 9px rgba(52,211,153,0); } 100% { box-shadow: 0 0 0 0 rgba(52,211,153,0); } }
.hero h1 {
  font-size: clamp(2.6rem, 6vw, 4.2rem); font-weight: 800; line-height: 1.08;
  letter-spacing: -0.5px; margin-bottom: 1rem;
  background: linear-gradient(120deg, #ffffff 10%, var(--accent) 45%, var(--accent-2) 70%, var(--accent-3) 95%);
  -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent;
}
.hero .sub { color: var(--text-2); font-size: 1.12rem; max-width: 640px; margin: 0 auto; }
.hero .badges { display: flex; gap: 0.6rem; justify-content: center; margin-top: 1.6rem; flex-wrap: wrap; }
.hero-badge {
  background: var(--panel); border: 1px solid var(--stroke);
  color: var(--text-2); padding: 0.4rem 1rem; border-radius: 30px;
  font-size: 0.82rem; font-weight: 500; backdrop-filter: blur(6px);
  transition: all 0.2s;
}
.hero-badge:hover { border-color: var(--stroke-2); color: var(--text); transform: translateY(-2px); }
.hero-stats { display: flex; gap: 2.5rem; justify-content: center; margin-top: 2.4rem; flex-wrap: wrap; }
.hero-stat { text-align: center; }
.hero-stat .num { font-size: 1.9rem; font-weight: 800; background: linear-gradient(135deg, var(--accent), var(--accent-2)); -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent; }
.hero-stat .lbl { font-size: 0.78rem; color: var(--text-3); letter-spacing: 1px; text-transform: uppercase; }

/* ─── Cards ─── */
.cards-grid {
  display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.4rem; margin-top: 2.6rem;
}
.card {
  background: var(--panel); border: 1px solid var(--stroke); border-radius: var(--radius);
  padding: 1.8rem; text-decoration: none; color: inherit;
  transition: all 0.35s cubic-bezier(0.2, 0.7, 0.3, 1); backdrop-filter: blur(10px);
  position: relative; overflow: hidden;
  opacity: 0; animation: fadeUp 0.6s ease forwards;
}
.card:nth-child(1) { animation-delay: 0.05s; }
.card:nth-child(2) { animation-delay: 0.12s; }
.card:nth-child(3) { animation-delay: 0.19s; }
.card:nth-child(4) { animation-delay: 0.26s; }
.card:nth-child(5) { animation-delay: 0.33s; }
.card:nth-child(6) { animation-delay: 0.4s; }
.card::before {
  content: ''; position: absolute; inset: 0; opacity: 0; transition: opacity 0.35s;
  background: radial-gradient(600px 200px at 20% 0%, rgba(90,162,255,0.14), transparent 60%);
}
.card::after {
  content: ''; position: absolute; top: 0; left: 0; right: 0; height: 2px;
  background: linear-gradient(90deg, var(--accent), var(--accent-2), var(--accent-3));
  transform: scaleX(0); transform-origin: left; transition: transform 0.4s ease;
}
.card:hover { border-color: var(--stroke-2); background: var(--panel-2); transform: translateY(-6px); box-shadow: 0 18px 44px rgba(5, 10, 25, 0.55); }
.card:hover::before { opacity: 1; }
.card:hover::after { transform: scaleX(1); }
.card-icon {
  width: 54px; height: 54px; border-radius: 14px; display: flex; align-items: center; justify-content: center;
  font-size: 1.7rem; margin-bottom: 1.1rem;
  background: linear-gradient(135deg, rgba(90,162,255,0.16), rgba(56,189,248,0.08));
  border: 1px solid var(--stroke); box-shadow: inset 0 0 18px rgba(90,162,255,0.08);
}
.card h3 { font-size: 1.22rem; font-weight: 700; margin-bottom: 0.45rem; letter-spacing: 0.2px; }
.card p { color: var(--text-2); font-size: 0.9rem; margin-bottom: 1.2rem; line-height: 1.65; }
.card-meta { display: flex; gap: 0.6rem; align-items: center; }
.card-tag {
  background: rgba(90,162,255,0.12); color: var(--accent-2);
  padding: 0.24rem 0.7rem; border-radius: 20px; font-size: 0.74rem; font-weight: 600;
  border: 1px solid var(--stroke);
}
.card-arrow { margin-left: auto; color: var(--text-3); font-size: 1.1rem; transition: all 0.3s; }
.card:hover .card-arrow { color: var(--accent); transform: translateX(4px); }

/* ─── Page header ─── */
.page-header { margin-bottom: 2.2rem; }
.back-link {
  color: var(--text-2); text-decoration: none; font-size: 0.86rem;
  margin-bottom: 1.1rem; display: inline-flex; align-items: center; gap: 0.4rem;
  transition: color 0.2s; padding: 0.3rem 0.8rem; border-radius: 8px; background: var(--panel); border: 1px solid var(--stroke);
}
.back-link:hover { color: var(--accent); border-color: var(--stroke-2); }
.page-header h1 {
  font-size: clamp(1.8rem, 4vw, 2.6rem); font-weight: 800; display: flex; align-items: center; gap: 0.8rem;
  letter-spacing: -0.3px;
}
.page-header h1 .h-icon {
  width: 46px; height: 46px; border-radius: 12px; display: inline-flex; align-items: center; justify-content: center;
  font-size: 1.4rem; background: linear-gradient(135deg, rgba(90,162,255,0.2), rgba(56,189,248,0.1));
  border: 1px solid var(--stroke);
}
.page-header .subtitle { color: var(--text-2); margin-top: 0.7rem; font-size: 1rem; max-width: 720px; }

/* ─── Sections ─── */
.section { margin-bottom: 2.8rem; }
.section-title {
  font-size: 1.25rem; font-weight: 700; margin-bottom: 1.1rem;
  display: flex; align-items: center; gap: 0.6rem;
}
.section-title::before {
  content: ''; width: 4px; height: 20px; border-radius: 3px;
  background: linear-gradient(180deg, var(--accent), var(--accent-2));
}

/* ─── Tables ─── */
.table-wrap { overflow-x: auto; border-radius: var(--radius); border: 1px solid var(--stroke); background: var(--panel); }
table { width: 100%; border-collapse: collapse; font-size: 0.875rem; }
th {
  background: rgba(255,255,255,0.03); padding: 0.8rem 1rem; text-align: left;
  font-weight: 600; color: var(--text-2); white-space: nowrap; font-size: 0.78rem; letter-spacing: 0.6px; text-transform: uppercase;
}
td { padding: 0.8rem 1rem; border-top: 1px solid var(--stroke); vertical-align: top; }
tr:hover td { background: rgba(90,162,255,0.04); }
.table-group td { font-weight: 700; color: var(--text-1); background: rgba(90,162,255,0.08); letter-spacing: .4px; }
.badge { display: inline-block; padding: 0.16rem 0.55rem; border-radius: 6px; font-size: 0.72rem; font-weight: 700; letter-spacing: 0.5px; }
.badge-get { background: rgba(52,211,153,0.14); color: var(--get); }
.badge-post { background: rgba(251,191,36,0.14); color: var(--post); }
code {
  font-family: var(--mono); font-size: 0.82rem; color: var(--accent-2);
  background: rgba(56,189,248,0.08); padding: 0.12rem 0.4rem; border-radius: 5px;
}
.code-block {
  background: rgba(9, 14, 26, 0.85); border: 1px solid var(--stroke);
  border-radius: var(--radius); overflow: hidden; margin: 0.9rem 0;
}
.code-header {
  display: flex; justify-content: space-between; align-items: center;
  padding: 0.5rem 1rem; background: rgba(255,255,255,0.03);
  border-bottom: 1px solid var(--stroke);
}
.code-header span { font-size: 0.75rem; color: var(--text-3); font-family: var(--mono); }
.copy-btn {
  background: transparent; border: 1px solid var(--stroke); color: var(--text-2);
  padding: 0.24rem 0.75rem; border-radius: 7px; cursor: pointer;
  font-size: 0.75rem; transition: all 0.2s;
}
.copy-btn:hover { border-color: var(--accent); color: var(--accent); }
.copy-btn.copied { border-color: var(--get); color: var(--get); }
.code-block pre {
  padding: 1.1rem; overflow-x: auto;
  font-family: var(--mono); font-size: 0.82rem; color: var(--text); line-height: 1.6;
}
.param-tag {
  display: inline-block; background: rgba(167,139,250,0.12); color: var(--accent-3);
  padding: 0.12rem 0.5rem; border-radius: 5px; font-size: 0.74rem; margin: 0.1rem; font-family: var(--mono);
}
.info-box {
  background: linear-gradient(135deg, rgba(90,162,255,0.07), rgba(56,189,248,0.03));
  border: 1px solid var(--stroke); border-radius: var(--radius);
  padding: 1.1rem 1.3rem; margin: 1rem 0;
}
.info-box-title { font-weight: 700; color: var(--accent); margin-bottom: 0.5rem; font-size: 0.9rem; display: flex; align-items: center; gap: 0.5rem; }
.info-box ul { list-style: none; padding: 0; }
.info-box li { padding: 0.22rem 0; font-size: 0.85rem; color: var(--text-2); }
.info-box li::before { content: '▸ '; color: var(--accent-2); }
.try-btn {
  display: inline-flex; align-items: center; gap: 0.45rem;
  background: linear-gradient(135deg, var(--accent), var(--accent-2));
  color: #04101f; padding: 0.55rem 1.3rem; border-radius: 10px;
  text-decoration: none; font-weight: 700; font-size: 0.86rem;
  transition: all 0.25s; border: none; cursor: pointer; box-shadow: 0 6px 20px rgba(56,189,248,0.25);
}
.try-btn:hover { transform: translateY(-2px); box-shadow: 0 10px 28px rgba(56,189,248,0.4); }
.try-btn.ghost { background: var(--panel); color: var(--text); border: 1px solid var(--stroke); box-shadow: none; }
.try-btn.ghost:hover { border-color: var(--stroke-2); color: var(--accent); }

/* ─── Preview panel ─── */
.preview-panel {
  margin-top: 2.2rem;
  background: var(--panel); border: 1px solid var(--stroke); border-radius: var(--radius);
  overflow: hidden; backdrop-filter: blur(10px);
}
.preview-header {
  display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 0.75rem;
  padding: 1rem 1.25rem;
  background: rgba(255,255,255,0.03); border-bottom: 1px solid var(--stroke);
}
.preview-header h3 { font-size: 0.98rem; color: var(--text); display: flex; align-items: center; gap: 0.5rem; }
.preview-header h3 .live { width: 7px; height: 7px; border-radius: 50%; background: var(--get); box-shadow: 0 0 0 0 rgba(52,211,153,0.6); animation: pulse 2s infinite; }
.preview-controls { display: flex; gap: 0.5rem; align-items: center; flex-wrap: wrap; }
.preview-input, .preview-select {
  padding: 0.5rem 0.8rem; background: rgba(9,14,26,0.8); border: 1px solid var(--stroke);
  border-radius: 9px; color: var(--text); font-size: 0.85rem; min-width: 150px;
  transition: border-color 0.2s, box-shadow 0.2s; font-family: var(--font);
}
.preview-input:focus, .preview-select:focus { outline: none; border-color: var(--accent); box-shadow: 0 0 0 3px rgba(90,162,255,0.15); }
.preview-input::placeholder { color: var(--text-3); }
.preview-select { cursor: pointer; }
.preview-btn {
  padding: 0.5rem 1.1rem; background: linear-gradient(135deg, var(--accent), var(--accent-2));
  color: #04101f; border: none; border-radius: 9px; font-size: 0.85rem; font-weight: 700;
  cursor: pointer; transition: all 0.2s; white-space: nowrap;
}
.preview-btn:hover { transform: translateY(-1px); box-shadow: 0 6px 16px rgba(56,189,248,0.3); }
.preview-btn:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }
.preview-body { padding: 1.3rem; min-height: 90px; display: flex; align-items: center; justify-content: center; }
.preview-loading { display: flex; align-items: center; gap: 0.6rem; color: var(--text-2); font-size: 0.9rem; }
.preview-spinner { width: 22px; height: 22px; border: 2px solid var(--stroke); border-top-color: var(--accent); border-radius: 50%; animation: spin 0.8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
.preview-result { width: 100%; animation: fadeUp 0.4s ease; }
.preview-error { color: #f87171; text-align: center; font-size: 0.9rem; padding: 1rem; }
.preview-empty { color: var(--text-3); text-align: center; font-size: 0.9rem; }
@keyframes fadeUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }

/* Image preview */
.preview-image-frame {
  border-radius: 14px; overflow: hidden; position: relative;
  border: 1px solid var(--stroke); box-shadow: 0 16px 40px rgba(5,10,25,0.6);
  max-height: 420px; display: flex; align-items: center; justify-content: center;
  background: rgba(9,14,26,0.5);
}
.preview-image { max-width: 100%; max-height: 420px; display: block; object-fit: contain; }
.preview-image-info { text-align: center; margin-top: 0.8rem; color: var(--text-2); font-size: 0.85rem; }
.preview-image-info .cap { color: var(--text); font-weight: 600; }

/* Quote preview */
.preview-quote {
  text-align: center; padding: 1.6rem 1rem; position: relative;
  max-width: 640px; margin: 0 auto;
}
.preview-quote .qmark {
  font-size: 4.5rem; line-height: 0.6; color: var(--accent); opacity: 0.35;
  font-family: Georgia, serif; display: block; margin-bottom: 0.6rem;
}
.preview-quote-text { font-size: 1.35rem; color: var(--text); line-height: 1.9; font-weight: 500; }
.preview-quote-from { font-size: 0.92rem; color: var(--accent-2); margin-top: 0.9rem; }
.preview-quote-category {
  display: inline-block; margin-left: 0.6rem; font-size: 0.72rem;
  background: rgba(90,162,255,0.14); padding: 0.16rem 0.6rem; border-radius: 20px; color: var(--accent-2);
}

/* Hotsearch preview */
.preview-hot-list { list-style: none; padding: 0; }
.preview-hot-item {
  display: flex; align-items: center; gap: 0.85rem; padding: 0.62rem 0.4rem;
  border-bottom: 1px solid var(--stroke); font-size: 0.88rem; transition: background 0.2s; border-radius: 8px;
}
.preview-hot-item:last-child { border-bottom: none; }
.preview-hot-item:hover { background: rgba(90,162,255,0.05); }
.preview-hot-rank {
  width: 28px; height: 28px; display: flex; align-items: center; justify-content: center;
  border-radius: 8px; font-weight: 800; font-size: 0.8rem; flex-shrink: 0; font-family: var(--mono);
}
.preview-hot-rank.top1 { background: linear-gradient(135deg,#ef4444,#f97316); color: #fff; box-shadow: 0 4px 12px rgba(239,68,68,0.4); }
.preview-hot-rank.top2 { background: linear-gradient(135deg,#f97316,#fbbf24); color: #1a1200; }
.preview-hot-rank.top3 { background: linear-gradient(135deg,#eab308,#f59e0b); color: #1a1200; }
.preview-hot-rank.normal { background: rgba(90,162,255,0.12); color: var(--accent-2); }
.preview-hot-title { flex: 1; color: var(--text); }
.preview-hot-count { color: var(--text-3); font-size: 0.78rem; white-space: nowrap; font-family: var(--mono); }
.preview-hot-src { font-size: 0.7rem; color: var(--accent-3); background: rgba(167,139,250,0.12); padding: 0.1rem 0.45rem; border-radius: 5px; flex-shrink: 0; }

/* Weather preview */
.preview-weather { display: flex; flex-direction: column; gap: 1.2rem; }
.preview-weather-main { display: flex; align-items: center; gap: 1.8rem; flex-wrap: wrap; justify-content: center; }
.preview-weather-icon { font-size: 4.2rem; filter: drop-shadow(0 8px 18px rgba(56,189,248,0.3)); }
.preview-weather-temp { font-size: 4rem; font-weight: 800; color: var(--text); line-height: 1; letter-spacing: -2px; }
.preview-weather-desc { font-size: 1.05rem; color: var(--text-2); margin-top: 0.3rem; }
.preview-weather-loc { font-size: 0.82rem; color: var(--accent-2); }
.preview-weather-detail { display: flex; gap: 1.6rem; flex-wrap: wrap; justify-content: center; padding-top: 1rem; border-top: 1px solid var(--stroke); }
.preview-weather-meta { text-align: center; min-width: 70px; }
.preview-weather-meta .val { font-size: 1.15rem; font-weight: 700; color: var(--text); }
.preview-weather-meta .lbl { font-size: 0.72rem; color: var(--text-3); margin-top: 0.15rem; }
.preview-hourly { display: flex; gap: 0.5rem; overflow-x: auto; padding: 0.6rem 0.2rem; }
.preview-hour { flex: 0 0 auto; text-align: center; padding: 0.5rem 0.7rem; border-radius: 10px; background: rgba(255,255,255,0.03); border: 1px solid var(--stroke); min-width: 58px; }
.preview-hour .h-time { font-size: 0.7rem; color: var(--text-3); }
.preview-hour .h-ic { font-size: 1.1rem; margin: 0.2rem 0; }
.preview-hour .h-temp { font-size: 0.82rem; font-weight: 700; color: var(--text); }

/* Music preview */
.preview-music-list { list-style: none; padding: 0; display: flex; flex-direction: column; gap: 0.5rem; }
.preview-music-item {
  display: flex; align-items: center; gap: 0.9rem; padding: 0.6rem 0.7rem;
  border: 1px solid var(--stroke); border-radius: 12px; font-size: 0.88rem;
  background: rgba(255,255,255,0.02); transition: all 0.2s;
}
.preview-music-item:hover { border-color: var(--stroke-2); background: rgba(90,162,255,0.05); }
.preview-music-cover {
  width: 42px; height: 42px; border-radius: 9px; flex-shrink: 0; object-fit: cover;
  border: 1px solid var(--stroke); background: linear-gradient(135deg, rgba(90,162,255,0.2), rgba(167,139,250,0.15));
}
.preview-music-idx { width: 20px; color: var(--text-3); font-family: var(--mono); font-size: 0.78rem; text-align: right; flex-shrink: 0; }
.preview-music-name { flex: 1; color: var(--text); font-weight: 600; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.preview-music-artist { color: var(--text-2); font-size: 0.8rem; max-width: 180px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.preview-music-album { color: var(--text-3); font-size: 0.76rem; max-width: 140px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.preview-music-play {
  width: 30px; height: 30px; border-radius: 50%; border: 1px solid var(--stroke-2); background: var(--panel);
  color: var(--accent); cursor: pointer; font-size: 0.8rem; display: flex; align-items: center; justify-content: center;
  transition: all 0.2s; flex-shrink: 0;
}
.preview-music-play:hover { background: linear-gradient(135deg, var(--accent), var(--accent-2)); color: #04101f; border-color: transparent; }
.preview-music-tag { font-size: 0.68rem; padding: 0.12rem 0.45rem; border-radius: 5px; background: rgba(167,139,250,0.14); color: var(--accent-3); flex-shrink: 0; }
.preview-music-tag.unblock { background: rgba(52,211,153,0.14); color: var(--get); }

/* Match (解灰) preview */
.match-result {
  display: flex; align-items: center; gap: 1rem; padding: 1rem; border-radius: 12px;
  border: 1px solid var(--stroke); background: rgba(255,255,255,0.02); flex-wrap: wrap;
}
.match-result .m-url { flex: 1; font-family: var(--mono); font-size: 0.78rem; color: var(--text-2); word-break: break-all; min-width: 200px; }
.match-result .m-src { font-size: 0.72rem; padding: 0.16rem 0.5rem; border-radius: 20px; background: rgba(52,211,153,0.14); color: var(--get); font-weight: 600; }
.match-result .m-play { width: 36px; height: 36px; border-radius: 50%; border: 1px solid var(--stroke-2); background: var(--panel); color: var(--accent); cursor: pointer; font-size: 0.9rem; }

.preview-json {
  background: rgba(9,14,26,0.85); border: 1px solid var(--stroke); border-radius: 10px;
  padding: 1rem; overflow-x: auto; font-size: 0.78rem; font-family: var(--mono);
  color: var(--text); max-height: 400px; overflow-y: auto; white-space: pre-wrap; word-break: break-all;
}
.search-input {
  width: 100%; padding: 0.6rem 1rem; background: rgba(9,14,26,0.8); border: 1px solid var(--stroke);
  border-radius: 10px; color: var(--text); font-size: 0.9rem; margin-bottom: 1rem; transition: border-color 0.2s, box-shadow 0.2s;
}
.search-input:focus { outline: none; border-color: var(--accent); box-shadow: 0 0 0 3px rgba(90,162,255,0.15); }
.search-input::placeholder { color: var(--text-3); }
.route-count { color: var(--text-2); font-size: 0.85rem; margin-bottom: 0.75rem; }
.crypto-badge {
  display: inline-block; background: rgba(167,139,250,0.12); color: var(--accent-3);
  padding: 0.12rem 0.5rem; border-radius: 5px; font-size: 0.72rem; font-family: var(--mono);
}
.feature-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 1rem; margin: 1rem 0; }
.feature-item {
  background: var(--panel); border: 1px solid var(--stroke); border-radius: 12px;
  padding: 1.1rem; font-size: 0.85rem; transition: all 0.25s;
}
.feature-item:hover { border-color: var(--stroke-2); transform: translateY(-3px); }
.feature-item strong { color: var(--accent); display: block; margin-bottom: 0.35rem; font-size: 0.92rem; }

@media (max-width: 640px) {
  .navbar { padding: 0.5rem 1rem; }
  .navbar-link { padding: 0.3rem 0.55rem; font-size: 0.8rem; }
  .container { padding: 1.5rem 1rem 3.5rem; }
  .hero { padding: 3rem 0 2rem; }
  .cards-grid { grid-template-columns: 1fr; }
  .page-header h1 { font-size: 1.6rem; }
  .preview-weather-temp { font-size: 3rem; }
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
function esc(s) {
  return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
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
  return `<div class="bg-scene"><div class="orb orb-1"></div><div class="orb orb-2"></div><div class="orb orb-3"></div></div>
  <nav class="navbar">
    <a class="navbar-brand" href="/">
      <img class="logo" src="https://img.jerry-nis.top/d8703c5c-4c4a-49cc-bd94-3363c9eda2d8.png" alt="logo">
      <span class="brand-name">Jerry API</span>
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
  <title>${title} · Jerry API</title>
  <link rel="icon" href="https://img.jerry-nis.top/d8703c5c-4c4a-49cc-bd94-3363c9eda2d8.png">
  <style>${CSS}</style>
</head>
<body>
  ${navBar(active)}
  <main class="container">${content}</main>
  <footer class="footer">Powered by Cloudflare Workers <span class="dot">·</span> Jerry Combined API <span class="dot">·</span> v1.2</footer>
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
    { icon: '🎲', title: 'BA 随机图', desc: 'Blue Archive 随机图片服务，支持 302 重定向和 JSON 返回', tag: '2 端点', href: '/ba' },
    { icon: '🖼️', title: 'Bing 每日壁纸', desc: '必应每日高清壁纸，支持 UHD、随机、列表等多种格式', tag: '5 端点', href: '/bing' },
    { icon: '🔥', title: '每日热搜', desc: '知乎、微博、B站、头条热搜聚合，B站 WBI 签名鉴权', tag: '5 端点', href: '/hotsearch' },
    { icon: '💭', title: '一言', desc: '582 条语录随机返回，动漫/文学/诗词/电影/哲理/情感/网络', tag: '580+ 条', href: '/hitokoto' },
    { icon: '🎵', title: '网易云音乐', desc: '歌曲/搜索/歌单/评论，VIP 歌曲多音源解灰', tag: '120+ 端点', href: '/music' },
    { icon: '🌤️', title: '天气 & 位置', desc: 'Open-Meteo 天气数据，IP 定位回退链，48h 逐时预报', tag: '3 端点', href: '/weather' },
  ]
  const cardHtml = cards.map(c =>
    `<a class="card" href="${c.href}">
      <div class="card-icon">${c.icon}</div>
      <h3>${c.title}</h3>
      <p>${c.desc}</p>
      <div class="card-meta"><span class="card-tag">${c.tag}</span><span class="card-arrow">→</span></div>
    </a>`
  ).join('')

  const content = `
    <div class="hero">
      <span class="eyebrow"><span class="pulse"></span> Jerry Combined API · 在线服务</span>
      <h1>六合一 API 服务</h1>
      <p class="sub">图片 · 壁纸 · 热搜 · 一言 · 音乐 · 天气，一个入口全部搞定，部署于 Cloudflare Workers。</p>
      <div class="badges">
        <span class="hero-badge">Cloudflare Workers</span>
        <span class="hero-badge">TypeScript</span>
        <span class="hero-badge">CORS Ready</span>
        <span class="hero-badge">零依赖</span>
      </div>
      <div class="hero-stats">
        <div class="hero-stat"><div class="num">6</div><div class="lbl">模块</div></div>
        <div class="hero-stat"><div class="num">130+</div><div class="lbl">端点</div></div>
        <div class="hero-stat"><div class="num">580+</div><div class="lbl">语录</div></div>
        <div class="hero-stat"><div class="num">365+</div><div class="lbl">图片</div></div>
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
  btn.textContent = '\\u23f3 \\u52a0\\u8f7d\\u4e2d...';
  body.innerHTML = '<div class="preview-loading"><div class="preview-spinner"></div><span>\\u52a0\\u8f7d\\u4e2d...</span></div>';
  fetch('/ba/json')
    .then(function(r) { return r.json(); })
    .then(function(data) {
      body.innerHTML = '<div class="preview-result">'
        + '<div class="preview-image-frame"><img class="preview-image" src="' + data.url + '" alt="BA Random Image" onload="document.getElementById(\\'baPreviewBtn\\').disabled=false;document.getElementById(\\'baPreviewBtn\\').textContent=\\'\\ud83d\\udd04 \\u5237\\u65b0\\u968f\\u673a\\u56fe\\u7247\\';">'
        + '</div>'
        + '<div class="preview-image-info"><span class="cap">Blue Archive</span> · 随机图片已加载</div>'
        + '</div>';
    })
    .catch(function(err) {
      body.innerHTML = '<div class="preview-error">\\u52a0\\u8f7d\\u5931\\u8d25: ' + err.message + '</div>';
      btn.disabled = false;
      btn.textContent = '\\ud83d\\udd04 \\u5237\\u65b0\\u968f\\u673a\\u56fe\\u7247';
    });
}
loadBaPreview();
`

export function baDocPage(): string {
  const content = `
    <div class="page-header">
      <a class="back-link" href="/">← 返回首页</a>
      <h1><span class="h-icon">🎲</span> BA 随机图 API</h1>
      <p class="subtitle">随机 Blue Archive 图片，分「官方图」与「画师图」两种来源，支持 302 重定向和 JSON 格式</p>
    </div>

    <div class="section">
      <h2 class="section-title">端点列表</h2>
      <div class="table-wrap"><table>
        <thead><tr><th>方法</th><th>路径</th><th>说明</th></tr></thead>
        <tbody>
          <tr><td colspan="3" class="table-group">🎨 ba随机官方图（接口不变）</td></tr>
          <tr><td>${badge('GET')}</td><td><code>/ba/random</code></td><td>302 重定向到随机官方 BA 图片</td></tr>
          <tr><td>${badge('GET')}</td><td><code>/ba/json</code></td><td>JSON 格式返回随机官方图片 URL</td></tr>
          <tr><td colspan="3" class="table-group">🖌️ ba随机画师图（来源 R2）</td></tr>
          <tr><td>${badge('GET')}</td><td><code>/ba/artist</code></td><td>302 重定向到随机画师 BA 图片</td></tr>
          <tr><td>${badge('GET')}</td><td><code>/ba/artist/json</code></td><td>JSON 格式返回随机画师图片 URL</td></tr>
        </tbody>
      </table></div>
    </div>

    <div class="section">
      <h2 class="section-title">请求参数（仅画师图）</h2>
      <div class="table-wrap"><table>
        <thead><tr><th>参数</th><th>取值</th><th>说明</th></tr></thead>
        <tbody>
          <tr><td><code>orientation</code></td><td><code>landscape</code> / <code>portrait</code></td><td>横屏 / 竖屏；不传则横竖随机</td></tr>
        </tbody>
      </table></div>
      <p style="margin-top:.6rem;color:var(--text-2);font-size:.9rem">也支持 <code>horizontal</code>、<code>vertical</code>、<code>横屏</code>、<code>竖屏</code> 等写法。</p>
    </div>

    <div class="section">
      <h2 class="section-title">使用示例</h2>
      ${codeBlock('GET /ba/random', '官方图 302 重定向')}
      ${codeBlock('GET /ba/artist?orientation=landscape', '画师图 · 横屏 302 重定向')}
      ${codeBlock('GET /ba/artist?orientation=portrait', '画师图 · 竖屏 302 重定向')}
      ${codeBlock('GET /ba/artist/json', '画师图 JSON 响应（横竖随机）')}
    </div>

    <div class="section">
      <h2 class="section-title">响应示例</h2>
      ${codeBlock('{\n  "code": 200,\n  "message": "success",\n  "url": "https://cdn.jsdmirror.com/gh/Jerrynis2/image-host@main/public/74955ca0-6c54-4fa3-a634-230f5cd2e25a.png",\n  "source": "jsdelivr-cdn"\n}', '/ba/json 响应')}
      ${codeBlock('{\n  "code": 200,\n  "message": "success",\n  "url": "https://r2.jerrynis.com/landscape/0052205a-054a-44b1-9e2b-185edf1fa8e3_148312615.jpg",\n  "source": "r2-cdn",\n  "orientation": "landscape"\n}', '/ba/artist/json 响应')}
    </div>

    ${infoBox('详细信息', [
      '官方图：jsDelivr CDN (cdn.jsdmirror.com)，来源 GitHub Jerrynis2/image-host，接口不变、无参数',
      '画师图：R2 存储 (r2.jerrynis.com)，共 1600 张，横屏 273 张 / 竖屏 1327 张，支持 orientation 参数',
    ])}

    <div style="margin-top: 1.5rem;">
      <a class="try-btn" href="/ba/json" target="_blank">官方图 /ba/json →</a>
      <a class="try-btn ghost" href="/ba/artist/json" target="_blank">画师图 JSON →</a>
      <a class="try-btn ghost" href="/ba/artist?orientation=landscape" target="_blank">画师图·横屏 →</a>
    </div>

    <div class="preview-panel">
      <div class="preview-header">
        <h3><span class="live"></span> 在线预览</h3>
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
  var srcLabel = sel.options[sel.selectedIndex].text;
  btn.disabled = true;
  btn.textContent = '\\u23f3 \\u52a0\\u8f7d\\u4e2d...';
  body.innerHTML = '<div class="preview-loading"><div class="preview-spinner"></div><span>\\u52a0\\u8f7d\\u4e2d...</span></div>';
  fetch('/hotsearch/' + sel.value)
    .then(function(r) { return r.json(); })
    .then(function(data) {
      var items = [];
      var sources = data.sources || data.data || [];
      var srcTag = srcLabel;
      if (data.sources) {
        for (var i = 0; i < sources.length; i++) {
          var s = sources[i];
          var arr = (s.data || []).slice(0, 5);
          for (var j = 0; j < arr.length; j++) {
            arr[j]._src = s.title || s.name;
            items.push(arr[j]);
          }
        }
      } else {
        var singleArr = (sources.data || []).slice(0, 15);
        for (var k = 0; k < singleArr.length; k++) {
          singleArr[k]._src = srcTag;
          items.push(singleArr[k]);
        }
      }
      if (items.length === 0) {
        body.innerHTML = '<div class="preview-empty">\\u6682\\u65e0\\u6570\\u636e</div>';
        btn.disabled = false;
        btn.textContent = '\\ud83d\\udd25 \\u67e5\\u8be2';
        return;
      }
      var html = '<ul class="preview-hot-list">';
      for (var i = 0; i < items.length; i++) {
        var item = items[i];
        var rank = i + 1;
        var rankCls = rank === 1 ? 'top1' : rank === 2 ? 'top2' : rank === 3 ? 'top3' : 'normal';
        html += '<li class="preview-hot-item">'
          + '<span class="preview-hot-rank ' + rankCls + '">' + rank + '</span>'
          + '<span class="preview-hot-title">' + esc(item.title || item.name || '') + '</span>'
          + '<span class="preview-hot-src">' + esc(item._src || '') + '</span>'
          + '<span class="preview-hot-count">' + esc(item.hot || item.score || '') + '</span>'
          + '</li>';
      }
      html += '</ul>';
      body.innerHTML = '<div class="preview-result">' + html + '</div>';
      btn.disabled = false;
      btn.textContent = '\\ud83d\\udd25 \\u67e5\\u8be2';
    })
    .catch(function(err) {
      body.innerHTML = '<div class="preview-error">\\u52a0\\u8f7d\\u5931\\u8d25: ' + err.message + '</div>';
      btn.disabled = false;
      btn.textContent = '\\ud83d\\udd25 \\u67e5\\u8be2';
    });
}
loadHotPreview();
`

export function hotsearchDocPage(): string {
  const content = `
    <div class="page-header">
      <a class="back-link" href="/">← 返回首页</a>
      <h1><span class="h-icon">🔥</span> 每日热搜 API</h1>
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
        <h3><span class="live"></span> 实时预览</h3>
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
var WMO_ICON = {0:'\\u2600\\ufe0f',1:'\\ud83c\\udf15',2:'\\u26c5',3:'\\u2601\\ufe0f',45:'\\ud83c\\udf2b\\ufe0f',48:'\\ud83c\\udf2b\\ufe0f',51:'\\ud83c\\udf27\\ufe0f',53:'\\ud83c\\udf27\\ufe0f',55:'\\ud83c\\udf27\\ufe0f',61:'\\ud83c\\udf27\\ufe0f',63:'\\ud83c\\udf27\\ufe0f',65:'\\ud83c\\udf27\\ufe0f',66:'\\ud83c\\udf28\\ufe0f',67:'\\ud83c\\udf28\\ufe0f',71:'\\u2744\\ufe0f',73:'\\u2744\\ufe0f',75:'\\u2744\\ufe0f',77:'\\u2744\\ufe0f',80:'\\ud83c\\udf27\\ufe0f',81:'\\ud83c\\udf27\\ufe0f',82:'\\ud83c\\udf27\\ufe0f',85:'\\u2744\\ufe0f',86:'\\u2744\\ufe0f',95:'\\u26a1',96:'\\u26a1',99:'\\u26a1'};
function wmoIcon(code) { return WMO_ICON[code] || '\\ud83c\\udf24\\ufe0f'; }
function loadWeatherPreview() {
  var btn = document.getElementById('weatherPreviewBtn');
  var body = document.getElementById('weatherPreviewBody');
  var inp = document.getElementById('weatherCity');
  btn.disabled = true;
  btn.textContent = '\\u23f3 \\u52a0\\u8f7d\\u4e2d...';
  body.innerHTML = '<div class="preview-loading"><div class="preview-spinner"></div><span>\\u52a0\\u8f7d\\u4e2d...</span></div>';
  var city = inp.value.trim() || '\\u5317\\u4eac';
  fetch('/weather/query?city=' + encodeURIComponent(city))
    .then(function(r) { return r.json(); })
    .then(function(data) {
      if (!data.current) {
        body.innerHTML = '<div class="preview-error">\\u672a\\u627e\\u5230\\u8be5\\u57ce\\u5e02\\u5929\\u6c14\\u6570\\u636e</div>';
        btn.disabled = false;
        btn.textContent = '\\ud83c\\udf24\\ufe0f \\u67e5\\u8be2\\u5929\\u6c14';
        return;
      }
      var c = data.current;
      var loc = data.location || {};
      var html = '<div class="preview-result"><div class="preview-weather">'
        + '<div class="preview-weather-main">'
        + '<div class="preview-weather-icon">' + wmoIcon(c.weatherCode) + '</div>'
        + '<div style="text-align:left;">'
        + '<div class="preview-weather-temp">' + c.temperature + '°</div>'
        + '<div class="preview-weather-desc">' + esc(c.weatherDescriptionZh || '') + '</div>'
        + '<div class="preview-weather-loc">' + esc(loc.city || '') + ' · ' + esc(loc.country || '') + '</div>'
        + '</div>'
        + '</div>'
        + '<div class="preview-weather-detail">'
        + '<div class="preview-weather-meta"><div class="val">' + c.humidity + '%</div><div class="lbl">\\u6e7f\\u5ea6</div></div>'
        + '<div class="preview-weather-meta"><div class="val">' + c.precipitation + 'mm</div><div class="lbl">\\u964d\\u6c34\\u91cf</div></div>'
        + '<div class="preview-weather-meta"><div class="val">' + c.windSpeed + '</div><div class="lbl">\\u98ce\\u901f km/h</div></div>'
        + '<div class="preview-weather-meta"><div class="val">' + c.uvIndex + '</div><div class="lbl">\\u7d2b\\u5916\\u7ebf</div></div>'
        + '<div class="preview-weather-meta"><div class="val">' + c.visibility + 'm</div><div class="lbl">\\u80fd\\u89c1\\u5ea6</div></div>'
        + '</div>';
      if (data.hourly && data.hourly.length > 0) {
        html += '<div class="preview-hourly">';
        for (var i = 0; i < Math.min(data.hourly.length, 12); i++) {
          var h = data.hourly[i];
          var t = (h.time || '').substring(11, 16);
          html += '<div class="preview-hour"><div class="h-time">' + t + '</div><div class="h-ic">' + wmoIcon(h.weatherCode) + '</div><div class="h-temp">' + h.temperature + '°</div></div>';
        }
        html += '</div>';
      }
      html += '</div></div>';
      body.innerHTML = html;
      btn.disabled = false;
      btn.textContent = '\\ud83c\\udf24\\ufe0f \\u67e5\\u8be2\\u5929\\u6c14';
    })
    .catch(function(err) {
      body.innerHTML = '<div class="preview-error">\\u52a0\\u8f7d\\u5931\\u8d25: ' + err.message + '</div>';
      btn.disabled = false;
      btn.textContent = '\\ud83c\\udf24\\ufe0f \\u67e5\\u8be2\\u5929\\u6c14';
    });
}
loadWeatherPreview();
`

export function weatherDocPage(): string {
  const content = `
    <div class="page-header">
      <a class="back-link" href="/">← 返回首页</a>
      <h1><span class="h-icon">🌤️</span> 天气 & 位置 API</h1>
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
    </div>

    <div class="section">
      <h2 class="section-title">使用示例</h2>
      ${codeBlock('GET /weather/query?city=北京', '按城市名查询')}
      ${codeBlock('GET /weather/query?lat=39.9&lon=116.4', '按坐标查询')}
      ${codeBlock('GET /weather/gps?lat=39.9&lon=116.4', 'GPS 反向定位 + 天气')}
      ${codeBlock('GET /weather/location', 'IP 定位调试')}
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
      <a class="try-btn ghost" href="/weather/health" target="_blank">健康检查 →</a>
    </div>

    <div class="preview-panel">
      <div class="preview-header">
        <h3><span class="live"></span> 实时天气预览</h3>
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
  btn.textContent = '\\u23f3 \\u641c\\u7d22\\u4e2d...';
  body.innerHTML = '<div class="preview-loading"><div class="preview-spinner"></div><span>\\u641c\\u7d22\\u4e2d...</span></div>';
  var kw = inp.value.trim() || '\\u5468\\u6770\\u4f26';
  fetch('/music/search?keywords=' + encodeURIComponent(kw) + '&limit=8')
    .then(function(r) { return r.json(); })
    .then(function(data) {
      var songs = (data.result && data.result.songs) || [];
      if (songs.length === 0) {
        body.innerHTML = '<div class="preview-empty">\\u672a\\u627e\\u5230\\u6b4c\\u66f2</div>';
        btn.disabled = false;
        btn.textContent = '\\ud83c\\udfb5 \\u641c\\u7d22';
        return;
      }
      var html = '<ul class="preview-music-list">';
      for (var i = 0; i < songs.length; i++) {
        var s = songs[i];
        var artists = [];
        if (s.ar) for (var j = 0; j < s.ar.length; j++) artists.push(s.ar[j].name);
        var cover = (s.al && s.al.picUrl) ? s.al.picUrl : '';
        var isVip = s.fee === 1 || s.fee === 4;
        html += '<li class="preview-music-item">'
          + '<span class="preview-music-idx">' + (i + 1) + '</span>'
          + (cover ? '<img class="preview-music-cover" src="' + cover + '?param=84y84" alt="">' : '<div class="preview-music-cover"></div>')
          + '<span class="preview-music-name">' + esc(s.name) + '</span>'
          + '<span class="preview-music-artist">' + esc(artists.join('/')) + '</span>'
          + (isVip ? '<span class="preview-music-tag unblock">VIP</span>' : '')
          + '<span class="preview-music-album">' + esc(s.al ? s.al.name : '') + '</span>'
          + '<button class="preview-music-play" title="\\u64ad\\u653e" onclick="window.open(\\'/music/song/url?id=' + s.id + '&br=320000\\',\\'_blank\\')">\\u25b6</button>'
          + '</li>';
      }
      html += '</ul>';
      body.innerHTML = '<div class="preview-result">' + html + '</div>';
      btn.disabled = false;
      btn.textContent = '\\ud83c\\udfb5 \\u641c\\u7d22';
    })
    .catch(function(err) {
      body.innerHTML = '<div class="preview-error">\\u52a0\\u8f7d\\u5931\\u8d25: ' + err.message + '</div>';
      btn.disabled = false;
      btn.textContent = '\\ud83c\\udfb5 \\u641c\\u7d22';
    });
}

function loadMatchPreview() {
  var btn = document.getElementById('matchBtn');
  var body = document.getElementById('matchBody');
  var inp = document.getElementById('matchId');
  var src = document.getElementById('matchSource');
  var id = inp.value.trim();
  if (!id) { body.innerHTML = '<div class="preview-empty">\\u8bf7\\u8f93\\u5165\\u6b4c\\u66f2 ID</div>'; return; }
  btn.disabled = true;
  btn.textContent = '\\u23f3 \\u89e3\\u7070\\u4e2d...';
  body.innerHTML = '<div class="preview-loading"><div class="preview-spinner"></div><span>\\u89e3\\u7070\\u4e2d...</span></div>';
  var url = '/music/song/url/match?id=' + encodeURIComponent(id);
  if (src.value) url += '&source=' + encodeURIComponent(src.value);
  fetch(url)
    .then(function(r) { return r.json(); })
    .then(function(data) {
      if (!data.data || !data.data.url) {
        body.innerHTML = '<div class="preview-error">\\u672a\\u627e\\u5230\\u53ef\\u7528\\u89e3\\u7070\\u97f3\\u6e90</div>';
        btn.disabled = false;
        btn.textContent = '\\ud83d\\udd12 \\u89e3\\u7070';
        return;
      }
      body.innerHTML = '<div class="preview-result"><div class="match-result">'
        + '<span class="m-src">' + esc(data.data.source) + '</span>'
        + '<span class="m-url">' + esc(data.data.url) + '</span>'
        + '<button class="m-play" title="\\u64ad\\u653e" onclick="window.open(\\'' + data.data.url + '\\',\\'_blank\\')">\\u25b6</button>'
        + '</div></div>';
      btn.disabled = false;
      btn.textContent = '\\ud83d\\udd12 \\u89e3\\u7070';
    })
    .catch(function(err) {
      body.innerHTML = '<div class="preview-error">\\u52a0\\u8f7d\\u5931\\u8d25: ' + err.message + '</div>';
      btn.disabled = false;
      btn.textContent = '\\ud83d\\udd12 \\u89e3\\u7070';
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
      <a class="back-link" href="/">← 返回首页</a>
      <h1><span class="h-icon">🎵</span> 网易云音乐 API</h1>
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
          <strong>直接解灰</strong>
          /song/url/match 直接匹配灰色歌曲，支持指定音源（参照 api-enhanced）
        </div>
        <div class="feature-item">
          <strong>加密算法</strong>
          支持 weapi、linuxapi、eapi 三种加密方式，自动匹配路由
        </div>
        <div class="feature-item">
          <strong>Cookie 登录</strong>
          支持通过 cookie 参数或 Cookie 请求头传递 MUSIC_U 等登录凭证
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
          <tr><td>${badge('GET')}</td><td><code>/music/song/url/match</code></td><td>直接解灰（多音源匹配）</td><td><span class="param-tag">id</span><span class="param-tag">source</span></td></tr>
          <tr><td>${badge('GET')}</td><td><code>/music/song/detail</code></td><td>歌曲详情</td><td><span class="param-tag">ids</span></td></tr>
          <tr><td>${badge('GET')}</td><td><code>/music/song/lyric</code></td><td>获取歌词</td><td><span class="param-tag">id</span></td></tr>
          <tr><td>${badge('GET')}</td><td><code>/music/playlist/detail</code></td><td>歌单详情</td><td><span class="param-tag">id</span></td></tr>
          <tr><td>${badge('GET')}</td><td><code>/music/cloudsearch</code></td><td>云搜索(更多结果)</td><td><span class="param-tag">keywords</span></td></tr>
          <tr><td>${badge('GET')}</td><td><code>/music/toplist</code></td><td>所有排行榜</td><td>无</td></tr>
        </tbody>
      </table></div>
    </div>

    <div class="section">
      <h2 class="section-title">使用示例</h2>
      ${codeBlock('GET /music/search?keywords=布拉格广场&limit=10', '搜索歌曲')}
      ${codeBlock('GET /music/song/url?id=210049&br=320000', '获取播放链接')}
      ${codeBlock('GET /music/song/url/match?id=210049', '直接解灰（自动选音源）')}
      ${codeBlock('GET /music/song/url/match?id=210049&source=gdmusic', '直接解灰（指定音源）')}
      ${codeBlock('GET /music/song/lyric?id=210049', '获取歌词')}
    </div>

    <div class="section">
      <h2 class="section-title">VIP 解灰说明</h2>
      ${infoBox('解灰策略（优先级从高到低）', [
        '1. 多音源解灰（unblock）：从 6 个第三方 API 获取完整歌曲文件',
        '2. eapi + os=pc：模拟网易云音乐桌面客户端请求',
        '3. Kuwo 音乐匹配：酷我音乐搜索匹配作为最后兜底',
        '4. 试听片段：若以上均失败，返回 30 秒试听片段',
        '自动检测：通过 freeTrialInfo 字段判断是否需要解灰',
        '直接解灰：/music/song/url/match 可手动指定音源（gdmusic / qijieyaPlus / bikonoo / byfuns / qijieya / msls）',
        '响应字段：source (netease/unblock/kuwo)、sourceType、freeTrialInfo',
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
        <h3><span class="live"></span> 歌曲搜索预览</h3>
        <div class="preview-controls">
          <input type="text" class="preview-input" id="musicSearchInput" placeholder="输入歌曲名或歌手名" value="周杰伦" onkeydown="if(event.key==='Enter')loadMusicPreview()">
          <button class="preview-btn" id="musicPreviewBtn" onclick="loadMusicPreview()">🎵 搜索</button>
        </div>
      </div>
      <div class="preview-body" id="musicPreviewBody">
        <span class="preview-empty">加载中...</span>
      </div>
    </div>

    <div class="preview-panel">
      <div class="preview-header">
        <h3>🔓 直接解灰预览</h3>
        <div class="preview-controls">
          <input type="text" class="preview-input" id="matchId" placeholder="输入歌曲 ID，如 210049" value="210049" onkeydown="if(event.key==='Enter')loadMatchPreview()">
          <select class="preview-select" id="matchSource">
            <option value="">自动选择</option>
            <option value="gdmusic">gdmusic</option>
            <option value="qijieyaPlus">qijieyaPlus</option>
            <option value="bikonoo">bikonoo</option>
            <option value="byfuns">byfuns</option>
            <option value="qijieya">qijieya</option>
            <option value="msls">msls</option>
          </select>
          <button class="preview-btn" id="matchBtn" onclick="loadMatchPreview()">🔒 解灰</button>
        </div>
      </div>
      <div class="preview-body" id="matchBody">
        <span class="preview-empty">输入歌曲 ID 点击解灰，获取可播放链接</span>
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
  btn.textContent = '\\u23f3 \\u52a0\\u8f7d\\u4e2d...';
  body.innerHTML = '<div class="preview-loading"><div class="preview-spinner"></div><span>\\u52a0\\u8f7d\\u4e2d...</span></div>';
  fetch('/bing/today')
    .then(function(r) { return r.json(); })
    .then(function(data) {
      var d = data.data;
      var img = d.resolutions ? d.resolutions['1920x1080'] : d.url;
      body.innerHTML = '<div class="preview-result">'
        + '<div class="preview-image-frame"><img class="preview-image" src="' + img + '" alt="Bing Wallpaper" onload="document.getElementById(\\'bingPreviewBtn\\').disabled=false;document.getElementById(\\'bingPreviewBtn\\').textContent=\\'\\ud83d\\udd04 \\u5237\\u65b0\\';"></div>'
        + '<div class="preview-image-info"><span class="cap">' + esc(d.title) + '</span> · ' + esc(d.date) + '<br>' + esc(d.copyright) + '</div>'
        + '</div>';
    })
    .catch(function(err) {
      body.innerHTML = '<div class="preview-error">\\u52a0\\u8f7d\\u5931\\u8d25: ' + err.message + '</div>';
      btn.disabled = false;
      btn.textContent = '\\ud83d\\udd04 \\u5237\\u65b0';
    });
}
loadBingPreview();
`

export function bingDocPage(): string {
  const content = `
    <div class="page-header">
      <a class="back-link" href="/">← 返回首页</a>
      <h1><span class="h-icon">🖼️</span> Bing 每日壁纸 API</h1>
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
      <h2 class="section-title">使用示例</h2>
      ${codeBlock('GET /bing/today', '今日壁纸信息')}
      ${codeBlock('GET /bing/image', '302 重定向到壁纸')}
      ${codeBlock('GET /bing/image/uhd', 'UHD 超高清壁纸')}
      ${codeBlock('GET /bing/random', '随机壁纸')}
      ${codeBlock('GET /bing/list?count=3', '获取 3 天壁纸列表')}
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
      <a class="try-btn ghost" href="/bing/image" target="_blank">查看今日壁纸 →</a>
    </div>

    <div class="preview-panel">
      <div class="preview-header">
        <h3><span class="live"></span> 在线预览</h3>
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
  btn.textContent = '\\u23f3 \\u52a0\\u8f7d\\u4e2d...';
  body.innerHTML = '<div class="preview-loading"><div class="preview-spinner"></div><span>\\u52a0\\u8f7d\\u4e2d...</span></div>';
  var url = '/hitokoto/random';
  if (sel.value) url += '?category=' + encodeURIComponent(sel.value);
  fetch(url)
    .then(function(r) { return r.json(); })
    .then(function(data) {
      var d = data.data;
      body.innerHTML = '<div class="preview-result"><div class="preview-quote">'
        + '<span class="qmark">"</span>'
        + '<div class="preview-quote-text">' + esc(d.text) + '</div>'
        + '<div class="preview-quote-from">—— ' + esc(d.from) + '<span class="preview-quote-category">' + esc(d.category) + '</span></div>'
        + '</div></div>';
      btn.disabled = false;
      btn.textContent = '\\ud83c\\udfb2 \\u968f\\u673a\\u4e00\\u8a00';
    })
    .catch(function(err) {
      body.innerHTML = '<div class="preview-error">\\u52a0\\u8f7d\\u5931\\u8d25: ' + err.message + '</div>';
      btn.disabled = false;
      btn.textContent = '\\ud83c\\udfb2 \\u968f\\u673a\\u4e00\\u8a00';
    });
}
loadHitokotoPreview();
`

export function hitokotoDocPage(): string {
  const content = `
    <div class="page-header">
      <a class="back-link" href="/">← 返回首页</a>
      <h1><span class="h-icon">💭</span> 一言 API</h1>
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
      <h2 class="section-title">使用示例</h2>
      ${codeBlock('GET /hitokoto/random', '随机一条语录')}
      ${codeBlock('GET /hitokoto/random?category=动漫', '指定分类')}
      ${codeBlock('GET /hitokoto/random?format=text', '纯文本格式')}
      ${codeBlock('GET /hitokoto/list?category=诗词&page=1&size=10', '分页+分类')}
      ${codeBlock('GET /hitokoto/categories', '所有分类')}
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
      <a class="try-btn ghost" href="/hitokoto/categories" target="_blank">查看分类统计 →</a>
    </div>

    <div class="preview-panel">
      <div class="preview-header">
        <h3><span class="live"></span> 在线预览</h3>
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
