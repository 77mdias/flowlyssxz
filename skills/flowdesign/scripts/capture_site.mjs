#!/usr/bin/env node
// capture_site.mjs — baixa um site inteiro "como o navegador viu" e monta uma pasta que roda localmente,
// com JavaScript, animações, WebGL e fontes funcionando.
//
// Como funciona (grava e reproduz):
//   1. Abre a página num Chromium de verdade (Playwright), em desktop e depois em mobile.
//   2. Rola a página inteira e passa o mouse, para disparar tudo que carrega sob demanda.
//   3. Grava CADA resposta de rede (HTML, JS, CSS, imagens, fontes, JSON, modelos 3D, vídeos) com os bytes originais.
//   4. Escreve a pasta: site/<domínio>/<caminho> + site/_fd/site-index.json (o mapa URL → arquivo)
//      + o player (index.html, serve.py, sw.js, abrir.bat, abrir.sh).
//   5. Confere: sobe o player em modo offline, abre a cópia, rola e lista o que faltou.
//
// Uso:
//   node capture_site.mjs URL [--out PASTA] [--pages N] [--no-mobile] [--wait MS] [--max-file-mb 80]
//                             [--channel chrome] [--browser-path /usr/bin/chromium] [--headed] [--keep-trackers] [--no-verify]
//
// Instalação (uma vez):  npm i -D playwright  &&  npx playwright install chromium
//   (ou use o Chrome/Chromium já instalado: --channel chrome  |  --browser-path CAMINHO)
//
// Para estudo local. A pasta contém o conteúdo de terceiros: não republique.

import { execSync, spawn } from 'node:child_process'
import { createHash } from 'node:crypto'
import fs from 'node:fs'
import os from 'node:os'
import { createRequire } from 'node:module'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const PLAYER = path.join(HERE, '..', 'assets', 'site-player')
const TOOL = 'flowdesign-capture 0.1.0'

// ------------------------------------------------------------------ argumentos

const argv = process.argv.slice(2)
const flag = (name, def) => {
  const i = argv.indexOf('--' + name)
  if (i < 0) return def
  const v = argv[i + 1]
  return v === undefined || v.startsWith('--') ? true : v
}
const startUrl = argv.find((a) => /^https?:\/\//i.test(a))
if (!startUrl || argv.includes('--help') || argv.includes('-h')) {
  console.log(fs.readFileSync(fileURLToPath(import.meta.url), 'utf8').split('\n').slice(1, 20).map((l) => l.replace(/^\/\/ ?/, '')).join('\n'))
  process.exit(startUrl ? 0 : 1)
}
const opt = {
  out: flag('out', null), pages: Math.max(1, parseInt(flag('pages', '1'), 10) || 1), mobile: !argv.includes('--no-mobile'),
  wait: parseInt(flag('wait', '1500'), 10), maxBytes: parseFloat(flag('max-file-mb', '80')) * 1024 * 1024,
  channel: flag('channel', null), browserPath: flag('browser-path', null), headed: argv.includes('--headed'),
  keepTrackers: argv.includes('--keep-trackers'), verify: !argv.includes('--no-verify'), timeout: parseInt(flag('timeout', '45000'), 10),
}

// ------------------------------------------------------------------ constantes

// Estatística, anúncio, chat e consentimento: bloqueados na captura (a visita não é contada) e respondidos vazios no replay.
const TRACKER_HOSTS = ['google-analytics.com', 'analytics.google.com', 'googletagmanager.com', 'googleadservices.com', 'doubleclick.net',
  'googlesyndication.com', 'connect.facebook.net', 'bat.bing.com', 'snap.licdn.com', 'px.ads.linkedin.com', 'analytics.tiktok.com',
  'ct.pinterest.com', 'static.ads-twitter.com', 'analytics.twitter.com', 'tr.snapchat.com', 'mc.yandex.ru', 'hotjar.com', 'hotjar.io',
  'clarity.ms', 'cdn.segment.com', 'api.segment.io', 'api.mixpanel.com', 'api-js.mixpanel.com', 'cdn.mxpnl.com', 'api.amplitude.com',
  'api2.amplitude.com', 'plausible.io', 'cloud.umami.is', 'cloudflareinsights.com', 'vitals.vercel-insights.com',
  'browser-intake-datadoghq.com', 'js-agent.newrelic.com', 'bam.nr-data.net', 'fullstory.com', 'mouseflow.com', 'smartlook.com',
  'heapanalytics.com', 'i.posthog.com', 'stats.wp.com', 'pixel.wp.com', 'ingest.sentry.io', 'ingest.us.sentry.io', 'ingest.de.sentry.io',
  'widget.intercom.io', 'js.intercomcdn.com', 'js.hs-scripts.com', 'js.hs-analytics.net', 'js.hs-banner.com', 'track.hubspot.com',
  'client.crisp.chat', 'embed.tawk.to', 'js.driftt.com', 'static.zdassets.com', 'cdn.cookielaw.org', 'consent.cookiebot.com',
  'app.usercentrics.eu', 'cdn.iubenda.com', 'cdn.termly.io']
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\-]/g, '\\$&')
const BLOCKED = [
  `^https?://([^/?#]+\\.)?(${TRACKER_HOSTS.map(esc).join('|')})(:\\d+)?([/?#]|$)`,
  '/g/collect\\?v=2&', 'facebook\\.com/tr[/?]', '/_vercel/(speed-)?insights/', '/cdn-cgi/rum', '/cdn-cgi/challenge-platform/',
  'google\\.com/(pagead|ads)/', 'sentry\\.io/api/\\d+/(envelope|store)',
]
const VOLATILE = ['v', '_', 't', 'ts', 'timestamp', 'cb', 'cachebust', 'cacheBust', 'nocache', 'rnd', 'rand', 'random', '_t', '_rsc', 'dpl']
const KEEP_HEADERS = ['content-type', 'content-language', 'content-disposition', 'last-modified', 'cross-origin-opener-policy', 'cross-origin-embedder-policy']
const EXT_BY_TYPE = [[/html/, '.html'], [/javascript|ecmascript/, '.js'], [/css/, '.css'], [/json/, '.json'], [/svg/, '.svg'], [/png/, '.png'],
  [/jpe?g/, '.jpg'], [/webp/, '.webp'], [/avif/, '.avif'], [/gif/, '.gif'], [/woff2/, '.woff2'], [/woff/, '.woff'], [/mp4/, '.mp4'],
  [/webm/, '.webm'], [/wasm/, '.wasm'], [/xml/, '.xml'], [/text\/plain/, '.txt']]
// [nome, presença no código, versão (opcional)] — procurado nos JS/CSS gravados
const SIGNATURES = [
  ['gsap', /GreenSock|gsap\.registerPlugin|_gsScope/, /GSAP (\d+\.\d+\.\d+)/],
  ['ScrollTrigger', /ScrollTrigger/], ['SplitText', /SplitText/], ['ScrollSmoother', /ScrollSmoother/],
  ['lenis', /lenis-smooth|lenis-stopped|__lenis|data-lenis-prevent/], ['locomotive-scroll', /locomotive-scroll|has-scroll-smooth/],
  ['three', /THREE\.WebGLRenderer|WebGLRenderer|REVISION\s*=\s*["']\d{2,3}["']/, /REVISION\s*=\s*["'](\d{2,3})["']/],
  ['@react-three/fiber', /react-three-fiber|@react-three\/fiber|__r3f/], ['ogl', /\bOGL\b|ogl\/src/], ['pixi.js', /PIXI\.|pixi\.js/],
  ['babylon.js', /BABYLON\./], ['curtains.js', /curtainsjs|Curtains\(/], ['spline', /@splinetool|\.splinecode/], ['rive', /@rive-app|\.riv\b/],
  ['lottie', /lottie-web|bodymovin/], ['motion / framer-motion', /framer-motion|motion-dom|data-projection-id/], ['anime.js', /animejs|anime\.timeline/],
  ['barba', /@barba\/core|data-barba/], ['swup', /\bswup\b/i], ['swiper', /swiper-wrapper|Swiper\(/], ['splitting', /Splitting\(|data-splitting/],
  ['theatre.js', /@theatre\/core/], ['matter.js', /matter-js|Matter\.Engine/], ['rapier', /@dimforge\/rapier/], ['howler', /Howler|howler\.js/],
  ['jquery', /jQuery v\d|jquery\.fn\.init/i, /jQuery v(\d+\.\d+\.\d+)/],
]
const CSS_FEATURES = [['scroll-driven animations', /animation-timeline\s*:/], ['view transitions', /view-transition-name\s*:|@view-transition/],
  ['container queries', /@container\b/], ['scroll snap', /scroll-snap-type\s*:/], ['backdrop-filter', /backdrop-filter\s*:/],
  ['mix-blend-mode', /mix-blend-mode\s*:/], ['clip-path', /clip-path\s*:/], ['tailwind', /--tw-[a-z-]+\s*:/]]

const t0 = Date.now()
const sha = (algo, data) => createHash(algo).update(data).digest('hex')
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const log = (...a) => console.log(...a)
const secs = () => `${Math.round((Date.now() - t0) / 1000)}s`

// ------------------------------------------------------------------ navegador

async function loadPlaywright() {
  const tries = [
    () => import('playwright'),
    () => import(pathToFileURL(createRequire(path.join(process.cwd(), 'x.js')).resolve('playwright')).href),
    () => import(pathToFileURL(createRequire(path.join(execSync('npm root -g', { encoding: 'utf8' }).trim(), 'x.js')).resolve('playwright')).href),
  ]
  for (const t of tries) {
    try { const m = await t(); const pw = m.chromium ? m : m.default; if (pw && pw.chromium) return pw } catch { /* próxima */ }
  }
  console.error('Não achei o Playwright. Instale uma vez, na raiz do projeto:\n  npm i -D playwright && npx playwright install chromium\n' +
    '(se já tem Chrome/Chromium instalado, basta: npm i -D playwright  e rode com --channel chrome ou --browser-path CAMINHO)')
  process.exit(1)
}

async function launch(pw) {
  const base = { headless: !opt.headed, args: ['--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--autoplay-policy=no-user-gesture-required'] }
  const paths = ['/usr/bin/google-chrome', '/usr/bin/google-chrome-stable', '/usr/bin/chromium-browser', '/usr/bin/chromium', '/usr/bin/brave-browser',
    '/snap/bin/chromium', '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'].filter((p) => fs.existsSync(p))
  const candidates = opt.browserPath ? [{ executablePath: opt.browserPath }] : opt.channel ? [{ channel: opt.channel }]
    : [{}, { channel: 'chrome' }, { channel: 'chromium' }, { channel: 'msedge' }, ...paths.map((p) => ({ executablePath: p }))]
  let last
  for (const c of candidates) {
    try { return await pw.chromium.launch({ ...base, ...c }) } catch (err) { last = err }
  }
  console.error('Não consegui abrir um navegador Chromium.\n  npx playwright install chromium\nou aponte um instalado: --browser-path /usr/bin/chromium\n\n' + String(last && last.message).split('\n')[0])
  process.exit(1)
}

// Roda antes dos scripts do site: só conta o que a página usa (WebGL, workers, wasm), sem mudar o comportamento.
const RUNTIME_PROBE = `(() => { try {
  const R = window.__fdRuntime = { contexts: {}, workers: 0, wasm: 0, shadowRoots: 0, webgpu: false };
  const wrap = (proto) => { if (!proto) return; const o = proto.getContext; proto.getContext = function (t) { const c = o.apply(this, arguments); try { if (c) R.contexts[t] = (R.contexts[t] || 0) + 1 } catch (e) {} return c } };
  wrap(HTMLCanvasElement.prototype); if (window.OffscreenCanvas) wrap(OffscreenCanvas.prototype);
  if (window.Worker) window.Worker = new Proxy(window.Worker, { construct(t, a) { R.workers++; return new t(...a) } });
  if (window.WebAssembly) for (const k of ['instantiate', 'instantiateStreaming']) { const o = WebAssembly[k]; if (o) WebAssembly[k] = function () { R.wasm++; return o.apply(this, arguments) } }
  const as = Element.prototype.attachShadow; Element.prototype.attachShadow = function () { R.shadowRoots++; return as.apply(this, arguments) };
  if (navigator.gpu && navigator.gpu.requestAdapter) { const o = navigator.gpu.requestAdapter.bind(navigator.gpu); navigator.gpu.requestAdapter = function () { R.webgpu = true; return o.apply(null, arguments) } }
} catch (e) {} })()`

// ------------------------------------------------------------------ gravação

const store = new Map()          // "MÉTODO url hashDoCorpo" → entrada
const failures = []              // corpos que não deu para ler
const partial = new Map()        // url → tamanho total (respostas 206: baixar inteiro depois)
const pageErrors = { capture: [], replay: [] }

function watch(context, pass, rec = true) {
  const net = { inflight: new Map(), last: Date.now(), pending: new Set() }
  context.on('request', (r) => { net.inflight.set(r, Date.now()); net.last = Date.now() })
  context.on('requestfailed', (r) => { net.inflight.delete(r); net.last = Date.now() })
  context.on('requestfinished', (r) => {
    net.inflight.delete(r); net.last = Date.now()
    if (!rec) return
    const p = record(r, pass).catch(() => {}).finally(() => net.pending.delete(p))
    net.pending.add(p)
  })
  return net
}

async function record(request, pass) {
  const url = request.url()
  if (!/^https?:/i.test(url)) return
  const method = request.method()
  if (method === 'HEAD' || method === 'OPTIONS') return
  const response = await request.response()
  if (!response) return
  const status = response.status()
  const headers = response.headers()
  let bodyHash = ''
  if (method !== 'GET') { const b = request.postDataBuffer(); if (b && b.length) bodyHash = sha('sha256', b) }
  const key = `${method} ${url} ${bodyHash}`
  const had = store.get(key)
  if (had) { had.passes.add(pass); if (had.body || had.redirect || had.status === status) return }
  const e = had || { url, method, bodyHash, passes: new Set([pass]) }
  Object.assign(e, { status, contentType: headers['content-type'] || '', resourceType: request.resourceType(), headers: {} })
  for (const k of KEEP_HEADERS) if (headers[k]) e.headers[k] = headers[k]
  store.set(key, e)
  if (status >= 300 && status < 400 && headers.location) { e.redirect = headers.location; return }
  if (status === 206) {
    const total = /\/(\d+)\s*$/.exec(headers['content-range'] || '')
    partial.set(url, total ? parseInt(total[1], 10) : 0)
    return
  }
  try {
    const body = await response.body()
    if (body.length > opt.maxBytes) e.skipped = `maior que ${Math.round(opt.maxBytes / 1048576)}MB`
    else { e.body = body; e.size = body.length }
  } catch (err) {
    if (![204, 304].includes(status)) failures.push({ url, reason: String(err.message).split('\n')[0] })
  }
}

async function idle(page, net, quiet = 1200, max = 15000) {
  const t0 = Date.now()
  while (Date.now() - t0 < max) {
    // pedido aberto há mais de 6s (streaming, conexão pendurada, evento perdido) não segura a espera
    const busy = [...net.inflight.values()].some((started) => Date.now() - started < 6000)
    if (!busy && Date.now() - net.last >= quiet) break
    await sleep(150)
    if (page.isClosed()) break
  }
  await Promise.allSettled([...net.pending])
}

// Rola com a roda do mouse (funciona com scroll suave e seções pinadas) até o fim, depois volta ao topo.
async function scrollThrough(page, net, vh) {
  const pos = () => page.evaluate(() => [Math.round(scrollY), document.documentElement.scrollHeight - innerHeight]).catch(() => [0, 0])
  await page.mouse.move(200, Math.round(vh / 2)).catch(() => {})
  let stuck = 0, last = -1
  for (let i = 0; i < 160; i++) {
    await page.mouse.wheel(0, Math.round(vh * 0.55)).catch(() => {})
    await sleep(260)
    const [y, max] = await pos()
    if (y === last) {
      stuck += 1
      if (stuck === 2) await page.evaluate(() => scrollBy(0, innerHeight * 0.8)).catch(() => {})   // rolagem em contêiner próprio / roda ignorada
      if (stuck >= 4 && (y >= max - 4 || stuck >= 8)) break
    } else stuck = 0
    last = y
    if (i % 6 === 5) await idle(page, net, 500, 4000)
  }
  await idle(page, net, 900, 8000)
  await page.evaluate(() => scrollTo({ top: 0, behavior: 'instant' })).catch(() => {})
  await sleep(600)
}

async function hoverAround(page, vw, vh) {
  for (const [x, y] of [[0.2, 0.3], [0.5, 0.2], [0.8, 0.3], [0.8, 0.7], [0.5, 0.8], [0.2, 0.7], [0.5, 0.5]]) {
    await page.mouse.move(Math.round(vw * x), Math.round(vh * y), { steps: 6 }).catch(() => {})
    await sleep(120)
  }
  const links = await page.locator('a[href], button, [role="button"]').all().catch(() => [])
  let done = 0
  for (const l of links) {
    if (done >= 12) break
    try { if (await l.isVisible()) { await l.hover({ timeout: 500, trial: false }); done += 1; await sleep(120) } } catch { /* fora da tela */ }
  }
}

async function visit(page, net, url, { vw, vh, interact }) {
  const res = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: opt.timeout })
  await page.waitForLoadState('load', { timeout: opt.timeout }).catch(() => {})
  await idle(page, net)
  await sleep(opt.wait)
  if (interact) {
    await scrollThrough(page, net, vh)
    await hoverAround(page, vw, vh)
  }
  await idle(page, net)
  return res
}

// O que o navegador pede por conta própria ou só pediria em outra tela: favicons, manifest, variantes de srcset, posters.
async function fetchExtras(page, context, pass) {
  const urls = await page.evaluate(() => {
    const abs = (u) => { try { return new URL(u, document.baseURI).href } catch (e) { return null } }
    const out = new Set([abs('/favicon.ico')])
    document.querySelectorAll('link[rel~="icon"], link[rel="apple-touch-icon"], link[rel="mask-icon"], link[rel="manifest"]').forEach((l) => out.add(abs(l.getAttribute('href'))))
    document.querySelectorAll('img[srcset], source[srcset]').forEach((el) => el.getAttribute('srcset').split(/,\s+/).forEach((c) => { const u = c.trim().split(/\s+/)[0]; if (u) out.add(abs(u)) }))
    document.querySelectorAll('video[poster]').forEach((v) => out.add(abs(v.getAttribute('poster'))))
    return [...out].filter((u) => u && /^https?:/.test(u))
  }).catch(() => [])
  const have = new Set([...store.values()].filter((e) => e.method === 'GET').map((e) => e.url))
  let added = 0
  for (const url of urls.filter((u) => !have.has(u)).slice(0, 150)) {
    try {
      const r = await context.request.get(url, { timeout: 20000 })
      const body = await r.body()
      if (body.length > opt.maxBytes) continue
      const h = r.headers(), headers = {}
      for (const k of KEEP_HEADERS) if (h[k]) headers[k] = h[k]
      store.set(`GET ${url} `, { url, method: 'GET', bodyHash: '', passes: new Set([pass]), status: r.status(), contentType: h['content-type'] || '', resourceType: 'other', headers, body, size: body.length })
      added += 1
    } catch { /* não respondeu: fica como falta */ }
  }
  return added
}

const PAGE_TECH = () => {
  const w = window, g = {}, set = (k, v) => { if (v) g[k] = v === true ? true : String(v) }
  const safe = (f) => { try { return f() } catch (e) { return undefined } }
  set('gsap', safe(() => w.gsap && (w.gsap.version || true)))
  set('ScrollTrigger', safe(() => w.ScrollTrigger && (w.ScrollTrigger.version || true)))
  set('three', safe(() => (w.__THREE__ ? 'r' + w.__THREE__ : w.THREE && 'r' + w.THREE.REVISION)))
  set('lenis', safe(() => !!(w.Lenis || w.lenis || document.documentElement.classList.contains('lenis'))))
  set('jquery', safe(() => w.jQuery && w.jQuery.fn.jquery))
  set('swiper', safe(() => !!w.Swiper)); set('barba', safe(() => !!w.barba)); set('lottie', safe(() => w.lottie && (w.lottie.version || true)))
  set('pixi.js', safe(() => w.PIXI && (w.PIXI.VERSION || true))); set('anime.js', safe(() => w.anime && (w.anime.version || true)))
  const has = (sel) => !!document.querySelector(sel)
  const builders = []
  if (w.__NEXT_DATA__ || has('#__next') || has('script[src*="/_next/"]')) builders.push('Next.js')
  if (w.__NUXT__ || has('#__nuxt')) builders.push('Nuxt')
  if (has('astro-island') || has('[data-astro-cid]') || has('link[href*="/_astro/"]')) builders.push('Astro')
  if (has('[data-wf-site]') || w.Webflow) builders.push('Webflow')
  if (has('[data-framer-name]') || has('#__framer-badge-container')) builders.push('Framer')
  if (w.Shopify) builders.push('Shopify')
  if (has('link[href*="wp-content"]') || has('script[src*="wp-includes"]')) builders.push('WordPress')
  if (w.___gatsby || has('#___gatsby')) builders.push('Gatsby')
  if (has('[data-sveltekit-preload-data]') || has('script[src*="/_app/immutable/"]')) builders.push('SvelteKit')
  const gen = document.querySelector('meta[name="generator"]')
  return {
    title: document.title, globals: g, builders, generator: gen ? gen.content : null,
    embeds: ['spline-viewer', 'model-viewer', 'lottie-player', 'dotlottie-player', 'dotlottie-wc'].filter(has),
    canvases: document.querySelectorAll('canvas').length,
    videos: [...document.querySelectorAll('video')].map((v) => v.currentSrc || v.src || (v.querySelector('source') || {}).src).filter(Boolean),
    fonts: [...new Set([...document.fonts].filter((f) => f.status === 'loaded').map((f) => f.family.replace(/["']/g, '')))],
    runtime: w.__fdRuntime || null,
  }
}

// ------------------------------------------------------------------ nomes de arquivo

const RESERVED = /^(con|prn|aux|nul|com\d|lpt\d)$/i
function safeSeg(s) {
  try { s = decodeURIComponent(s) } catch { /* fica como veio */ }
  s = s.replace(/[<>:"|?*\\\x00-\x1f]/g, '_').replace(/[. ]+$/, '')
  if (!s || s === '.' || s === '..') s = '_'
  if (RESERVED.test(s.split('.')[0])) s = '_' + s
  return s.length > 100 ? s.slice(0, 80) + '_' + sha('sha1', s).slice(0, 8) : s
}

function assignFiles(entries) {
  const want = []
  for (const e of entries) {
    if (!e.body) continue
    const u = new URL(e.url)
    const segs = u.pathname.split('/').filter(Boolean).map(safeSeg)
    if (u.pathname.endsWith('/') || !segs.length) segs.push('index')
    const name = segs.pop()
    let ext = path.extname(name)
    if (!/^\.[a-z0-9]{1,8}$/i.test(ext)) ext = ''
    let stem = ext ? name.slice(0, -ext.length) : name
    if (u.search) stem += '__q' + sha('sha1', u.search).slice(0, 8)
    if (e.method !== 'GET') stem += '__' + e.method.toLowerCase() + (e.bodyHash ? '_' + e.bodyHash.slice(0, 8) : '')
    if (!ext) ext = (EXT_BY_TYPE.find(([re]) => re.test(e.contentType)) || [0, '.bin'])[1]
    want.push({ e, dir: ['site', u.host.replace(/:/g, '_'), ...segs], stem, ext })
  }
  const dirs = new Set()
  for (const w of want) for (let i = 1; i <= w.dir.length; i++) dirs.add(w.dir.slice(0, i).join('/').toLowerCase())
  const used = new Set()
  for (const w of want) {
    let rel = [...w.dir, w.stem + w.ext].join('/'), n = 1
    while (used.has(rel.toLowerCase()) || dirs.has(rel.toLowerCase())) rel = [...w.dir, `${w.stem}__${++n}${w.ext}`].join('/')
    used.add(rel.toLowerCase())
    w.e.file = rel
  }
}

function slugFor(u) {
  const host = u.hostname.replace(/^www\./, '')
  const p = u.pathname.replace(/\/index\.\w+$/, '').split('/').filter(Boolean).map((s) => safeSeg(s).replace(/\.\w+$/, '')).join('-')
  return (host + (p ? '_' + p : '')).replace(/[^a-zA-Z0-9._-]+/g, '-').slice(0, 80)
}

// ------------------------------------------------------------------ tecnologia

function detectTech(entries, pageTech) {
  const libs = new Map(), css = new Set()
  const note = (name, version, source) => {
    const l = libs.get(name) || { name, version: null, sources: [] }
    if (version && !l.version) l.version = version
    if (source && !l.sources.includes(source) && l.sources.length < 4) l.sources.push(source)
    libs.set(name, l)
  }
  for (const [name, v] of Object.entries(pageTech.globals || {})) note(name, v === true ? null : v, 'variável global na página')
  for (const e of entries) {
    if (!e.body || e.body.length > 6 * 1048576) continue
    const isJs = /javascript|ecmascript/.test(e.contentType) || /\.m?js(\?|$)/.test(e.url)
    const isCss = /css/.test(e.contentType) || /\.css(\?|$)/.test(e.url)
    const isHtml = /html/.test(e.contentType)
    if (!isJs && !isCss && !isHtml) continue
    const text = e.body.toString('utf8')
    if (isJs || isHtml) {
      for (const [name, present, version] of SIGNATURES) {
        if (!present.test(text)) continue
        const m = version && version.exec(text)
        note(name, m ? (name === 'three' ? 'r' + m[1] : m[1]) : null, e.url)
      }
    }
    if (isCss || isHtml) for (const [name, re] of CSS_FEATURES) if (re.test(text)) css.add(name)
  }
  const files = {}
  for (const e of entries) if (e.body) { const k = (e.contentType.split('/')[0] || 'outros').trim() || 'outros'; files[k] = (files[k] || 0) + 1 }
  return {
    builders: pageTech.builders || [], generator: pageTech.generator || null, libraries: [...libs.values()],
    runtime: { ...(pageTech.runtime || {}), canvases: pageTech.canvases || 0 }, embeds: pageTech.embeds || [],
    cssFeatures: [...css], fonts: pageTech.fonts || [], videos: pageTech.videos || [], files,
  }
}

// ------------------------------------------------------------------ escrita

function writeCapture(outDir, meta, entries, tech) {
  const fd = path.join(outDir, 'site', '_fd')
  fs.mkdirSync(fd, { recursive: true })
  let bytes = 0
  for (const e of entries) {
    if (!e.file) continue
    const full = path.join(outDir, ...e.file.split('/'))
    fs.mkdirSync(path.dirname(full), { recursive: true })
    fs.writeFileSync(full, e.body)
    bytes += e.body.length
  }
  const indexEntries = entries.filter((e) => e.file || e.redirect || [204, 205, 304].includes(e.status)).map((e) => {
    const o = { url: e.url, method: e.method, status: e.status, contentType: e.contentType, resourceType: e.resourceType, passes: [...e.passes], size: e.size || 0 }
    if (Object.keys(e.headers).length) o.headers = e.headers
    if (e.bodyHash) o.bodyHash = e.bodyHash
    if (e.redirect) o.redirect = e.redirect
    if (e.file) o.file = e.file
    return o
  })
  const index = {
    version: 1, tool: TOOL, captureId: meta.captureId, capturedAt: meta.capturedAt,
    entry: meta.entry, pages: meta.pages, blocked: opt.keepTrackers ? [] : BLOCKED, volatileParams: VOLATILE, onlineFallback: true, entries: indexEntries,
  }
  fs.writeFileSync(path.join(fd, 'site-index.json'), JSON.stringify(index))
  fs.writeFileSync(path.join(fd, 'tech.json'), JSON.stringify(tech, null, 1))
  const entryHost = new URL(meta.entry.url).hostname.replace(/^www\./, '')
  const manifest = {
    entryUrl: meta.entry.url, title: meta.entry.title, capturedAt: meta.capturedAt, tool: TOOL, pages: meta.pages,
    totals: { files: indexEntries.filter((e) => e.file).length, bytes, redirects: indexEntries.filter((e) => e.redirect).length },
    notCaptured: { unreadable: failures, tooBig: entries.filter((e) => e.skipped).map((e) => ({ url: e.url, why: e.skipped })) },
    pageErrorsOnOriginal: pageErrors.capture.slice(0, 20),
    files: indexEntries.filter((e) => e.file).map((e) => ({
      url: e.url, file: e.file, type: e.contentType.split(';')[0], kind: e.resourceType, size: e.size,
      party: new URL(e.url).hostname.replace(/^www\./, '').endsWith(entryHost) ? 'próprio' : 'terceiro', passes: e.passes,
    })).sort((a, b) => a.file.localeCompare(b.file)),
  }
  fs.writeFileSync(path.join(fd, 'manifest.json'), JSON.stringify(manifest, null, 1))

  for (const f of ['sw.js']) fs.copyFileSync(path.join(PLAYER, f), path.join(fd, f))
  for (const f of ['serve.py', 'abrir.bat', 'abrir.sh']) fs.copyFileSync(path.join(PLAYER, f), path.join(outDir, f))
  try { fs.chmodSync(path.join(outDir, 'serve.py'), 0o755); fs.chmodSync(path.join(outDir, 'abrir.sh'), 0o755) } catch { /* Windows */ }
  const host = new URL(meta.entry.url).hostname
  const cfg = { entryUrl: meta.entry.url, entryPath: meta.entry.path + meta.entry.search, captureId: meta.captureId, capturedAt: meta.capturedAt,
    localHost: /^(localhost|[\d.]+|\[.*\])$/.test(host) || host.endsWith('.localhost') ? 'localhost' : host + '.localhost' }
  const html = fs.readFileSync(path.join(PLAYER, 'index.template.html'), 'utf8')
    .replace('__CONFIG__', () => JSON.stringify(cfg).replace(/</g, '\\u003c'))
    .replace(/__TITLE__/g, () => escapeHtml(meta.entry.title || host))
    .replace('__ENTRY_URL__', () => escapeHtml(meta.entry.url)).replace('__CAPTURED_AT__', () => meta.capturedAt.slice(0, 10))
  fs.writeFileSync(path.join(outDir, 'index.html'), html)
  fs.writeFileSync(path.join(outDir, 'Como rodar.md'), HOWTO(meta))
  return { bytes, manifest }
}

const escapeHtml = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]))
const HOWTO = (meta) => `# Como rodar

Cópia local de ${meta.entry.url}, capturada em ${meta.capturedAt.slice(0, 10)} para estudo.

Dentro desta pasta:

| Sistema | Comando |
|---|---|
| Linux / Mac | \`./abrir.sh\` ou \`python3 serve.py --open\` |
| Windows | duplo clique em \`abrir.bat\` ou \`py serve.py --open\` |

O navegador abre o site vivo, com as animações. Deixe o terminal aberto; \`Ctrl+C\` encerra.

- \`python3 serve.py --offline\`: nada é buscado na internet (o que não foi capturado simplesmente falta).
- Abrir o \`index.html\` direto mostra só um retrato da página.
- Use Chrome, Edge ou Firefox (fora do modo privado). Precisa de Python 3.8 ou mais novo.

O que tem aqui: \`site/<domínio>/…\` são os arquivos originais; \`site/_fd/site-index.json\` é o mapa de URL para arquivo;
\`site/_fd/tech.json\` lista as bibliotecas detectadas; \`site/_fd/manifest.json\` é o inventário legível.

O conteúdo pertence aos donos do site. Esta cópia é para estudar como ele foi construído, não para republicar.
`

// ------------------------------------------------------------------ conferência do replay

async function verify(browser, outDir, meta) {
  const py = ['python3', 'python', 'py'].find((c) => { try { execSync(`${c} --version`, { stdio: 'ignore' }); return true } catch { return false } })
  if (!py) return { skipped: 'Python não encontrado' }
  const server = spawn(py, ['serve.py', '--offline'], { cwd: outDir, stdio: ['ignore', 'pipe', 'pipe'] })
  let out = ''
  server.stdout.on('data', (d) => { out += d })
  try {
    for (let i = 0; i < 50 && !/Abra: (\S+)/.test(out); i++) await sleep(100)
    const url = (/Abra: (\S+)/.exec(out) || [])[1]
    if (!url) return { skipped: 'o servidor local não iniciou' }
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } })
    const page = await context.newPage()
    page.on('pageerror', (e) => pageErrors.replay.push(String(e.message).split('\n')[0]))
    const net = watch(context, 'replay', false)
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: opt.timeout })
    let live = false
    for (let i = 0; i < 100 && !live; i++) {
      await sleep(200)
      live = await page.evaluate(() => !!navigator.serviceWorker.controller && !document.documentElement.hasAttribute('data-fd')).catch(() => false)
    }
    if (!live) return { url, error: 'o Service Worker não assumiu a página' }
    await page.waitForLoadState('load', { timeout: opt.timeout }).catch(() => {})
    await idle(page, net)
    await sleep(opt.wait)
    await scrollThrough(page, net, 900)
    await idle(page, net)
    const report = await page.evaluate(() => new Promise((resolve) => {
      navigator.serviceWorker.addEventListener('message', (e) => { if (e.data && e.data.type === 'fd:report') resolve(e.data) })
      navigator.serviceWorker.controller.postMessage({ type: 'fd:report' })
      setTimeout(() => resolve(null), 4000)
    })).catch(() => null)
    const tech = await page.evaluate(PAGE_TECH).catch(() => ({}))
    await page.screenshot({ path: path.join(outDir, 'site', '_fd', 'replay.jpg'), type: 'jpeg', quality: 80 }).catch(() => {})
    await context.close()
    return { url, report, title: tech.title, canvases: tech.canvases, runtime: tech.runtime }
  } finally {
    server.kill()
  }
}

// ------------------------------------------------------------------ principal

const pw = await loadPlaywright()
const browser = await launch(pw)
log(`Capturando ${startUrl}`)

// passada desktop
const DESK = { vw: 1440, vh: 900 }
const desktop = await browser.newContext({ viewport: { width: DESK.vw, height: DESK.vh }, serviceWorkers: 'block' })
await desktop.addInitScript(RUNTIME_PROBE)
if (!opt.keepTrackers) await desktop.route(new RegExp(BLOCKED.join('|'), 'i'), (r) => r.abort())
const dnet = watch(desktop, 'desktop')
const page = await desktop.newPage()
page.on('pageerror', (e) => pageErrors.capture.push(String(e.message).split('\n')[0]))
let first
try {
  first = await visit(page, dnet, startUrl, { ...DESK, interact: true })
} catch (err) {
  console.error('Não consegui abrir a página: ' + String(err.message).split('\n')[0])
  await browser.close(); process.exit(1)
}
const entryUrl = new URL(page.url())
const pageTech = await page.evaluate(PAGE_TECH).catch(() => ({}))
const extras = await fetchExtras(page, desktop, 'desktop')
log(`  desktop: ${store.size} respostas · "${pageTech.title || ''}" (${secs()})`)

// páginas internas (opcional)
const pages = [entryUrl.pathname + entryUrl.search]
if (opt.pages > 1) {
  const links = await page.evaluate(() => [...document.querySelectorAll('a[href]')].map((a) => a.href)).catch(() => [])
  const seen = new Set([entryUrl.origin + entryUrl.pathname])
  const queue = []
  for (const l of links) {
    let u; try { u = new URL(l) } catch { continue }
    if (u.origin !== entryUrl.origin || /\.(pdf|zip|png|jpe?g|svg|mp4|webp|gif|dmg|exe)$/i.test(u.pathname)) continue
    const k = u.origin + u.pathname
    if (!seen.has(k)) { seen.add(k); queue.push(u.origin + u.pathname + u.search) }
  }
  for (const u of queue.slice(0, opt.pages - 1)) {
    try {
      await visit(page, dnet, u, { ...DESK, interact: true })
      await fetchExtras(page, desktop, 'desktop')
      const f = new URL(page.url()); pages.push(f.pathname + f.search)
      log(`  página ${pages.length}/${opt.pages}: ${f.pathname}`)
    } catch { log(`  página ignorada (não abriu): ${u}`) }
  }
  await page.goto(entryUrl.href, { waitUntil: 'load', timeout: opt.timeout }).catch(() => {})
  await idle(page, dnet)
}
const snapDir = fs.mkdtempSync(path.join(os.tmpdir(), 'fd-capture-'))
await page.screenshot({ path: path.join(snapDir, 'snapshot.jpg'), type: 'jpeg', quality: 82 }).catch(() => {})
await Promise.allSettled([...dnet.pending])

// passada mobile: pega as variantes de imagem e os arquivos que só o celular pede
if (opt.mobile) {
  const mobile = await browser.newContext({
    viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, serviceWorkers: 'block',
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1',
  })
  if (!opt.keepTrackers) await mobile.route(new RegExp(BLOCKED.join('|'), 'i'), (r) => r.abort())
  const mnet = watch(mobile, 'mobile')
  const mpage = await mobile.newPage()
  const before = store.size
  try { await visit(mpage, mnet, entryUrl.href, { vw: 390, vh: 844, interact: true }) } catch { log('  mobile: a página não abriu, seguindo só com desktop') }
  await Promise.allSettled([...mnet.pending])
  log(`  mobile: +${store.size - before} respostas novas (${secs()})`)
  await mobile.close()
}

// respostas parciais (vídeo/áudio pedidos em pedaços): baixa o arquivo inteiro
for (const [url, total] of partial) {
  const e = [...store.values()].find((x) => x.url === url && x.method === 'GET')
  if (!e || e.body) continue
  if (total > opt.maxBytes) { e.skipped = `maior que ${Math.round(opt.maxBytes / 1048576)}MB`; e.status = 200; continue }
  try {
    const r = await desktop.request.get(url, { timeout: 120000 })
    const body = await r.body()
    if (r.ok() && body.length <= opt.maxBytes) { e.body = body; e.size = body.length; e.status = 200 } else e.skipped = 'não foi possível baixar inteiro'
  } catch (err) { e.skipped = 'não foi possível baixar inteiro'; failures.push({ url, reason: String(err.message).split('\n')[0] }) }
}
await desktop.close()

// monta a pasta
const entries = [...store.values()]
assignFiles(entries)
const entryDoc = entries.find((e) => e.method === 'GET' && e.url.split('#')[0] === entryUrl.href.split('#')[0] && e.file)
if (!entryDoc) {
  console.error('A página abriu, mas o HTML principal não pôde ser gravado. Tente de novo com --headed.')
  await browser.close(); process.exit(1)
}
const slug = slugFor(entryUrl)
let outDir = path.resolve(opt.out || path.join('captures', slug))
if (!opt.out) for (let n = 2; fs.existsSync(outDir) && fs.readdirSync(outDir).length; n++) outDir = path.resolve(path.join('captures', `${slug}-${n}`))
const meta = {
  captureId: `${slug}-${sha('sha1', entryUrl.href + t0).slice(0, 8)}`, capturedAt: new Date().toISOString().replace(/\.\d+Z$/, 'Z'), pages,
  entry: { url: entryUrl.href.split('#')[0], path: entryUrl.pathname, search: entryUrl.search, file: entryDoc.file, contentType: entryDoc.contentType, title: pageTech.title || '' },
}
const tech = detectTech(entries, pageTech)
const { bytes, manifest } = writeCapture(outDir, meta, entries, tech)
try { fs.renameSync(path.join(snapDir, 'snapshot.jpg'), path.join(outDir, 'site', '_fd', 'snapshot.jpg')) } catch {
  try { fs.copyFileSync(path.join(snapDir, 'snapshot.jpg'), path.join(outDir, 'site', '_fd', 'snapshot.jpg')) } catch { /* sem retrato */ }
}
fs.rmSync(snapDir, { recursive: true, force: true })

// confere o replay
let check = null
if (opt.verify) {
  log('Conferindo a cópia (modo offline)…')
  check = await verify(browser, outDir, meta).catch((err) => ({ error: String(err.message).split('\n')[0] }))
  manifest.verify = check
  manifest.pageErrorsOnReplay = pageErrors.replay.slice(0, 20)
  fs.writeFileSync(path.join(outDir, 'site', '_fd', 'manifest.json'), JSON.stringify(manifest, null, 1))
}
await browser.close()

// relatório
const mb = (n) => (n / 1048576).toFixed(1) + ' MB'
const hosts = [...new Set(entries.filter((e) => e.file).map((e) => new URL(e.url).host))]
log(`\nPronto em ${Math.round((Date.now() - t0) / 1000)}s → ${outDir}`)
log(`  ${manifest.totals.files} arquivos, ${mb(bytes)}, ${hosts.length} domínio(s): ${hosts.slice(0, 6).join(', ')}${hosts.length > 6 ? '…' : ''}`)
if (pages.length > 1) log(`  páginas: ${pages.join('  ')}`)
log(`  tecnologia: ${[...tech.builders, ...tech.libraries.map((l) => l.name + (l.version ? ' ' + l.version : ''))].join(', ') || 'nenhuma biblioteca conhecida detectada'}`)
if (tech.runtime && tech.runtime.contexts && Object.keys(tech.runtime.contexts).length) log(`  canvas: ${JSON.stringify(tech.runtime.contexts)}`)
if (extras) log(`  extras buscados à parte (favicon, srcset, poster): ${extras}`)
if (Date.now() - t0 > 150000 && !opt.headed) log('  demorou? sem janela o Chromium costuma renderizar WebGL por software; tente --headed em sites com 3D pesado')
if (failures.length) log(`  não deu para ler ${failures.length} resposta(s): ${failures.slice(0, 3).map((f) => f.url).join(', ')}`)
if (manifest.notCaptured.tooBig.length) log(`  grandes demais (ficam online): ${manifest.notCaptured.tooBig.map((f) => f.url).join(', ')}`)
if (check) {
  if (check.skipped || check.error) log(`  conferência não concluída: ${check.skipped || check.error}`)
  else if (check.report) {
    const miss = check.report.misses.filter((m) => !m.substitute)
    log(`  replay offline: ${check.report.stats.served} respostas do arquivo, ${check.report.stats.blocked} rastreadores bloqueados, ${miss.length} falta(s)`)
    for (const m of miss.slice(0, 8)) log(`     falta: ${m.method} ${m.url}`)
    const newErr = pageErrors.replay.filter((e) => !pageErrors.capture.includes(e))
    if (newErr.length) log(`  erros de JavaScript só na cópia: ${[...new Set(newErr)].slice(0, 4).join(' | ')}`)
  }
}
log(`\nPara abrir:  cd "${outDir}" && ./abrir.sh      (Windows: abrir.bat)`)
