#!/usr/bin/env node
// site_design.mjs — mede um site POR DENTRO para o agente escrever o design system e o branding completos.
//
// Entrada: a pasta de uma captura (feita com capture_site.mjs) ou uma URL viva.
// O site roda num Chromium com uma sonda instalada antes dos scripts dele. O que é registrado:
//   marca       título, descrição, logo, favicon, cor de tema, textos reais de títulos e botões (voz)
//   tokens      variáveis CSS do próprio site (claro e escuro), cores/raios/sombras/espaços realmente usados
//   tipografia  @font-face agrupado, escala real (cada estilo de texto visto na página), valor escrito pelo autor
//               no CSS (clamp, vw, rem), tamanhos em desktop e mobile
//   layout      breakpoints, contêineres, grids, blocos da página, trechos presos (pin) e quanto duram
//   componentes botões, links, campos e cards vistos em TODA a rolagem, com hover medido e recortes de tela
//   motion      @keyframes, transições, animações em execução (carga e rolagem), classes trocadas, elementos
//               animados por JS, element.animate(), IntersectionObservers, ouvintes, GSAP (timelines, tweens na
//               ordem, easing real, ScrollTriggers e a faixa de rolagem de cada tween), opções do Lenis
//
// Uso:
//   node site_design.mjs captures/<site>            → grava em captures/<site>/design/
//   node site_design.mjs https://site.com --out pasta
//   opções: --no-mobile  --headed  --channel chrome  --browser-path CAMINHO  --max-screens 16  --wait-intro 25  --online
//
// Saída: site-raw.json (tudo), summary.md (resumo para leitura), screens/ (telas), components/ (recortes), brand/ (logo etc.)

import { execSync, spawn } from 'node:child_process'
import fs from 'node:fs'
import { createRequire } from 'node:module'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const VERSION = '0.2.0'
const HERE = path.dirname(fileURLToPath(import.meta.url))
const argv = process.argv.slice(2)
const flag = (name, def) => {
  const i = argv.indexOf('--' + name)
  if (i < 0) return def
  const v = argv[i + 1]
  return v === undefined || v.startsWith('--') ? true : v
}
const WITH_VALUE = new Set(['--out', '--channel', '--browser-path', '--max-screens', '--wait-intro'])
const target = argv.find((a, i) => !a.startsWith('--') && !WITH_VALUE.has(argv[i - 1]))
if (!target || argv.includes('--help')) {
  console.log(fs.readFileSync(fileURLToPath(import.meta.url), 'utf8').split('\n').slice(1, 22).map((l) => l.replace(/^\/\/ ?/, '')).join('\n'))
  process.exit(target ? 0 : 1)
}
const opt = {
  out: flag('out', null), mobile: !argv.includes('--no-mobile'), headed: argv.includes('--headed'), channel: flag('channel', null),
  browserPath: flag('browser-path', null), maxScreens: parseInt(flag('max-screens', '16'), 10), waitIntro: parseFloat(flag('wait-intro', '25')), online: argv.includes('--online'),
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const log = (...a) => console.log(...a)
const t0 = Date.now()
const secs = () => Math.round((Date.now() - t0) / 1000) + 's'

// ------------------------------------------------------------------ navegador (mesma lógica do capture_site.mjs)

async function loadPlaywright() {
  const tries = [
    () => import('playwright'),
    () => import(pathToFileURL(createRequire(path.join(process.cwd(), 'x.js')).resolve('playwright')).href),
    () => import(pathToFileURL(createRequire(path.join(execSync('npm root -g', { encoding: 'utf8' }).trim(), 'x.js')).resolve('playwright')).href),
  ]
  for (const t of tries) { try { const m = await t(); const pw = m.chromium ? m : m.default; if (pw && pw.chromium) return pw } catch { /* próxima */ } }
  console.error('Não achei o Playwright. Na raiz do projeto: npm install && npx playwright install chromium')
  process.exit(1)
}
async function launch(pw) {
  const base = { headless: !opt.headed, args: ['--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--autoplay-policy=no-user-gesture-required'] }
  const paths = ['/usr/bin/google-chrome', '/usr/bin/google-chrome-stable', '/usr/bin/chromium-browser', '/usr/bin/chromium', '/usr/bin/brave-browser',
    '/snap/bin/chromium', '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'].filter((p) => fs.existsSync(p))
  const cands = opt.browserPath ? [{ executablePath: opt.browserPath }] : opt.channel ? [{ channel: opt.channel }]
    : [{}, { channel: 'chrome' }, { channel: 'chromium' }, { channel: 'msedge' }, ...paths.map((p) => ({ executablePath: p }))]
  let last
  for (const c of cands) { try { return await pw.chromium.launch({ ...base, ...c }) } catch (e) { last = e } }
  console.error('Não consegui abrir um Chromium: ' + String(last && last.message).split('\n')[0]); process.exit(1)
}

// ------------------------------------------------------------------ sonda (roda antes dos scripts do site)

function PROBE() {
  if (window.__fdProbe) return
  const P = window.__fdProbe = { classes: {}, styles: {}, waapi: [], io: [], listeners: {}, media: {}, raf: 0, viewTransitions: 0, lenis: [] }
  window.__fdLenis = []
  window.__fdMM = window.matchMedia ? window.matchMedia.bind(window) : null
  const own = (el) => {
    let s = el.tagName.toLowerCase()
    if (el.id) s += '#' + el.id
    const c = (el.getAttribute('class') || '').trim().split(/\s+/).filter(Boolean).slice(0, 3)
    if (c.length) s += '.' + c.join('.')
    return s
  }
  // seletor curto e legível; elemento sem id nem classe ganha o pai como contexto ("div.links > a")
  const sel = window.__fdSel = (el) => {
    try {
      if (!el) return ''
      if (el === window) return 'window'
      if (el === document) return 'document'
      if (el.nodeType !== 1) return String(el.nodeName || '').toLowerCase()
      const s = own(el)
      if (el.id || el.getAttribute('class') || !el.parentElement || /^(html|body)$/i.test(el.tagName)) return s
      const p = el.parentElement, pid = p.id ? '#' + p.id : '', pc = (p.getAttribute('class') || '').trim().split(/\s+/).filter(Boolean).slice(0, 2)
      return p.tagName.toLowerCase() + pid + (pc.length ? '.' + pc.join('.') : '') + ' > ' + s
    } catch (e) { return '?' }
  }
  // rótulo estável: calculado na primeira vez que o elemento aparece, não muda quando as classes mudam
  const labels = new WeakMap()
  const label = window.__fdLabel = (el) => { let l = labels.get(el); if (!l) { l = /^(html|body)$/i.test(el.tagName) ? el.tagName.toLowerCase() : sel(el); labels.set(el, l) } return l }
  window.__fdVis = (el) => { const r = el.getBoundingClientRect(), s = getComputedStyle(el); return r.width > 3 && r.height > 3 && s.visibility !== 'hidden' && s.display !== 'none' && +s.opacity > 0.03 }
  window.__fdInView = (el, min) => {
    const r = el.getBoundingClientRect(), m = min || 4
    if (r.width < 3 || r.height < 3) return false
    if (Math.min(r.right, innerWidth) - Math.max(r.left, 0) < m || Math.min(r.bottom, innerHeight) - Math.max(r.top, 0) < m) return false
    try { if (el.checkVisibility && !el.checkVisibility({ opacityProperty: true, visibilityProperty: true, contentVisibilityAuto: true })) return false } catch (e) {}
    const s = getComputedStyle(el)
    return s.visibility !== 'hidden' && +s.opacity > 0.05
  }
  const styleMap = (t) => { const m = {}; for (const part of String(t || '').split(';')) { const i = part.indexOf(':'); if (i > 0) m[part.slice(0, i).trim()] = part.slice(i + 1).trim() } return m }
  const Y = () => Math.round(window.scrollY)
  try {
    new MutationObserver((list) => {
      for (const m of list) {
        const el = m.target
        if (el.nodeType !== 1) continue
        if (m.attributeName === 'class') {
          const old = new Set(String(m.oldValue || '').split(/\s+/).filter(Boolean)), now = new Set(String(el.getAttribute('class') || '').split(/\s+/).filter(Boolean))
          if (!labels.has(el) && !/^(html|body)$/i.test(el.tagName)) {
            const keep = [...old].filter((c) => now.has(c)).slice(0, 3)
            labels.set(el, keep.length || el.id ? el.tagName.toLowerCase() + (el.id ? '#' + el.id : '') + keep.map((c) => '.' + c).join('') : sel(el))
          }
          const base = label(el)
          const bump = (c, add) => {
            const k = base + ' ' + c
            let o = P.classes[k]
            if (!o) { if (Object.keys(P.classes).length >= 600) return; o = P.classes[k] = { add: 0, remove: 0, y0: Y(), y1: Y(), t: 0 } }
            if (add) o.add++; else o.remove++
            o.y1 = Y(); o.t = Math.round(performance.now())
          }
          for (const c of now) if (!old.has(c)) bump(c, true)
          for (const c of old) if (!now.has(c)) bump(c, false)
        } else if (m.attributeName === 'style') {
          const k = label(el)
          let o = P.styles[k]
          if (!o) { if (Object.keys(P.styles).length >= 400) continue; o = P.styles[k] = { n: 0, props: {}, b: {}, els: 0, seen: new WeakSet() } }
          if (!o.seen.has(el)) { o.seen.add(el); o.els++ }
          o.n++
          const bk = Math.floor(Y() / 300); o.b[bk] = (o.b[bk] || 0) + 1
          if (o.n <= 60) { const a = styleMap(m.oldValue), b = styleMap(el.getAttribute('style')); for (const p in b) if (a[p] !== b[p]) o.props[p] = (o.props[p] || 0) + 1 }
        }
      }
    }).observe(document, { subtree: true, attributes: true, attributeFilter: ['class', 'style'], attributeOldValue: true })
  } catch (e) {}
  try {
    const an = Element.prototype.animate
    if (an) Element.prototype.animate = function (kf, o) {
      try { if (P.waapi.length < 150) P.waapi.push({ target: sel(this), keyframes: JSON.parse(JSON.stringify(kf)), options: typeof o === 'object' && o ? JSON.parse(JSON.stringify(o)) : o, y: Y() }) } catch (e) {}
      return an.apply(this, arguments)
    }
  } catch (e) {}
  try {
    const IO = window.IntersectionObserver
    if (IO) window.IntersectionObserver = class extends IO {
      constructor(cb, o) {
        super(cb, o)
        this.__fd = { rootMargin: (o && o.rootMargin) || '0px', threshold: o && o.threshold !== undefined ? o.threshold : 0, root: o && o.root ? sel(o.root) : null, targets: [], n: 0 }
        if (P.io.length < 80) P.io.push(this.__fd)
      }
      observe(el) { try { this.__fd.n++; const s = sel(el); if (this.__fd.targets.length < 6 && !this.__fd.targets.includes(s)) this.__fd.targets.push(s) } catch (e) {} return super.observe(el) }
    }
  } catch (e) {}
  try {
    const TYPES = new Set(['scroll', 'wheel', 'mousemove', 'pointermove', 'mouseenter', 'mouseleave', 'pointerenter', 'pointerleave', 'mouseover', 'touchstart', 'touchmove', 'pointerdown', 'deviceorientation', 'resize', 'keydown', 'click', 'dragstart'])
    const add = EventTarget.prototype.addEventListener
    EventTarget.prototype.addEventListener = function (type) {
      try { if (TYPES.has(type)) { const k = type + ' @ ' + sel(this); if (P.listeners[k] || Object.keys(P.listeners).length < 400) P.listeners[k] = (P.listeners[k] || 0) + 1 } } catch (e) {}
      return add.apply(this, arguments)
    }
  } catch (e) {}
  try { const r = window.requestAnimationFrame; window.requestAnimationFrame = function (cb) { P.raf++; return r.call(window, cb) } } catch (e) {}
  try { const mm = window.matchMedia; window.matchMedia = function (q) { try { P.media[q] = (P.media[q] || 0) + 1 } catch (e) {} return mm.call(window, q) } } catch (e) {}
  try { if (document.startViewTransition) { const v = document.startViewTransition.bind(document); document.startViewTransition = function () { P.viewTransitions++; return v.apply(null, arguments) } } } catch (e) {}
  // Lenis global (UMD): guarda as opções e a instância, para ler a configuração e para navegar até um ponto da página
  try {
    let wrapped
    Object.defineProperty(window, 'Lenis', {
      configurable: true, enumerable: true,
      get() { return wrapped },
      set(V) {
        if (typeof V !== 'function') { wrapped = V; return }
        try {
          wrapped = class extends V {
            constructor(...a) {
              super(...a)
              try {
                window.__fdLenis.push(this)
                const o = a[0] || {}, clean = {}
                for (const k in o) { const v = o[k]; clean[k] = typeof v === 'function' ? 'fn: ' + String(v).replace(/\s+/g, ' ').slice(0, 120) : v && v.nodeType ? sel(v) : v === window ? 'window' : v }
                P.lenis.push(clean)
              } catch (e) {}
            }
          }
        } catch (e) { wrapped = V }
      },
    })
  } catch (e) {}
}

// ------------------------------------------------------------------ funções que rodam dentro da página

const IN_PAGE = {
  // estado da rolagem: posição, limite e se a página está travada (loader, intro)
  state: () => {
    const de = document.documentElement, b = document.body
    const max = Math.max(de.scrollHeight, b ? b.scrollHeight : 0) - innerHeight
    const blocked = (e) => { if (!e) return false; const s = getComputedStyle(e); return s.overflowY === 'hidden' || s.position === 'fixed' }
    const l = (window.__fdLenis || [])[0]
    return { t: Math.round(performance.now()), y: Math.round(scrollY), max: Math.round(max), locked: max < 40 || blocked(de) || blocked(b) || !!(l && l.isStopped), cls: de.className, pins: document.querySelectorAll('.pin-spacer').length }
  },

  // vai a uma posição sem animação; respeita o Lenis quando ele existe (senão ele puxa a página de volta)
  goTo: (y) => {
    const l = (window.__fdLenis || []).find((x) => x && typeof x.scrollTo === 'function')
    try { if (l) { l.scrollTo(y, { immediate: true, force: true }); return 'lenis' } } catch (e) {}
    window.scrollTo({ top: y, behavior: 'instant' })
    return 'nativo'
  },

  // índice das regras de CSS (uma vez): serve ao resumo do CSS e à leitura do "valor escrito pelo autor"
  indexRules: async () => {
    const C = window.__fdCss = { rules: [], keyframes: {}, fonts: new Map(), fontFaceCount: 0, media: {}, sheets: [] }
    const AUTH = ['font-size', 'line-height', 'letter-spacing', 'padding-top', 'padding-right', 'padding-bottom', 'padding-left', 'border-top-left-radius', 'gap', 'max-width', 'width', 'height']
    let order = 0
    const walk = (rules, media) => {
      for (const r of rules) {
        try {
          if (window.CSSStyleRule && r instanceof CSSStyleRule) {
            const auth = {}
            let any = false
            for (const p of AUTH) { const v = r.style.getPropertyValue(p); if (v) { auth[p] = v + (r.style.getPropertyPriority(p) ? ' !important' : ''); any = true } }
            C.rules.push({ s: r.selectorText || '', m: media, st: r.style, auth: any ? auth : null, order: order++ })
            if (r.cssRules && r.cssRules.length) walk(r.cssRules, media)
          } else if (r instanceof CSSKeyframesRule) {
            if (Object.keys(C.keyframes).length < 120) C.keyframes[r.name] = r.cssText.replace(/\s+/g, ' ').slice(0, 4000)
          } else if (r instanceof CSSFontFaceRule) {
            C.fontFaceCount++
            const s = r.style, family = s.getPropertyValue('font-family').replace(/["']/g, '').trim(), style = s.getPropertyValue('font-style') || 'normal'
            const src = s.getPropertyValue('src'), url = (src.match(/url\(["']?([^"')]+)/) || [])[1] || ''
            const k = family + '|' + style
            const f = C.fonts.get(k) || { family, style, weights: {}, files: 0, subsets: 0, hosts: {}, formats: {}, display: {}, sample: '' }
            const w = (s.getPropertyValue('font-weight') || '400').trim()
            f.weights[w] = (f.weights[w] || 0) + 1; f.files++
            if (s.getPropertyValue('unicode-range')) f.subsets++
            let host = 'embutida (data URI)'
            if (!url.startsWith('data:')) { try { host = new URL(url, location.href).hostname } catch (e) { host = '?' } }
            f.hosts[host] = (f.hosts[host] || 0) + 1
            const fm = (src.match(/format\(["']?([^"')]+)/) || [])[1] || (url.split('?')[0].match(/\.(\w+)$/) || [])[1] || '?'
            f.formats[fm] = (f.formats[fm] || 0) + 1
            const d = s.getPropertyValue('font-display'); if (d) f.display[d] = 1
            if (!f.sample && !url.startsWith('data:')) f.sample = url.slice(0, 200)
            C.fonts.set(k, f)
          } else if (r instanceof CSSMediaRule) {
            const c = r.conditionText || r.media.mediaText
            C.media[c] = (C.media[c] || 0) + r.cssRules.length
            walk(r.cssRules, media.concat(c))
          } else if (r instanceof CSSImportRule) {
            try { if (r.styleSheet) walk(r.styleSheet.cssRules, media) } catch (e) {}
          } else if (r.cssRules) {
            walk(r.cssRules, media.concat(r.conditionText ? `@${r.constructor.name.replace(/^CSS|Rule$/g, '').toLowerCase()} ${r.conditionText}` : []))
          }
        } catch (e) { /* regra desconhecida */ }
      }
    }
    for (const sheet of [...document.styleSheets, ...(document.adoptedStyleSheets || [])]) {
      let rules = null
      try { rules = sheet.cssRules } catch (e) {
        try { const t = await (await fetch(sheet.href)).text(); const cs = new CSSStyleSheet(); cs.replaceSync(t); rules = cs.cssRules } catch (e2) { C.sheets.push({ href: sheet.href, blocked: true }); continue }
      }
      const before = C.rules.length, ffBefore = C.fontFaceCount
      walk(rules, sheet.media && sheet.media.mediaText ? [sheet.media.mediaText] : [])
      C.sheets.push({ href: sheet.href || (sheet.ownerNode && sheet.ownerNode.tagName === 'STYLE' ? 'inline <style>' : 'adotada'), rules: C.rules.length - before, fontFaces: C.fontFaceCount - ffBefore })
    }

    // especificidade aproximada de um seletor simples (sem vírgulas)
    const spec = (s) => {
      let a = 0, b = 0, c = 0
      s = s.replace(/:where\((?:[^()]|\([^()]*\))*\)/g, '')
      s = s.replace(/::[\w-]+/g, () => { c++; return '' })
      s = s.replace(/\[[^\]]*\]/g, () => { b++; return '' })
      s = s.replace(/#[\w-]+/g, () => { a++; return '' })
      s = s.replace(/\.[\w-]+/g, () => { b++; return '' })
      s = s.replace(/:(not|is|has|matches)\(/g, '(')
      s = s.replace(/:[\w-]+(\([^()]*\))?/g, () => { b++; return '' })
      s = s.replace(/[a-zA-Z][\w-]*/g, () => { c++; return '' })
      return a * 10000 + b * 100 + c
    }
    const parts = (s) => { const out = []; let d = 0, cur = ''; for (const ch of s) { if (ch === '(' || ch === '[') d++; else if (ch === ')' || ch === ']') d--; if (ch === ',' && d === 0) { out.push(cur.trim()); cur = '' } else cur += ch } if (cur.trim()) out.push(cur.trim()); return out }
    const mq = new Map()
    const mediaOk = (list) => {
      for (const m of list) {
        if (m.startsWith('@')) continue
        if (!mq.has(m)) { try { mq.set(m, window.__fdMM ? window.__fdMM(m).matches : true) } catch (e) { mq.set(m, true) } }
        if (!mq.get(m)) return false
      }
      return true
    }
    const byProp = {}
    for (const p of AUTH) byProp[p] = C.rules.filter((r) => r.auth && r.auth[p])
    const INHERIT = new Set(['font-size', 'line-height', 'letter-spacing'])
    const memo = new WeakMap()      // por elemento: o viewport não muda durante a página, então o resultado é estável
    // valor que o autor escreveu para uma propriedade neste elemento (regra vencedora da cascata, aproximada)
    window.__fdAuthored = (el, props) => {
      const out = {}
      const find = (node, prop) => {
        let m = memo.get(node)
        if (!m) { m = {}; memo.set(node, m) }
        if (prop in m) return m[prop]
        return (m[prop] = lookup(node, prop))
      }
      const lookup = (node, prop) => {
        const inline = node.style && node.style.getPropertyValue(prop)
        if (inline) return { v: inline, from: 'inline' }
        let best = null, bestScore = -1
        for (const r of byProp[prop] || []) {
          const v = r.auth[prop]
          if (!mediaOk(r.m)) continue
          let hit = false
          try { hit = node.matches(r.s) } catch (e) {}
          if (!hit) continue
          let sp = 0
          for (const p of parts(r.s)) { try { if (node.matches(p)) sp = Math.max(sp, spec(p)) } catch (e) {} }
          const score = (v.includes('!important') ? 1e9 : 0) + sp * 1e5 + r.order
          if (score > bestScore) { bestScore = score; best = { v, sel: r.s.slice(0, 80), media: r.m.join(' and ') } }
        }
        return best
      }
      for (const prop of props) {
        let node = el, hop = 0, hit = null
        while (node && node.nodeType === 1 && hop < 6) { hit = find(node, prop); if (hit || !INHERIT.has(prop)) break; node = node.parentElement; hop++ }
        if (!hit) continue
        let v = hit.v
        const ref = /var\((--[\w-]+)/.exec(v)
        if (ref) { const r = getComputedStyle(el).getPropertyValue(ref[1]).trim(); if (r) v += ` → ${r}` }
        out[prop] = v + (hop > 0 ? ` (herdado de ${window.__fdSel(node)})` : '')
      }
      return out
    }
    return { rules: C.rules.length, sheets: C.sheets.length }
  },

  // leitura única (no topo, depois da intro): marca, blocos da página, contêineres, mídia, navegação, acessibilidade
  page: () => {
    const sel = window.__fdSel, vis = window.__fdVis
    const meta = (n) => { const m = document.querySelector(`meta[name="${n}"],meta[property="${n}"]`); return m ? m.content : null }
    const txt = (el) => (el.textContent || '').replace(/\s+/g, ' ').trim()
    const clear = (c) => !c || c === 'transparent' || /rgba?\([^)]*,\s*0\)$/.test(c) || /\/\s*0\)$/.test(c)
    const docRect = (el) => { const r = el.getBoundingClientRect(); return { x: Math.round(r.left + scrollX), y: Math.round(r.top + scrollY), w: Math.round(r.width), h: Math.round(r.height) } }
    const pick = (el, props) => { const s = getComputedStyle(el), o = {}; for (const p of props) o[p] = s.getPropertyValue(p); return o }
    const mark = (el, id) => el.setAttribute('data-fdc', ((el.getAttribute('data-fdc') || '') + ' ' + id).trim())

    const icons = [...document.querySelectorAll('link[rel~="icon"], link[rel="apple-touch-icon"], link[rel="mask-icon"]')].map((l) => ({ rel: l.rel, href: l.href, sizes: l.getAttribute('sizes'), type: l.type || null }))
    let logoEl = null
    for (const q of ['header a[href="/"] svg, header a[href="/"] img', 'header [class*="logo" i] svg, header [class*="logo" i] img, header [class*="brand" i] svg, header [class*="brand" i] img',
      'header [class*="logo" i], header [class*="brand" i], header [class*="wordmark" i]', '[class*="logo" i]:is(svg,img)', 'header a svg, header a img, nav a svg, nav a img', '[class*="logo" i]', 'header a']) {
      logoEl = [...document.querySelectorAll(q)].find((el) => vis(el) && el.getBoundingClientRect().top < 220 && el.getBoundingClientRect().width < innerWidth * 0.6)
      if (logoEl) break
    }
    let logo = null
    if (logoEl) {
      mark(logoEl, 'logo')
      const tag = logoEl.tagName.toLowerCase()
      logo = { selector: sel(logoEl), tag, rect: docRect(logoEl), alt: logoEl.getAttribute('alt') || logoEl.getAttribute('aria-label') || null, text: txt(logoEl).slice(0, 80) || null,
        src: tag === 'img' ? logoEl.currentSrc || logoEl.src : null, svg: tag === 'svg' ? logoEl.outerHTML.slice(0, 40000) : null,
        style: tag !== 'svg' && tag !== 'img' ? pick(logoEl, ['font-family', 'font-size', 'font-weight', 'letter-spacing', 'text-transform', 'color']) : null }
    }
    const brand = { title: document.title, description: meta('description'), ogTitle: meta('og:title'), ogDescription: meta('og:description'), ogImage: meta('og:image'), siteName: meta('og:site_name'),
      themeColor: [...document.querySelectorAll('meta[name="theme-color"]')].map((m) => ({ color: m.content, media: m.media || null })), lang: document.documentElement.lang || null, icons, logo,
      htmlAttrs: [...document.documentElement.attributes].map((a) => `${a.name}="${a.value}"`).filter((a) => !a.startsWith('data-fd') && a !== 'style=""').slice(0, 10), generator: meta('generator') }

    // blocos da página (estrutura do documento)
    let kids = [...(document.querySelector('main') || document.body).children]
    for (let i = 0; i < 2 && kids.filter((k) => vis(k) && k.getBoundingClientRect().height > 200).length < 3; i++) {
      const big = kids.filter(vis).sort((a, b) => b.getBoundingClientRect().height - a.getBoundingClientRect().height)[0]
      if (!big) break
      kids = [...big.children]
    }
    const blocks = [...new Set([document.querySelector('header'), ...kids, document.querySelector('footer')])].filter((el) => el && vis(el) && el.getBoundingClientRect().height > 60 && getComputedStyle(el).position !== 'fixed')
    const sections = blocks.slice(0, 40).map((el) => {
      const pinned = el.classList.contains('pin-spacer') ? el.firstElementChild : null, real = pinned || el
      const s = getComputedStyle(real), h = real.querySelector('h1, h2, h3')
      return { selector: sel(real), pinSpacer: !!pinned, ...docRect(el), background: clear(s.backgroundColor) ? null : s.backgroundColor, backgroundImage: s.backgroundImage !== 'none' ? s.backgroundImage.slice(0, 120) : null,
        padding: pinned ? `${getComputedStyle(real).paddingTop} ${getComputedStyle(real).paddingRight} ${getComputedStyle(real).paddingBottom} ${getComputedStyle(real).paddingLeft}` : `${s.paddingTop} ${s.paddingRight} ${s.paddingBottom} ${s.paddingLeft}`,
        position: getComputedStyle(el).position, heading: h ? txt(h).slice(0, 70) : null,
        images: real.querySelectorAll('img, picture').length, hasCanvas: !!real.querySelector('canvas'), hasVideo: !!real.querySelector('video') }
    })

    // contêineres e grids (documento inteiro)
    const widths = new Map(), grids = new Map(), flexGaps = new Map()
    let n = 0
    for (const el of document.querySelectorAll('body *')) {
      if (++n > 6000) break
      const s = getComputedStyle(el)
      if (s.display === 'none') continue
      const mw = parseFloat(s.maxWidth)
      if (mw >= 480 && mw <= 2200 && s.marginLeft === s.marginRight && el.getBoundingClientRect().width > 300) { const k = s.maxWidth; const o = widths.get(k) || { n: 0, sample: sel(el) }; o.n++; widths.set(k, o) }
      if (s.display.includes('grid')) { const cols = s.gridTemplateColumns.split(' ').filter((x) => x !== 'none').length; if (cols > 1) { const k = `${cols} colunas · gap ${s.columnGap} / ${s.rowGap}`; const o = grids.get(k) || { n: 0, sample: sel(el) }; o.n++; grids.set(k, o) } }
      if (s.display.includes('flex') && parseFloat(s.columnGap) > 0) { const k = s.columnGap; flexGaps.set(k, (flexGaps.get(k) || 0) + 1) }
    }
    const top = (m, k = 8) => [...m.entries()].sort((a, b) => (b[1].n || b[1]) - (a[1].n || a[1])).slice(0, k).map(([value, v]) => (typeof v === 'number' ? { value, count: v } : { value, count: v.n, sample: v.sample }))

    // imagens, ícones, mídia (documento inteiro, mesmo o que ainda não apareceu)
    const sized = (el) => { const r = el.getBoundingClientRect(); return r.width > 3 && r.height > 3 }
    const imgs = [...document.querySelectorAll('img')].filter(sized)
    const fmt = new Map(), rad = new Map(), ratio = new Map(), fit = new Map()
    for (const im of imgs) {
      const s = getComputedStyle(im), r = im.getBoundingClientRect()
      const ext = ((im.currentSrc || im.src || '').split('?')[0].match(/\.(\w{2,5})$/) || [0, (im.currentSrc || '').startsWith('data:') ? 'data-uri' : '?'])[1].toLowerCase()
      fmt.set(ext, (fmt.get(ext) || 0) + 1); rad.set(s.borderRadius, (rad.get(s.borderRadius) || 0) + 1); fit.set(s.objectFit, (fit.get(s.objectFit) || 0) + 1)
      if (r.width > 40) { const k = (r.width / r.height).toFixed(2); ratio.set(k, (ratio.get(k) || 0) + 1) }
    }
    const svgs = [...document.querySelectorAll('svg')].filter(sized)
    const svgSize = new Map()
    let stroke = 0
    for (const s of svgs) {
      const r = s.getBoundingClientRect(), k = `${Math.round(r.width)}×${Math.round(r.height)}`
      svgSize.set(k, (svgSize.get(k) || 0) + 1)
      const p = s.querySelector('path, line, circle, rect, polyline')
      if (p && getComputedStyle(p).stroke !== 'none' && getComputedStyle(p).fill === 'none') stroke++
    }
    const media = { images: { total: imgs.length, lazy: imgs.filter((i) => i.loading === 'lazy').length, withAlt: imgs.filter((i) => (i.getAttribute('alt') || '').trim()).length, decorativeAlt: imgs.filter((i) => i.getAttribute('alt') === '').length, formats: top(fmt), radius: top(rad, 6), aspect: top(ratio, 6), objectFit: top(fit, 3),
      backgroundImages: [...document.querySelectorAll('body *')].slice(0, 5000).filter((el) => /url\(/.test(getComputedStyle(el).backgroundImage)).length },
      svg: { inline: svgs.length, strokeBased: stroke, sizes: top(svgSize, 6), asImage: imgs.filter((i) => /\.svg(\?|$)/.test(i.currentSrc || i.src)).length },
      canvases: [...document.querySelectorAll('canvas')].map((c) => ({ selector: sel(c), parent: sel(c.parentElement), ...docRect(c), engine: c.getAttribute('data-engine'), position: getComputedStyle(c).position, pointerEvents: getComputedStyle(c).pointerEvents })),
      videos: [...document.querySelectorAll('video')].map((v) => ({ selector: sel(v), src: v.currentSrc || v.src, autoplay: v.autoplay, loop: v.loop, muted: v.muted, ...docRect(v) })),
      iframes: [...document.querySelectorAll('iframe')].map((f) => f.src).slice(0, 8),
      embeds: ['spline-viewer', 'model-viewer', 'lottie-player', 'dotlottie-player', 'dotlottie-wc'].filter((t) => document.querySelector(t)) }

    const NAV = ['position', 'top', 'height', 'background-color', 'backdrop-filter', 'box-shadow', 'border-bottom-width', 'border-bottom-color', 'padding-top', 'padding-bottom', 'z-index', 'transition', 'color', 'transform']
    const navEl = [...document.querySelectorAll('header, [role="banner"], nav')].find((el) => vis(el) && el.getBoundingClientRect().top < 140 && el.getBoundingClientRect().height < innerHeight * 0.5)
    let nav = null
    if (navEl) {
      mark(navEl, 'nav')
      const toggles = [...navEl.querySelectorAll('button, [role="button"]')].filter(vis).map((b) => ({ selector: sel(b), label: b.getAttribute('aria-label') || txt(b).slice(0, 30) }))
      nav = { selector: sel(navEl), rect: docRect(navEl), links: [...navEl.querySelectorAll('a')].filter(vis).length, linkTexts: [...navEl.querySelectorAll('a')].filter(vis).map(txt).filter((t) => t && t.length < 40).slice(0, 14), buttons: toggles, style: pick(navEl, NAV) }
    }
    const a11y = { lang: document.documentElement.lang || null, landmarks: ['header', 'nav', 'main', 'footer'].filter((t) => document.querySelector(t)), skipLink: !!document.querySelector('a[href^="#"][class*="skip" i]'),
      imagesWithoutAlt: [...document.querySelectorAll('img')].filter((i) => !i.hasAttribute('alt')).length, ariaLabels: document.querySelectorAll('[aria-label]').length, h1Count: document.querySelectorAll('h1').length,
      headingOrder: [...document.querySelectorAll('h1,h2,h3,h4')].slice(0, 60).map((h) => h.tagName[1]).join('') }
    const body = getComputedStyle(document.body), html = getComputedStyle(document.documentElement)
    const footer = document.querySelector('footer')
    return { brand, sections, footerText: footer ? txt(footer).slice(0, 300) : null,
      layout: { viewport: [innerWidth, innerHeight], pageHeight: document.documentElement.scrollHeight, maxWidths: top(widths, 6), grids: top(grids, 8), flexGaps: top(flexGaps, 8), scrollBehavior: html.scrollBehavior, scrollSnap: html.scrollSnapType, pinSpacers: document.querySelectorAll('.pin-spacer').length },
      media, nav, a11y, body: { background: body.backgroundColor, color: body.color, fontFamily: body.fontFamily, fontSize: body.fontSize, lineHeight: body.lineHeight, fontWeight: body.fontWeight, smoothing: body.webkitFontSmoothing } }
  },

  // leitura por parada de rolagem: só o que está visível na tela AGORA e ainda não foi contado
  collect: () => {
    const sel = window.__fdSel, inView = window.__fdInView, auth = window.__fdAuthored || (() => ({}))
    const S = window.__fdSeenText || (window.__fdSeenText = new WeakSet()), SC = window.__fdSeenComp || (window.__fdSeenComp = new WeakSet())
    window.__fdN = window.__fdN || 0
    const txt = (el) => (el.textContent || '').replace(/\s+/g, ' ').trim()
    const ownText = (el) => { let t = ''; for (const n of el.childNodes) if (n.nodeType === 3) t += n.nodeValue; return t.replace(/\s+/g, ' ').trim() }
    const clear = (c) => !c || c === 'transparent' || /rgba?\([^)]*,\s*0\)$/.test(c) || /\/\s*0\)$/.test(c)
    const pick = (el, props) => { const s = getComputedStyle(el), o = {}; for (const p of props) o[p] = s.getPropertyValue(p); return o }
    const vp = (el) => { const r = el.getBoundingClientRect(); return { x: Math.round(r.left), y: Math.round(r.top), w: Math.round(r.width), h: Math.round(r.height) } }
    const out = { y: Math.round(scrollY), texts: [], comps: { btn: [], link: [], input: [], card: [] }, copy: { h1: [], h2: [], h3: [], labels: [], cta: [], paragraphs: [] } }
    const all = [...document.body.querySelectorAll('*')].slice(0, 9000)

    // textos: todo elemento com texto próprio
    for (const el of all) {
      if (out.texts.length >= 70) break
      if (S.has(el) || /^(script|style|noscript|svg|path|option|code|pre)$/i.test(el.tagName)) continue
      const t = ownText(el)
      if (t.length < 2 || !inView(el)) continue
      S.add(el)
      const s = getComputedStyle(el), size = parseFloat(s.fontSize)
      if (!(size > 0)) continue
      const a = auth(el, ['font-size', 'line-height', 'letter-spacing'])
      const tag = el.tagName.toLowerCase()
      out.texts.push({ selector: sel(el), tag, size, lineHeight: s.lineHeight, weight: s.fontWeight, tracking: s.letterSpacing, family: s.fontFamily.split(',')[0].replace(/["']/g, '').trim(), style: s.fontStyle, transform: s.textTransform, color: s.color, chars: t.length, sample: t.slice(0, 60), authored: a,
        stroke: parseFloat(s.webkitTextStrokeWidth) > 0 ? `${s.webkitTextStrokeWidth} ${s.webkitTextStrokeColor}` : null, clipText: s.webkitBackgroundClip === 'text' || s.backgroundClip === 'text' })
      const full = txt(el)
      if (/^h[1-3]$/.test(tag)) out.copy[tag].push(full.slice(0, 120))
      else if (tag === 'p' && full.length >= 40 && out.copy.paragraphs.length < 3) out.copy.paragraphs.push(full.slice(0, 220))
      else if ((s.textTransform === 'uppercase' || /eyebrow|kicker|overline|label|tag|caption/i.test(el.getAttribute('class') || '')) && full.length < 50 && size <= 16) out.copy.labels.push(full)
    }
    for (const h of document.querySelectorAll('h1, h2, h3')) { const k = h.tagName.toLowerCase(), t = txt(h).slice(0, 120); if (t && inView(h) && !out.copy[k].includes(t)) out.copy[k].push(t) }

    // componentes
    const BTN = ['background-color', 'background-image', 'color', 'border-top-width', 'border-top-style', 'border-top-color', 'border-radius', 'padding-top', 'padding-right', 'padding-bottom', 'padding-left', 'font-family', 'font-size', 'font-weight', 'letter-spacing', 'text-transform', 'line-height', 'box-shadow', 'height', 'gap', 'transition', 'backdrop-filter', 'text-decoration-line', 'cursor']
    const group = (els, props, keyProps, kind, max, extra) => {
      const m = new Map()
      for (const el of els) {
        SC.add(el)
        const s = pick(el, props), k = keyProps.map((p) => s[p]).join('|')
        const g = m.get(k) || { count: 0, el, style: s, samples: [] }
        g.count++
        if (g.samples.length < 4) { const t = txt(el).slice(0, 40); if (t && !g.samples.includes(t)) g.samples.push(t) }
        m.set(k, g)
      }
      return [...m.entries()].sort((a, b) => b[1].count - a[1].count).slice(0, max).map(([key, g]) => {
        const id = `${kind}-${window.__fdN++}`
        g.el.setAttribute('data-fdc', ((g.el.getAttribute('data-fdc') || '') + ' ' + id).trim())
        const o = { id, key, selector: sel(g.el), tag: g.el.tagName.toLowerCase(), count: g.count, samples: g.samples, rect: vp(g.el), style: g.style, authored: auth(g.el, ['font-size', 'padding-top', 'padding-left', 'border-top-left-radius', 'height', 'width']) }
        if (extra) extra(o, g.el)
        return o
      })
    }
    const fresh = (el) => !SC.has(el) && inView(el, 12)
    const isBtn = (el) => {
      const t = el.tagName.toLowerCase()
      if (t === 'button' || el.getAttribute('role') === 'button' || (t === 'input' && /submit|button/.test(el.type))) return true
      if (t !== 'a') return false
      const s = getComputedStyle(el)
      return /btn|button|cta/i.test(el.getAttribute('class') || '') || ((!clear(s.backgroundColor) || parseFloat(s.borderTopWidth) > 0) && parseFloat(s.paddingLeft) >= 8 && el.getBoundingClientRect().height < 90 && s.display !== 'block')
    }
    const btnAll = [...document.querySelectorAll('button, [role="button"], input[type="submit"], input[type="button"], a')].filter(isBtn)
    const btnSet = new Set(btnAll)
    out.comps.btn = group(btnAll.filter(fresh), BTN, ['background-color', 'color', 'border-radius', 'border-top-width', 'border-top-color', 'font-size', 'padding-left', 'padding-top'], 'btn', 6)
    for (const b of out.comps.btn) for (const t of b.samples) if (t.length > 1 && t.length < 50) out.copy.cta.push(t)
    out.comps.link = group([...document.querySelectorAll('a')].filter((a) => !btnSet.has(a) && fresh(a) && txt(a) && !a.querySelector('img, picture, video')),
      ['color', 'text-decoration-line', 'text-decoration-color', 'font-size', 'font-weight', 'font-family', 'letter-spacing', 'text-transform', 'transition', 'opacity'], ['color', 'text-decoration-line', 'font-size', 'font-weight'], 'link', 4)
    out.comps.input = group([...document.querySelectorAll('input:not([type="hidden"]):not([type="submit"]):not([type="button"]):not([type="checkbox"]):not([type="radio"]), textarea, select')].filter(fresh), BTN, ['background-color', 'border-radius', 'border-top-color', 'border-bottom-color', 'font-size'], 'input', 3,
      (o, el) => { o.placeholder = el.getAttribute('placeholder') || null; o.type = el.getAttribute('type') || el.tagName.toLowerCase(); const s = getComputedStyle(el); o.borderBottom = `${s.borderBottomWidth} ${s.borderBottomStyle} ${s.borderBottomColor}` })
    const area = innerWidth * innerHeight
    const cardEls = all.filter((el) => {
      if (!/^(div|article|li|section|a|figure|blockquote|form)$/i.test(el.tagName) || btnSet.has(el) || !el.children.length || !fresh(el)) return false
      const r = el.getBoundingClientRect(), a = r.width * r.height
      if (a < area * 0.012 || a > area * 0.6 || r.width > innerWidth * 0.98) return false
      const s = getComputedStyle(el)
      return (!clear(s.backgroundColor) || s.boxShadow !== 'none' || parseFloat(s.borderTopWidth) > 0) && (parseFloat(s.borderRadius) > 0 || s.boxShadow !== 'none')
    })
    out.comps.card = group(cardEls, ['background-color', 'background-image', 'border-radius', 'box-shadow', 'border-top-width', 'border-top-color', 'padding-top', 'padding-right', 'padding-bottom', 'padding-left', 'overflow', 'transition', 'backdrop-filter', 'color'], ['background-color', 'border-radius', 'box-shadow', 'border-top-width'], 'card', 5,
      (o, el) => { const r = el.getBoundingClientRect(); o.size = `${Math.round(r.width)}×${Math.round(r.height)}`; o.contains = { headings: el.querySelectorAll('h1,h2,h3,h4').length, images: el.querySelectorAll('img,picture,svg,video').length, text: txt(el).slice(0, 80) } })
    return out
  },

  // resumo das folhas de estilo: variáveis, animações, transições, estados, recursos, regras das classes trocadas
  css: (toggled) => {
    const C = window.__fdCss
    const out = { classRules: {}, vars: [], keyframes: C.keyframes, fontFaces: [], fontFaceCount: C.fontFaceCount, media: C.media, animations: [], transitions: [], states: [], features: {}, reducedMotionRules: 0, sheets: C.sheets, counts: { rules: C.rules.length, vars: 0 } }
    for (const f of C.fonts.values()) out.fontFaces.push({ family: f.family, style: f.style, weights: Object.keys(f.weights).sort((a, b) => parseFloat(a) - parseFloat(b)), files: f.files, subsets: f.subsets, hosts: Object.keys(f.hosts), formats: Object.keys(f.formats), display: Object.keys(f.display), sample: f.sample })
    const FEATURES = { 'position': /sticky/, 'scroll-snap-type': /./, 'animation-timeline': /^(?!auto$)/, 'view-transition-name': /./, 'backdrop-filter': /^(?!none)/, 'mix-blend-mode': /^(?!normal)/, 'clip-path': /^(?!none)/, 'mask-image': /^(?!none)/, '-webkit-mask-image': /^(?!none)/,
      'filter': /^(?!none)/, 'perspective': /^(?!none)/, 'transform-style': /preserve-3d/, 'will-change': /./, 'scroll-behavior': /smooth/, 'container-type': /^(?!normal)/, 'text-wrap': /balance|pretty/, 'aspect-ratio': /^(?!auto$)/, 'background-clip': /text/, '-webkit-background-clip': /text/ }
    const tclass = (toggled || []).map((c) => [c, new RegExp('\\.' + c.replace(/[^\w-]/g, '\\$&') + '(?![\\w-])')])
    // corta um bloco de declarações em um limite de declaração, nunca no meio
    const decl = (st, max) => { const parts = st.cssText.split(/;\s*/).filter(Boolean); let s = ''; for (const p of parts) { if (s.length + p.length > max) { s += ' …'; break } s += (s ? ' ' : '') + p + ';' } return s }
    for (const r of C.rules) {
      const st = r.st, s = r.s, m = r.m.join(' and '), reduced = /prefers-reduced-motion/.test(m)
      if (reduced) out.reducedMotionRules++
      for (const [c, re] of tclass) if (s.includes('.' + c) && re.test(s) && !reduced) { const l = out.classRules[c] || (out.classRules[c] = []); if (l.length < 8) l.push((m ? '@media ' + m + ' { ' : '') + s.slice(0, 160) + ' { ' + decl(st, 300) + ' }' + (m ? ' }' : '')) }
      const vars = {}
      for (let i = 0; i < st.length; i++) { const p = st[i]; if (p.startsWith('--') && !p.startsWith('--tw-')) vars[p] = st.getPropertyValue(p).trim() }
      if (Object.keys(vars).length && out.counts.vars < 1500) { out.counts.vars += Object.keys(vars).length; out.vars.push({ selector: s.slice(0, 120), media: m, vars }) }
      const an = st.getPropertyValue('animation-name'), anRaw = st.getPropertyValue('animation')
      if (!an && anRaw && anRaw !== 'none' && out.animations.length < 300) out.animations.push({ selector: s.slice(0, 140), media: m, raw: anRaw.replace(/\s+/g, ' ').trim() })   // shorthand com var(): os longhands vêm vazios
      if (an && an !== 'none' && out.animations.length < 300) {
        const tl = st.getPropertyValue('animation-timeline')
        out.animations.push({ selector: s.slice(0, 140), media: m, name: an, duration: st.getPropertyValue('animation-duration'), easing: st.getPropertyValue('animation-timing-function'), delay: st.getPropertyValue('animation-delay'), iteration: st.getPropertyValue('animation-iteration-count'), fill: st.getPropertyValue('animation-fill-mode'), direction: st.getPropertyValue('animation-direction'), timeline: tl && tl !== 'auto' ? tl : null })
      }
      const tp = st.getPropertyValue('transition') || (st.getPropertyValue('transition-property') ? `${st.getPropertyValue('transition-property')} ${st.getPropertyValue('transition-duration')} ${st.getPropertyValue('transition-timing-function')} ${st.getPropertyValue('transition-delay')}` : '')
      if (tp && tp.trim() && out.transitions.length < 500) out.transitions.push({ selector: s.slice(0, 140), media: m, value: tp.trim() })
      if (/:hover|:focus-visible|:focus-within|:active|:focus\b/.test(s) && out.states.length < 300) out.states.push({ selector: s.slice(0, 160), media: m, css: decl(st, 400) })
      for (const p in FEATURES) {
        const v = st.getPropertyValue(p)
        if (v && FEATURES[p].test(v)) { const k = p === 'position' ? 'position: sticky' : p.replace('-webkit-', ''); const f = out.features[k] || (out.features[k] = { count: 0, samples: [] }); f.count++; if (f.samples.length < 12) f.samples.push({ selector: s.slice(0, 100), value: v.slice(0, 80), media: m }) }
      }
    }
    const cs = getComputedStyle(document.documentElement)
    out.rootResolved = {}
    for (const b of out.vars) if (/^(:root|html|body)$/.test(b.selector.trim()) && !b.media) for (const k in b.vars) out.rootResolved[k] = cs.getPropertyValue(k).trim()
    return out
  },

  // animações CSS e Web Animations rodando agora
  animations: () => {
    const sel = window.__fdSel
    const KIND = { CSSAnimation: 'keyframes', CSSTransition: 'transição', Animation: 'WAAPI' }
    return document.getAnimations().slice(0, 500).map((a) => {
      const e = a.effect, t = e && e.getComputedTiming ? e.getComputedTiming() : {}, raw = e && e.getTiming ? e.getTiming() : {}
      let props = [], kfEase = null
      try { const kf = e.getKeyframes(); props = [...new Set(kf.flatMap((k) => Object.keys(k)))].filter((k) => !['offset', 'easing', 'composite', 'computedOffset'].includes(k)); if (kf[0] && kf[0].easing && kf[0].easing !== 'linear') kfEase = kf[0].easing } catch (err) {}
      return { type: KIND[a.constructor.name] || a.constructor.name, name: a.animationName || a.transitionProperty || a.id || '', target: (e && e.target && e.target.nodeType === 1 ? window.__fdLabel(e.target) : sel(e && e.target)) + ((e && e.pseudoElement) || ''), duration: t.duration, delay: t.delay,
        easing: raw.easing === 'linear' && kfEase ? kfEase : raw.easing, iterations: t.iterations === Infinity ? 'infinite' : t.iterations, fill: t.fill, direction: t.direction, timeline: a.timeline && a.timeline.constructor.name !== 'DocumentTimeline' ? a.timeline.constructor.name : null, props }
    })
  },

  // GSAP global: timelines na ordem, tweens com easing real, ScrollTriggers e a faixa de rolagem de cada tween
  gsap: (withinId) => {
    const g = window.gsap
    if (!g || !g.globalTimeline) return null
    const sel = window.__fdSel
    const scope = withinId ? document.querySelector(`[data-fdc~="${withinId}"]`) : null
    const short = (v) => {
      if (typeof v === 'function') return 'fn()'
      if (v && v.nodeType) return sel(v)
      if (v && typeof v === 'object') { try { return JSON.parse(JSON.stringify(v, (k, x) => (typeof x === 'function' ? 'fn()' : x && x.nodeType ? sel(x) : x))) } catch (e) { return '[objeto]' } }
      return v
    }
    const EASES = window.__fdEases || (window.__fdEases = (() => {
      const m = new Map()
      for (const n of ['none', 'power1', 'power2', 'power3', 'power4', 'sine', 'expo', 'circ', 'back', 'elastic', 'bounce']) for (const t of n === 'none' ? [''] : ['.out', '.in', '.inOut']) { try { const f = g.parseEase(n + t); if (f && !m.has(f)) m.set(f, n + t) } catch (e) {} }
      return m
    })())
    const easeOf = (c, v) => {
      if (typeof v.ease === 'string') return v.ease
      const f = typeof v.ease === 'function' ? v.ease : c._ease
      if (typeof f === 'function') { const n = EASES.get(f); if (n) return n; try { return `personalizada [f(.25)=${+f(0.25).toFixed(3)} f(.5)=${+f(0.5).toFixed(3)} f(.75)=${+f(0.75).toFixed(3)}]` } catch (e) {} }
      try { const d = g.defaults().ease; return `${typeof d === 'string' ? d : 'power1.out'} (padrão)` } catch (e) { return 'power1.out (padrão)' }
    }
    const TL = window.__fdTl || (window.__fdTl = { map: new WeakMap(), n: 0 })
    const ST = window.ScrollTrigger || (g.core && g.core.globals && g.core.globals().ScrollTrigger)
    const sts = ST && ST.getAll ? ST.getAll().slice(0, 300) : []
    const stIndex = new Map(sts.map((s, i) => [s, i + 1]))
    // valores finais calculados pelo GSAP (resolve funções e valores relativos); só existe depois que o tween inicializa
    const resolved = (tw) => {
      const o = {}
      try {
        const first = tw.timeline && tw.timeline.getChildren ? tw.timeline.getChildren(false, true, false)[0] || tw : tw
        for (let pt = first._pt; pt; pt = pt._next) {
          const d = pt.d
          if (d && d._pt) for (let q = d._pt; q; q = q._next) if (typeof q.p === 'string' && typeof q.s === 'number' && typeof q.c === 'number') o[q.p] = `${+q.s.toFixed(2)} → ${+(q.s + q.c).toFixed(2)}${q.u || ''}`
        }
      } catch (e) {}
      return o
    }
    const out = { version: g.version, tweens: [], timelines: [], scrollTriggers: [], plugins: [], defaults: null }
    try { const d = g.defaults(); out.defaults = { ease: typeof d.ease === 'string' ? d.ease : EASES.get(d.ease) || 'função personalizada', duration: d.duration } } catch (e) {}
    const seen = new Set()
    const SKIP = /^on[A-Z]|^callbackScope$|^scrollTrigger$|^id$|^data$|^parent$|^immediateRender$|^lazy$|^overwrite$|^runBackwards$|^startAt$|^inherit$|^stagger$|^ease$|^duration$|^delay$|^repeat$|^yoyo$|^repeatDelay$|^paused$|^force3D$|^keyframes$/
    const tween = (c) => {
      if (!c || !c.targets || seen.has(c) || out.tweens.length >= 500) return
      seen.add(c)
      const v = c.vars || {}
      const tg = c.targets()
      if ('totalProgress' in v || !tg.some((x) => x && x.nodeType)) return      // proxies internos do scrub e delayedCall
      const to = {}, fnKeys = []
      for (const k in v) if (!SKIP.test(k)) { to[k] = short(v[k]); if (typeof v[k] === 'function' || (typeof v[k] === 'string' && /^[+-]=/.test(v[k]))) fnKeys.push(k) }
      let res = null
      if (fnKeys.length) { const r = resolved(c); res = {}; for (const k of fnKeys) { const rk = k === 'rotation' || k === 'rotationZ' ? 'rotation' : k; if (r[rk] !== undefined) res[k] = r[rk] } if (!Object.keys(res).length) res = null }
      // posição dentro da timeline raiz (a que está direto na linha do tempo global)
      let root = null, at = c.startTime(), p = c.parent
      while (p && p !== g.globalTimeline) { root = p; if (p.parent && p.parent !== g.globalTimeline) at += p.startTime(); p = p.parent }
      let tl = null
      if (root) {
        let id = TL.map.get(root)
        if (!id) { id = ++TL.n; TL.map.set(root, id) }
        tl = id
        if (!out.timelines.some((x) => x.id === id)) {
          const st = root.scrollTrigger
          out.timelines.push({ id, duration: +root.duration().toFixed(3), repeat: root.repeat ? root.repeat() : 0, yoyo: root.yoyo ? root.yoyo() : false, paused: root.paused(), labels: root.labels && Object.keys(root.labels).length ? root.labels : null,
            defaults: root.vars && root.vars.defaults ? short(root.vars.defaults) : null, st: st ? stIndex.get(st) || null : null })
        }
      }
      const ownSt = c.scrollTrigger ? stIndex.get(c.scrollTrigger) || null : null
      const names = tg.slice(0, 40).map((x) => (x && x.nodeType ? sel(x) : typeof x))
      out.tweens.push({ targets: [...new Set(names)].slice(0, 4), count: tg.length, kind: v.startAt ? 'fromTo' : v.runBackwards ? 'from' : v.duration === 0 ? 'set' : 'to', duration: typeof v.duration === 'number' ? v.duration : +c.duration().toFixed(3), total: +c.totalDuration().toFixed(3),
        delay: +c.delay().toFixed(3), ease: easeOf(c, v), stagger: v.stagger !== undefined ? short(v.stagger) : null, repeat: v.repeat || 0, yoyo: !!v.yoyo, repeatDelay: v.repeatDelay || 0,
        from: v.startAt ? short(v.startAt) : null, to, resolved: res, keyframes: v.keyframes ? short(v.keyframes) : null, tl, at: root ? +at.toFixed(3) : null, st: ownSt,
        inside: scope ? tg.some((x) => x && x.nodeType && (scope === x || scope.contains(x))) : undefined, y: Math.round(scrollY) })
    }
    const tree = (a) => { if (!a) return; if (a.targets) tween(a); if (a.getChildren) for (const c of a.getChildren(true, true, false)) tween(c) }
    for (const s of sts) { try { tree(s.animation) } catch (e) {} }
    try { tree(g.globalTimeline) } catch (e) { out.error = String(e) }
    sts.forEach((s, i) => {
      const v = s.vars || {}
      out.scrollTriggers.push({ n: i + 1, id: v.id || null, trigger: sel(s.trigger), start: typeof v.start === 'function' ? 'fn()' : v.start || 'top bottom (padrão)', end: typeof v.end === 'function' ? 'fn()' : v.end || (s.pin ? '+=altura da tela (padrão com pin)' : 'bottom top (padrão)'),
        startPx: Math.round(s.start), endPx: Math.round(s.end), scrub: v.scrub === undefined ? false : v.scrub, pin: s.pin ? sel(s.pin) : false, pinSpacing: v.pinSpacing === undefined ? null : v.pinSpacing, anticipatePin: v.anticipatePin || null,
        snap: v.snap ? short(v.snap) : false, toggleActions: v.scrub || !s.animation ? null : v.toggleActions || 'play none none none (padrão)', toggleClass: v.toggleClass ? short(v.toggleClass) : null,
        once: !!v.once, horizontal: !!v.horizontal, containerAnimation: !!v.containerAnimation, invalidateOnRefresh: !!v.invalidateOnRefresh, markers: !!v.markers,
        callbacks: Object.keys(v).filter((k) => /^on[A-Z]/.test(k) && typeof v[k] === 'function'),
        animation: s.animation ? { tl: TL.map.get(s.animation) || null, duration: +s.animation.duration().toFixed(3), tweens: s.animation.getChildren ? s.animation.getChildren(true, true, false).length : 1 } : null })
    })
    try { out.plugins = Object.keys(g.core.globals()).filter((k) => /Plugin|Trigger|Text|Flip|Draggable|Observer|Smoother|Inertia|CustomEase|MotionPath/.test(k) && !/^(CSSPlugin|AttrPlugin|EndArrayPlugin|ModifiersPlugin|RoundPropsPlugin|SnapPlugin|SteppedEase)$/.test(k)) } catch (e) {}
    return out
  },

  lenis: () => {
    const P = window.__fdProbe, inst = (window.__fdLenis || [])[0], cls = document.documentElement.className
    let live = null
    try { if (inst && inst.options) live = JSON.parse(JSON.stringify(inst.options, (k, v) => (typeof v === 'function' ? 'fn()' : v && (v.nodeType || v === window) ? undefined : v))) } catch (e) {}
    return { used: !!(inst || /\blenis\b/.test(cls) || window.Lenis), version: window.lenisVersion || (window.Lenis && window.Lenis.version) || null, constructorOptions: P ? P.lenis : [], effectiveOptions: live, htmlClass: /lenis/.test(cls) ? cls : null }
  },

  probe: () => {
    const P = window.__fdProbe
    if (!P) return null
    const styles = {}
    for (const k in P.styles) { const o = P.styles[k]; styles[k] = { n: o.n, props: o.props, b: o.b, els: o.els } }
    return JSON.parse(JSON.stringify({ classes: P.classes, styles, waapi: P.waapi, io: P.io, listeners: P.listeners, media: P.media, raf: P.raf, viewTransitions: P.viewTransitions }))
  },

  // foco por teclado: estilo antes e depois de el.focus({ focusVisible: true })
  focusRead: async (id) => {
    const el = document.querySelector(`[data-fdc~="${id}"]`)
    if (!el || typeof el.focus !== 'function') return null
    const PROPS = ['outline-style', 'outline-width', 'outline-color', 'outline-offset', 'box-shadow', 'border-top-color', 'border-bottom-color', 'border-bottom-width', 'background-color', 'color', 'text-decoration-line', 'transform', 'opacity']
    const read = () => { const s = getComputedStyle(el), o = {}; for (const p of PROPS) o[p] = s.getPropertyValue(p); return o }
    // sem transição no elemento: as duas leituras são os estados finais, qualquer que seja a velocidade da máquina
    const prev = el.style.getPropertyValue('transition'), prio = el.style.getPropertyPriority('transition')
    el.style.setProperty('transition', 'none', 'important'); void el.offsetWidth
    const before = read()
    let ok = true
    try { el.focus({ preventScroll: true, focusVisible: true }) } catch (e) { ok = false }
    const focused = ok && document.activeElement === el
    await new Promise((r) => requestAnimationFrame(() => r()))
    const after = read()
    if (focused) el.blur()
    if (prev) el.style.setProperty('transition', prev, prio); else el.style.removeProperty('transition')
    if (!ok) return null
    if (!focused) return { focusable: false }
    const d = {}
    for (const k of PROPS) if (before[k] !== after[k] && !(k === 'outline-color' && after['outline-style'] === 'none') && !(k === 'outline-offset' && after['outline-style'] === 'none')) d[k] = `${before[k]} → ${after[k]}`
    const ring = after['outline-style'] !== 'none' && parseFloat(after['outline-width']) > 0
    return { focusable: true, diff: d, browserDefault: ring && after['outline-style'] === 'auto', outline: ring ? `${after['outline-width']} ${after['outline-style']} ${after['outline-color']} · offset ${after['outline-offset']}` : null }
  },

  hoverRead: (id) => {
    const el = document.querySelector(`[data-fdc~="${id}"]`)
    if (!el) return null
    const PROPS = ['background-color', 'background-image', 'color', 'border-top-color', 'border-bottom-color', 'box-shadow', 'transform', 'opacity', 'text-decoration-line', 'letter-spacing', 'filter', 'scale', 'translate', 'rotate', 'clip-path', 'gap', 'padding-left', 'width', 'height', 'border-top-width', 'border-bottom-width']
    const read = (e, pe) => { const s = getComputedStyle(e, pe), o = {}; for (const p of PROPS) o[p] = s.getPropertyValue(p); return o }
    const out = { self: read(el), children: {} }
    let i = 0
    for (const c of el.querySelectorAll('img, svg, span, i, picture, video, [class]')) { if (i++ >= 12) break; out.children[window.__fdSel(c) + '#' + i] = read(c) }
    for (const pe of ['::before', '::after']) { const s = getComputedStyle(el, pe); if (s.content && s.content !== 'none') out.children[pe] = read(el, pe) }
    return out
  },
}

// ------------------------------------------------------------------ utilidades

const rgbToHex = (c) => {
  let m = /color\(srgb\s+([\d.e-]+)\s+([\d.e-]+)\s+([\d.e-]+)(?:\s*\/\s*([\d.]+%?))?\s*\)/.exec(c || '')
  if (m) m = [0, +m[1] * 255, +m[2] * 255, +m[3] * 255, m[4]]
  else m = /rgba?\(\s*([\d.]+)[ ,]+([\d.]+)[ ,]+([\d.]+)(?:[ ,/]+([\d.]+%?))?\s*\)/.exec(c || '')
  if (!m) return c
  const hex = '#' + [m[1], m[2], m[3]].map((v) => Math.round(+v).toString(16).padStart(2, '0')).join('')
  const a = m[4] === undefined ? 1 : m[4].endsWith('%') ? parseFloat(m[4]) / 100 : +m[4]
  if (a === 0) return 'transparente'
  return a < 1 ? `${hex} @${Math.round(a * 100)}%` : hex
}
const hexify = (v) => String(v).replace(/rgba?\([^)]+\)|color\(srgb[^)]+\)/g, rgbToHex)
const lum = (hex) => { const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4)); return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2] }
const contrast = (a, b) => { try { const [x, y] = [lum(a.slice(0, 7)), lum(b.slice(0, 7))].sort((p, q) => q - p); return +((x + 0.05) / (y + 0.05)).toFixed(2) } catch { return null } }
const num = (v, d = 2) => +(+v).toFixed(d)
const jsonShort = (o, max = 180) => { const s = typeof o === 'string' ? o : JSON.stringify(o); return s.length > max ? s.slice(0, max - 1) + '…' : s }
// diferença entre dois estados, ignorando o que já oscilava sozinho (animação contínua)
const diff = (a, b, unstable) => { const o = {}; for (const k in b) if (a && a[k] !== b[k] && !(unstable && unstable.has(k)) && !(k.endsWith('-color') && k.startsWith('border') && parseFloat(b[k.replace('color', 'width')]) === 0)) o[k] = `${a[k]} → ${b[k]}`; return o }

// espera as animações finitas terminarem (no elemento ou na página) — em máquina lenta os quadros atrasam
const settle = (page, selector, max = 7000) => page.evaluate(async ([sel, max]) => {
  const t0 = performance.now(), root = sel ? document.querySelector(sel) : null
  const busy = () => (root ? root.getAnimations({ subtree: true }) : document.getAnimations()).some((a) => a.playState === 'running' && a.effect && a.effect.getComputedTiming().iterations !== Infinity && a.effect.getComputedTiming().endTime < 20000)
  await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)))
  while (busy() && performance.now() - t0 < max) await new Promise((r) => setTimeout(r, 120))
  await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)))
}, [selector, max]).catch(() => {})
const freeze = (page, on) => page.evaluate((on) => { let st = document.getElementById('__fd_freeze'); if (on && !st) { st = document.createElement('style'); st.id = '__fd_freeze'; st.textContent = '*,*::before,*::after{transition:none!important}'; document.head.appendChild(st) } else if (!on && st) st.remove() }, on).catch(() => {})

async function waitLive(page, isCapture) {
  if (isCapture) for (let i = 0; i < 100; i++) { await sleep(200); if (await page.evaluate(() => !!navigator.serviceWorker.controller && !document.documentElement.hasAttribute('data-fd')).catch(() => false)) break }
  await page.waitForLoadState('load', { timeout: 45000 }).catch(() => {})
}

// ------------------------------------------------------------------ passagem pela página (desktop e mobile)
//
// 1. espera a intro/loader liberar a rolagem   2. rola com a roda do mouse (é o que dispara Lenis, ScrollTrigger, reveals)
// 3. a cada ~0,85 tela lê o que está visível    4. tira telas distribuídas pela página inteira

async function pass(page, cfg) {
  const { VW, VH, prefix, maxScreens, onTick } = cfg
  const state = () => page.evaluate(IN_PAGE.state).catch(() => ({ y: 0, max: 0, locked: true, cls: '', pins: 0 }))
  const shot = async (file, quality = 76) => {
    const p = path.join(outDir, file)
    for (const timeout of [30000, 90000]) { try { await page.screenshot({ path: p, type: 'jpeg', quality, timeout }); return true } catch { /* tenta de novo com mais tempo */ } }
    return fs.existsSync(p)
  }
  const res = { screens: [], stops: [], introMs: 0, introShot: null, virtual: false, stoppedAt: null, pageHeight: 0, steps: 0 }

  // 1. intro
  // "travada" só conta se alguma leitura viu a trava; o tempo é o relógio da própria página (não o desta máquina)
  const tIntro = Date.now()
  let st = await state(), sawLocked = false, lastLockedT = 0
  for (let i = 0; ; i++) {
    if (st.locked) { sawLocked = true; lastLockedT = st.t || 0 }
    const waited = Date.now() - tIntro
    if (!st.locked && (waited > 900 || !onTick)) break
    if (waited > opt.waitIntro * 1000) break
    if (st.locked && !res.introShot && waited > 1400) { const f = `screens/${prefix}_intro.jpg`; if (await shot(f)) res.introShot = f }
    if (onTick) await onTick('carga', 0)
    await sleep(250)
    st = await state()
  }
  res.introMs = st.locked ? null : sawLocked ? Math.round((lastLockedT + (st.t || lastLockedT)) / 2) : 0
  await sleep(700); await settle(page, null, 4000)
  if (onTick) await onTick('carga', 0)
  st = await state()
  res.virtual = st.locked          // nunca destravou: sem rolagem nativa (rolagem virtual, ou página de uma tela só)
  res.pageHeight = st.max + VH

  await page.evaluate(IN_PAGE.indexRules).catch(() => {})
  const collect = async () => { const c = await page.evaluate(IN_PAGE.collect).catch(() => null); if (c) res.stops.push(c); return c }
  const first = `screens/${prefix}_00.jpg`
  if (await shot(first)) res.screens.push({ file: first, y: st.y })
  await collect()

  // 2–4. rolagem
  await page.mouse.move(2, VH - 2)      // no canto: a roda funciona e (quase) nada fica em :hover durante as leituras
  const stepPx = Math.round(VH * 0.45)
  if (res.virtual) {
    // sem posição em pixels: avança por passos de roda e registra o passo
    for (let i = 1; i <= 36; i++) {
      await page.mouse.wheel(0, stepPx).catch(() => {}); await sleep(450)
      if (onTick) await onTick('rolagem', i)
      if (i % 2 === 0) await collect()
      if (i % 4 === 0 && res.screens.length < maxScreens) { await sleep(500); const f = `screens/${prefix}_${String(res.screens.length).padStart(2, '0')}.jpg`; if (await shot(f)) res.screens.push({ file: f, y: null, step: i }) }
      res.steps = i
    }
    res.probe = await page.evaluate(IN_PAGE.probe).catch(() => null)
    return res
  }
  let total = st.max
  const nShots = Math.max(2, Math.min(maxScreens, Math.ceil(total / (VH * 0.9)) + 1))
  let shotEvery = Math.max(VH * 0.5, total / Math.max(1, nShots - 1))
  let nextShot = shotEvery, nextCollect = VH * 0.85, lastY = st.y, stuck = 0
  const maxSteps = Math.min(700, Math.ceil(total / stepPx) * 2 + 60)
  for (let i = 0; i < maxSteps; i++) {
    await page.mouse.wheel(0, stepPx).catch(() => {})
    await sleep(170)
    if (onTick) await onTick('rolagem', lastY)
    await sleep(210)
    st = await state()
    const y = st.y
    if (st.max > total) { total = st.max; res.pageHeight = total + VH }
    if (onTick) await onTick('rolagem', y)
    if (y >= nextCollect) { await collect(); nextCollect = y + VH * 0.85 }
    if (y >= nextShot && y < total - VH * 0.2 && res.screens.length < maxScreens - 1) {
      await sleep(450); await settle(page, null, 1500)
      const f = `screens/${prefix}_${String(res.screens.length).padStart(2, '0')}.jpg`
      if (await shot(f)) res.screens.push({ file: f, y: (await state()).y })
      nextShot = y + shotEvery
    }
    res.steps = i + 1
    if (y >= total - 2) break
    if (y === lastY) {
      stuck++
      if (stuck === 3 || stuck === 6) await page.evaluate(IN_PAGE.goTo, y + stepPx).catch(() => {})      // algo segurou a roda: empurra pela API
      if (stuck >= 9) { res.stoppedAt = y; break }
    } else stuck = 0
    lastY = y
  }
  await sleep(700); await settle(page, null, 2500)
  res.probe = await page.evaluate(IN_PAGE.probe).catch(() => null)      // antes de qualquer volta ao topo: as posições registradas são as da rolagem real
  st = await state()
  await collect()
  const last = `screens/${prefix}_${String(res.screens.length).padStart(2, '0')}_fim.jpg`
  if (await shot(last)) res.screens.push({ file: last, y: st.y })

  // segunda passada, de salto em salto: agora tudo que entra por reveal já entrou, então nada escapa por estar no meio
  // de uma transição quando a primeira leitura passou. Só soma o que ainda não tinha sido contado.
  const scrubMs = await page.evaluate(() => { try { const ST = window.ScrollTrigger; return ST && ST.getAll ? Math.max(0, ...ST.getAll().map((s) => (typeof s.vars.scrub === 'number' ? s.vars.scrub * 1000 : 0))) : 0 } catch (e) { return 0 } }).catch(() => 0)
  const before = res.stops.reduce((n, c) => n + c.texts.length, 0)
  for (let y = 0; y <= total; y += Math.round(VH * 0.7)) {
    await page.evaluate(IN_PAGE.goTo, y).catch(() => {})
    await sleep(220 + Math.min(1800, scrubMs ? scrubMs + 250 : 0)); await settle(page, null, 1200)
    await collect()
  }
  res.secondPass = res.stops.reduce((n, c) => n + c.texts.length, 0) - before
  return res
}

// ------------------------------------------------------------------ alvo: captura local ou URL

let server = null, url = target, captureDir = null, index = null, tech = null
if (!/^https?:\/\//i.test(target)) {
  captureDir = path.resolve(target)
  const idxFile = path.join(captureDir, 'site', '_fd', 'site-index.json')
  if (!fs.existsSync(idxFile)) { console.error(`"${target}" não é uma captura (falta site/_fd/site-index.json). Rode antes: node ${path.join(HERE, 'capture_site.mjs')} URL`); process.exit(1) }
  index = JSON.parse(fs.readFileSync(idxFile, 'utf8'))
  try { tech = JSON.parse(fs.readFileSync(path.join(captureDir, 'site', '_fd', 'tech.json'), 'utf8')) } catch { /* sem tech.json */ }
  const py = ['python3', 'python', 'py'].find((c) => { try { execSync(`${c} --version`, { stdio: 'ignore' }); return true } catch { return false } })
  if (!py) { console.error('Preciso do Python para servir a captura.'); process.exit(1) }
  server = spawn(py, ['serve.py', ...(opt.online ? [] : ['--offline'])], { cwd: captureDir, stdio: ['ignore', 'pipe', 'pipe'] })
  let out = ''; server.stdout.on('data', (d) => { out += d })
  for (let i = 0; i < 60 && !/Abra: (\S+)/.test(out); i++) await sleep(100)
  url = (/Abra: (\S+)/.exec(out) || [])[1]
  if (!url) { server.kill(); console.error('O servidor da captura não iniciou.'); process.exit(1) }
}
const outDir = path.resolve(opt.out || (captureDir ? path.join(captureDir, 'design') : path.join('design-raw', new URL(url).hostname.replace(/^www\./, ''))))
// medição nova substitui a anterior: apaga só o que este script gera
for (const d of ['screens', 'components', 'brand']) { const p = path.join(outDir, d); try { for (const f of fs.readdirSync(p)) if (/\.(jpe?g|png|svg|webp|ico|gif)$/i.test(f)) fs.unlinkSync(path.join(p, f)) } catch { /* pasta ainda não existe */ } fs.mkdirSync(p, { recursive: true }) }
const cleanup = () => { try { server && server.kill() } catch { /* já encerrado */ } }
process.on('exit', cleanup)

const pw = await loadPlaywright()
const browser = await launch(pw)
log(`Medindo ${index ? index.entry.url + ' (cópia local)' : url}`)

// ------------------------------------------------------------------ desktop

const VW = 1440, VH = 900
const ctx = await browser.newContext({ viewport: { width: VW, height: VH } })
await ctx.addInitScript(PROBE)
const page = await ctx.newPage()
const jsErrors = []
page.on('pageerror', (e) => jsErrors.push(String(e.message).split('\n')[0]))
await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45000 })
await waitLive(page, !!captureDir)

// animações CSS/WAAPI: guarda cada combinação distinta e em quantos elementos apareceu ao mesmo tempo
const seenAnims = new Map()
const noteAnims = (list, phase, y) => {
  const now = new Map()
  for (const a of list || []) { const k = [a.type, a.name, a.target, Math.round(a.duration), a.easing, Math.round(a.delay || 0)].join('|'); const o = now.get(k); if (o) o.n++; else now.set(k, { a, n: 1 }) }
  for (const [k, { a, n }] of now) { const o = seenAnims.get(k); if (o) { o.elements = Math.max(o.elements, n); o.lastY = y } else seenAnims.set(k, { ...a, phase, firstY: y, lastY: y, elements: n }) }
}
// GSAP: junta as amostras (tweens soltos somem da linha do tempo quando terminam, por isso várias leituras)
const G = { version: null, plugins: [], defaults: null, tweens: new Map(), timelines: new Map(), scrollTriggers: [] }
const tweenKey = (t) => JSON.stringify([t.targets, t.to, t.from, t.duration, t.ease, t.tl, t.at, t.st])
const snapGsap = async (phase, withinId) => {
  const g = await page.evaluate(IN_PAGE.gsap, withinId || null).catch(() => null)
  if (!g) return []
  G.version = g.version; G.defaults = g.defaults
  if (g.plugins.length) G.plugins = g.plugins
  if (g.scrollTriggers.length >= G.scrollTriggers.length) G.scrollTriggers = g.scrollTriggers
  for (const tl of g.timelines) G.timelines.set(tl.id, tl)
  const fresh = []
  for (const t of g.tweens) {
    const k = tweenKey(t), old = G.tweens.get(k)
    if (old) { if (!old.resolved && t.resolved) old.resolved = t.resolved }
    else { t.phase = phase; G.tweens.set(k, t); fresh.push(t) }
  }
  return fresh
}
let tick = 0
const onTick = async (phase, y) => {
  noteAnims(await page.evaluate(IN_PAGE.animations).catch(() => []), phase, y)
  if (phase === 'carga' || tick++ % 4 === 0) await snapGsap(phase)
}

const D = await pass(page, { VW, VH, prefix: 'desktop', maxScreens: opt.maxScreens, onTick })
// fim da intro com o relógio da página: o instante em que a classe de trava saiu do <html>/<body>
if (D.introMs && D.probe) {
  const unlock = Object.entries(D.probe.classes).filter(([k, v]) => /^(html|body) /.test(k) && v.remove > 0 && v.y1 === 0 && /lock|load|intro|init|prevent|no-?scroll|stop/i.test(k.split(' ')[1]) && v.t > 0 && Math.abs(v.t - D.introMs) < 4000).map(([, v]) => v.t)
  if (unlock.length) { D.introMs = Math.max(...unlock); D.introExact = true }
}
await snapGsap('rolagem')
const lenis = await page.evaluate(IN_PAGE.lenis).catch(() => null)
log(`  intro: ${D.introMs === null ? 'a rolagem não destravou' : D.introMs > 1200 ? (D.introMs / 1000).toFixed(1) + 's até liberar a rolagem' : 'sem trava'} · página: ${D.pageHeight}px · ${D.screens.length} telas · ${D.stops.length} leituras · ${seenAnims.size} animações CSS distintas (${secs()})`)

// de volta ao topo: leitura única da página, cores/raios/sombras em uso, resumo do CSS
const goTo = async (y, wait = 500) => { await page.evaluate(IN_PAGE.goTo, y).catch(() => {}); await sleep(wait) }
const scrubWait = Math.min(2200, Math.max(0, ...G.scrollTriggers.map((s) => (typeof s.scrub === 'number' ? s.scrub * 1000 + 300 : 0))))
await goTo(0, 600 + scrubWait); await settle(page, null)
const stat = await page.evaluate(IN_PAGE.page)
const tokens = await page.evaluate(fs.readFileSync(path.join(HERE, 'site_tokens.js'), 'utf8')).catch(() => null)
const probe0 = D.probe
const toggledClasses = [...new Set(Object.keys((probe0 && probe0.classes) || {}).map((k) => k.slice(k.lastIndexOf(' ') + 1)))].slice(0, 80)
const css = await page.evaluate(IN_PAGE.css, toggledClasses).catch((e) => ({ error: String(e.message) }))
log(`  ${stat.sections.length} blocos, ${css.counts ? css.counts.rules : '?'} regras de CSS, ${css.fontFaceCount || 0} @font-face (${secs()})`)

// navegação depois de rolar
let navScrolled = null
if (stat.nav && !D.virtual) {
  await goTo(400, 700 + scrubWait); await settle(page, '[data-fdc~="nav"]')
  navScrolled = await page.evaluate((props) => { const el = document.querySelector('[data-fdc~="nav"]'); if (!el) return null; const s = getComputedStyle(el), o = {}; for (const p of props) o[p] = s.getPropertyValue(p); const r = el.getBoundingClientRect(); return { style: o, visible: r.bottom > 0 && r.top < innerHeight && +s.opacity > 0.05 && s.visibility !== 'hidden', top: Math.round(r.top), className: String(el.className) } }, Object.keys(stat.nav.style)).catch(() => null)
  const h = Math.min(VH, Math.max(60, stat.nav.rect.h + 24))
  await page.screenshot({ path: path.join(outDir, 'components', 'nav_rolado.png'), clip: { x: 0, y: 0, width: VW, height: h } }).catch(() => {})
  await goTo(0, 700 + scrubWait); await settle(page, '[data-fdc~="nav"]')
}
if (stat.nav) await page.screenshot({ path: path.join(outDir, 'components', 'nav_topo.png'), clip: { x: 0, y: 0, width: VW, height: Math.min(VH, Math.max(60, stat.nav.rect.h + 24)) } }).catch(() => {})

// laço de animação contínuo? (requestAnimationFrame em repouso, no topo)
const raf0 = await page.evaluate(() => window.__fdProbe && window.__fdProbe.raf).catch(() => 0)
await sleep(1000)
const rafIdle = ((await page.evaluate(() => window.__fdProbe && window.__fdProbe.raf).catch(() => 0)) || 0) - (raf0 || 0)

// ------------------------------------------------------------------ consolida textos e componentes de todas as paradas

function mergeStops(stops) {
  const texts = [], seenSel = new Set(), comps = { btn: new Map(), link: new Map(), input: new Map(), card: new Map() }
  const copy = { h1: [], h2: [], h3: [], labels: [], cta: [], paragraphs: [] }
  for (const s of stops) {
    for (const t of s.texts) texts.push({ ...t, y: s.y })
    for (const kind in comps) for (const c of s.comps[kind]) {
      if (kind === 'card') c.key = [c.selector, c.style['background-color'], c.style['border-radius'], c.style['border-top-width']].join('|')
      const o = comps[kind].get(c.key); if (o) { o.count += c.count; for (const x of c.samples) if (o.samples.length < 5 && !o.samples.includes(x)) o.samples.push(x) } else comps[kind].set(c.key, { ...c, y: s.y }) }
    for (const k in copy) for (const t of s.copy[k]) if (t && !copy[k].includes(t)) copy[k].push(t)
  }
  const out = {}
  for (const kind in comps) out[kind] = [...comps[kind].values()].sort((a, b) => b.count - a.count)
  // escala tipográfica: cada combinação distinta de família/tamanho/peso/entrelinha/tracking/caixa
  const scale = new Map()
  for (const t of texts) {
    const k = [t.family, t.size, t.weight, t.lineHeight, t.tracking, t.transform, t.style].join('|')
    const o = scale.get(k) || { family: t.family, size: t.size, weight: t.weight, lineHeight: t.lineHeight, tracking: t.tracking, transform: t.transform, style: t.style, chars: 0, elements: 0, selectors: [], sample: t.sample, colors: {}, authored: t.authored, y: t.y, stroke: t.stroke, clipText: t.clipText }
    o.chars += t.chars; o.elements++
    if (o.selectors.length < 4 && !o.selectors.includes(t.selector)) o.selectors.push(t.selector)
    o.colors[t.color] = (o.colors[t.color] || 0) + t.chars
    scale.set(k, o)
  }
  const bySel = new Map()
  for (const t of texts) if (!bySel.has(t.selector)) bySel.set(t.selector, t)
  return { texts, bySel, scale: [...scale.values()].sort((a, b) => b.size - a.size || b.chars - a.chars), comps: out, copy }
}
const M = mergeStops(D.stops)
const components = { buttons: M.comps.btn.slice(0, 10), links: M.comps.link.slice(0, 8), inputs: M.comps.input.slice(0, 4), cards: M.comps.card.slice(0, 10), nav: stat.nav }
log(`  ${M.scale.length} estilos de texto · componentes: ${components.buttons.length} botões, ${components.links.length} links, ${components.inputs.length} campos, ${components.cards.length} cards (${secs()})`)

// ------------------------------------------------------------------ componentes: recorte + hover medido

const hoverTargets = [...components.buttons, ...components.links.slice(0, 5), ...components.cards, ...components.inputs]
if (stat.brand.logo) hoverTargets.unshift({ id: 'logo', isLogo: true, y: 0 })
const boxAt = (id) => page.evaluate((id) => { const el = document.querySelector(`[data-fdc~="${id}"]`); if (!el) return null; const r = el.getBoundingClientRect(); return { x: r.left, y: r.top, width: r.width, height: r.height, inView: window.__fdInView(el, 8) } }, id)
const clipOf = (b, pad = 14) => { const x = Math.max(0, b.x - pad), y = Math.max(0, b.y - pad); return { x, y, width: Math.max(8, Math.min(VW - x, b.x + b.width + pad - x)), height: Math.max(8, Math.min(VH - y, b.y + b.height + pad - y)) } }
const hasJsHover = Object.keys((probe0 && probe0.listeners) || {}).some((k) => /^(mouseenter|mouseover|pointerenter|mousemove)/.test(k))
let curY = 0
const cursorSeen = new Set()
for (const c of hoverTargets) {
  try {
    await page.mouse.move(2, 2)
    // volta à posição de rolagem em que o componente foi visto (em página com pin, scrollIntoView não serve)
    if (!D.virtual && c.y !== curY) { await goTo(c.y, 450 + scrubWait); curY = c.y }
    let box = await boxAt(c.id)
    if (box && !box.inView && !D.virtual) { await page.evaluate((id) => { const el = document.querySelector(`[data-fdc~="${id}"]`); if (el) el.scrollIntoView({ block: 'center', behavior: 'instant' }) }, c.id); await sleep(500 + scrubWait); curY = -1; box = await boxAt(c.id) }
    if (!box || box.width < 2 || !box.inView) { c.hover = undefined; c.hoverError = 'não ficou visível ao voltar à posição em que foi visto'; continue }
    await sleep(250); await settle(page, `[data-fdc~="${c.id}"]`, 4000)
    box = await boxAt(c.id)
    const file = c.isLogo ? 'brand/logo.png' : `components/${c.id}.png`
    await page.screenshot({ path: path.join(outDir, file), clip: clipOf(box, c.isLogo ? 8 : 14), timeout: 30000 })
    if (c.isLogo) continue
    c.file = file
    // duas leituras em repouso: o que muda sozinho entre elas é animação contínua, não hover
    const b1 = await page.evaluate(IN_PAGE.hoverRead, c.id)
    await sleep(260)
    const before = await page.evaluate(IN_PAGE.hoverRead, c.id)
    const unstable = { self: new Set(Object.keys(diff(b1.self, before.self))), children: {} }
    for (const k in before.children) unstable.children[k] = new Set(Object.keys(diff(b1.children[k], before.children[k])))
    // ponto dentro da parte visível do elemento; se algo o cobre (cabeçalho fixo), tenta outros pontos
    const top = Math.max(box.y, 0), bottom = Math.min(box.y + box.height, VH), left = Math.max(box.x, 0), right = Math.min(box.x + box.width, VW)
    const points = [[(left + right) / 2, (top + bottom) / 2], [left + Math.min(60, (right - left) / 2), (top + bottom) / 2], [(left + right) / 2, bottom - Math.min(40, (bottom - top) / 3)], [right - Math.min(60, (right - left) / 2), top + (bottom - top) * 0.7]]
    let over = false
    for (const [px, py] of points) {
      await page.mouse.move(px, py, { steps: 4 }); await sleep(140)
      over = await page.evaluate((id) => { const el = document.querySelector(`[data-fdc~="${id}"]`); return !!el && el.matches(':hover') }, c.id)
      if (over) break
    }
    if (!over) { c.hover = undefined; c.hoverError = 'o ponteiro não alcançou o elemento (coberto por outro)'; continue }
    const isMine = (t) => { if (t.inside) return true; if (!t.targets.some((s) => /cursor/i.test(s))) return false; const k = JSON.stringify([t.targets, Object.keys(t.to), t.duration, t.ease]); if (cursorSeen.has(k)) return false; cursorSeen.add(k); return true }
    await sleep(220)
    const fresh = hasJsHover ? (await snapGsap('hover', c.id)).filter(isMine) : []      // cedo: tween curto some da linha do tempo ao terminar
    await sleep(hasJsHover ? 700 : 60); await settle(page, `[data-fdc~="${c.id}"]`, 5000)
    const after = await page.evaluate(IN_PAGE.hoverRead, c.id)
    const d = { self: diff(before.self, after.self, unstable.self), children: {} }
    for (const k in after.children) { const x = diff(before.children[k], after.children[k], unstable.children[k]); if (Object.keys(x).length) d.children[k.replace(/#\d+$/, '')] = x }
    // tweens do GSAP criados pelo hover (dentro do componente, ou no cursor personalizado)
    fresh.push(...(await snapGsap('hover', c.id)).filter(isMine))
    if (fresh.length) c.hoverTweens = fresh.map((t) => ({ targets: t.targets, duration: t.duration, ease: t.ease, to: t.to, from: t.from }))
    if (Object.keys(d.self).length || Object.keys(d.children).length || fresh.length) { c.hover = d; c.hoverFile = `components/${c.id}_hover.png`; await page.screenshot({ path: path.join(outDir, c.hoverFile), clip: clipOf(box), timeout: 30000 }).catch(() => {}) } else c.hover = null
    // foco por teclado (botões, links e campos)
    if (/^(btn|link|input)-/.test(c.id)) {
      await page.mouse.move(2, 2); await sleep(hasJsHover ? 800 : 300)
      c.focus = await page.evaluate(IN_PAGE.focusRead, c.id).catch(() => null)
    }
  } catch (e) { c.hover = undefined; c.hoverError = String(e.message).split('\n')[0].slice(0, 140) }
}
await page.mouse.move(2, 2)
await goTo(0, 500 + scrubWait)
const probe = probe0
log(`  hover medido em ${hoverTargets.filter((c) => !c.isLogo && c.hover !== undefined).length} de ${hoverTargets.filter((c) => !c.isLogo).length} componentes (${secs()})`)

// ------------------------------------------------------------------ tema alternativo (claro ↔ escuro)

let altTheme = null
{
  const blocks = (css.vars || []).filter((b) => /dark|light|theme/i.test(b.selector) || /prefers-color-scheme/.test(b.media))
  const attr = blocks.map((b) => /\[(data-[\w-]+)=["']?([\w-]+)["']?\]/.exec(b.selector)).find(Boolean)
  const cls = blocks.map((b) => /\.(dark|light|theme-dark|theme-light|dark-mode|light-mode)\b/.exec(b.selector)).find(Boolean)
  const mq = blocks.map((b) => /prefers-color-scheme:\s*(dark|light)/.exec(b.media)).find(Boolean)
  await freeze(page, true); await sleep(150)
  const before = await page.evaluate(() => ({ bg: getComputedStyle(document.body).backgroundColor, color: getComputedStyle(document.body).color }))
  let how = null
  if (attr) { how = `atributo ${attr[1]}="${attr[2]}" no <html>`; await page.evaluate(([a, v]) => { document.documentElement.dataset.fdPrev = document.documentElement.getAttribute(a) || ''; document.documentElement.setAttribute(a, v) }, [attr[1], attr[2]]) }
  else if (cls) { how = `classe .${cls[1]} no <html>`; await page.evaluate((c) => document.documentElement.classList.add(c), cls[1]) }
  else if (mq) { how = `media query prefers-color-scheme: ${mq[1]}`; await page.emulateMedia({ colorScheme: mq[1] }) }
  if (how) {
    await sleep(600)
    const after = await page.evaluate((names) => { const cs = getComputedStyle(document.documentElement), vars = {}; for (const n of names) vars[n] = cs.getPropertyValue(n).trim(); return { bg: getComputedStyle(document.body).backgroundColor, color: getComputedStyle(document.body).color, vars } }, Object.keys(css.rootResolved || {}))
    const nChanged = Object.keys(after.vars).filter((k) => after.vars[k] !== css.rootResolved[k]).length
    if (after.bg !== before.bg || after.color !== before.color || nChanged) {
      await sleep(500)
      await page.screenshot({ path: path.join(outDir, 'screens', 'tema_alternativo.jpg'), type: 'jpeg', quality: 76 }).catch(() => {})
      const changed = {}
      for (const k in after.vars) if (after.vars[k] !== css.rootResolved[k]) changed[k] = after.vars[k]
      altTheme = { mechanism: how, name: (attr && attr[2]) || (cls && cls[1]) || (mq && mq[1]), background: after.bg, color: after.color, vars: changed, file: 'screens/tema_alternativo.jpg' }
    }
    if (attr) await page.evaluate((a) => { const p = document.documentElement.dataset.fdPrev; if (p) document.documentElement.setAttribute(a, p); else document.documentElement.removeAttribute(a); delete document.documentElement.dataset.fdPrev }, attr[1])
    else if (cls) await page.evaluate((c) => document.documentElement.classList.remove(c), cls[1])
    else await page.emulateMedia({ colorScheme: null })
    await sleep(400)
  }
  await freeze(page, false)
}

// página inteira: só faz sentido sem trechos presos (com pin, a foto corrida não corresponde ao que se vê rolando)
let fullPage = null
if (!D.virtual && !stat.layout.pinSpacers && D.pageHeight <= 22000) {
  try { await page.screenshot({ path: path.join(outDir, 'screens', 'desktop_pagina_inteira.jpg'), type: 'jpeg', quality: 60, fullPage: true, timeout: 60000 }); fullPage = 'screens/desktop_pagina_inteira.jpg' } catch { /* páginas com WebGL às vezes não deixam */ }
}
await ctx.close()

// ------------------------------------------------------------------ mobile

let mobile = null
if (opt.mobile) {
  const MW = 390, MH = 844
  const mctx = await browser.newContext({ viewport: { width: MW, height: MH }, deviceScaleFactor: 2, isMobile: true, hasTouch: true,
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1' })
  await mctx.addInitScript(PROBE)
  const mp = await mctx.newPage()
  try {
    await mp.goto(url, { waitUntil: 'domcontentloaded', timeout: 45000 })
    await waitLive(mp, !!captureDir)
    const R = await pass(mp, { VW: MW, VH: MH, prefix: 'mobile', maxScreens: Math.min(8, opt.maxScreens) })
    await mp.evaluate(IN_PAGE.goTo, 0).catch(() => {}); await sleep(900)
    const ms = await mp.evaluate(IN_PAGE.page)
    const mm = mergeStops(R.stops)
    mobile = { viewport: [MW, MH], pageHeight: R.pageHeight, introMs: R.introMs, virtual: R.virtual, stoppedAt: R.stoppedAt, bySel: mm.bySel, scale: mm.scale, nav: ms.nav, sections: ms.sections.length, grids: ms.layout.grids,
      buttons: mm.comps.btn.slice(0, 6).map((b) => ({ selector: b.selector, samples: b.samples, style: b.style })), screens: R.screens, body: ms.body }
  } catch (e) { mobile = { error: String(e.message).split('\n')[0] } }
  await mctx.close()
  log(`  mobile: ${mobile.error ? 'falhou: ' + mobile.error : `${mobile.pageHeight}px · ${mobile.screens.length} telas · ${mobile.scale.length} estilos de texto`} (${secs()})`)
}
await browser.close()
cleanup()

// ------------------------------------------------------------------ consolidação

const px = (v) => parseFloat(v)
const ratio = (v, size) => (/px$/.test(v) && size ? `${v} (${num(px(v) / size, 3)})` : v)
const em = (v, size) => (/px$/.test(v) && size && px(v) !== 0 ? `${v} (${num(px(v) / size, 3)}em)` : v)
// escala tipográfica com o par mobile (mesmo seletor) e o valor escrito pelo autor
const typeScale = M.scale.slice(0, 60).map((s) => {
  let mob = null
  if (mobile && mobile.bySel) for (const q of s.selectors) { const m = mobile.bySel.get(q); if (m) { mob = m; break } }
  const color = Object.entries(s.colors).sort((a, b) => b[1] - a[1])[0][0]
  const o = { selectors: s.selectors, sample: s.sample, family: s.family, style: s.style, size: s.size, mobileSize: mob ? mob.size : null, weight: s.weight, lineHeight: ratio(s.lineHeight, s.size), tracking: em(s.tracking, s.size), transform: s.transform, color, stroke: s.stroke || null, clipText: !!s.clipText, chars: s.chars, elements: s.elements, y: s.y,
    authored: s.authored || {}, authoredMobile: mob ? mob.authored || {} : null }
  // interpolação entre os dois tamanhos medidos: só é sugestão quando o autor escreveu valores fixos
  const fixed = (v) => !v || /^[\d.]+(px|rem|em)\b/.test(v)
  if (mob && mob.size !== s.size && fixed(o.authored['font-size']) && fixed(o.authoredMobile['font-size'])) {
    const slope = (s.size - mob.size) / (VW - 390), icpt = mob.size - slope * 390, rem = (p) => num(p / 16, 4) + 'rem'
    o.suggestedClamp = `clamp(${rem(Math.min(s.size, mob.size))}, calc(${rem(icpt)} + ${num(slope * 100, 3)}vw), ${rem(Math.max(s.size, mob.size))})`
  }
  return o
})
const usedWeights = {}
for (const s of M.scale) { const w = usedWeights[s.family] || (usedWeights[s.family] = {}); w[s.weight] = (w[s.weight] || 0) + s.chars }

// breakpoints
const bps = new Map()
for (const [cond, n] of Object.entries(css.media || {})) for (const m of cond.matchAll(/(min|max)-width:\s*([\d.]+)(px|em|rem)/g)) { const p = m[3] === 'px' ? +m[2] : +m[2] * 16; const k = `${m[1]}-width ${p}px`; bps.set(k, (bps.get(k) || 0) + n) }
const breakpoints = [...bps.entries()].map(([k, rules]) => ({ query: k, px: +k.split(' ')[1].replace('px', ''), rules })).sort((a, b) => a.px - b.px)

// GSAP: timelines ordenadas, tweens com a faixa de rolagem quando a timeline é guiada por ScrollTrigger com scrub
let gsapInfo = null
if (G.version) {
  const sts = G.scrollTriggers.slice().sort((a, b) => a.startPx - b.startPx)
  const stByN = new Map(G.scrollTriggers.map((s) => [s.n, s]))
  const tweens = [...G.tweens.values()]
  for (const t of tweens) {
    const tl = t.tl ? G.timelines.get(t.tl) : null
    const st = stByN.get((tl && tl.st) || t.st || -1)
    t.stN = st ? st.n : null
    if (st && tl && tl.duration > 0 && st.scrub !== false) { const span = st.endPx - st.startPx; t.scrollPx = [Math.round(st.startPx + (t.at / tl.duration) * span), Math.round(st.startPx + (Math.min(tl.duration, t.at + t.total) / tl.duration) * span)] }
    else if (st && !tl && st.scrub !== false) t.scrollPx = [st.startPx, st.endPx]
    t.origin = st ? (st.scrub !== false ? 'rolagem (scrub)' : 'rolagem (dispara)') : t.phase === 'hover' ? 'hover' : t.phase === 'carga' ? 'carga' : 'durante a rolagem (evento/tempo)'
  }
  const timelines = [...G.timelines.values()].map((tl) => ({ ...tl, tweens: tweens.filter((t) => t.tl === tl.id).sort((a, b) => a.at - b.at) })).filter((tl) => tl.tweens.length)
    .sort((a, b) => { const sa = stByN.get(a.st), sb = stByN.get(b.st); return (sa ? sa.startPx : -1) - (sb ? sb.startPx : -1) || a.id - b.id })
  // soltos que só diferem nos números (seguidor de cursor, parallax de mouse) viram uma linha com a contagem
  const looseMap = new Map()
  for (const t of tweens.filter((x) => !x.tl)) {
    const k = JSON.stringify([t.targets, t.kind, Object.keys(t.to), t.duration, t.ease, t.stN])
    const o = looseMap.get(k)
    if (o) o.variants = (o.variants || 1) + 1; else looseMap.set(k, t)
  }
  const loose = [...looseMap.values()]
  const pinned = sts.filter((s) => s.pin).reduce((n, s) => n + (s.endPx - s.startPx), 0)
  gsapInfo = { version: G.version, plugins: G.plugins, defaults: G.defaults, scrollTriggers: sts, timelines, loose, tweenCount: tweens.length, pinnedPx: pinned }
}
const stAt = (y) => (gsapInfo && y !== null ? gsapInfo.scrollTriggers.filter((s) => s.endPx > s.startPx && y >= s.startPx && y <= s.endPx).map((s) => `ST#${s.n} ${Math.round(((y - s.startPx) / (s.endPx - s.startPx)) * 100)}%`).join(', ') : '')

// classes trocadas (reveals, estados) × regras de CSS envolvidas
const classToggles = Object.entries((probe && probe.classes) || {}).map(([k, v]) => { const i = k.lastIndexOf(' '); return { element: k.slice(0, i), cls: k.slice(i + 1), add: v.add, remove: v.remove, fromY: Math.min(v.y0, v.y1), toY: Math.max(v.y0, v.y1) } }).sort((a, b) => b.add + b.remove - (a.add + a.remove))
for (const c of classToggles.slice(0, 50)) {
  const own = c.element.split(' > ').pop().split('.').slice(1).filter(Boolean)
  const mine = (r) => (own.some((x) => r.includes('.' + x)) || /^[^{]*\.(reveal|animate|fade|show|visible)/.test(r) ? 0 : 1)
  c.rules = ((css.classRules || {})[c.cls] || []).slice().sort((x, y) => mine(x) - mine(y)).slice(0, 3)
  c.baseTransitions = (css.transitions || []).filter((t) => !t.media && own.some((x) => new RegExp('\\.' + x.replace(/[^\w-]/g, '\\$&') + '(?![\\w-])').test(t.selector)) && !t.selector.includes(':')).slice(0, 2).map((t) => `${t.selector} { transition: ${t.value.replace(/\s+/g, ' ')} }`)
}
// elementos com style inline reescrito (animação por JS); os componentes de transform do GSAP viram só "transform"
const gsapTargets = new Set(gsapInfo ? [...G.tweens.values()].flatMap((t) => t.targets) : [])
const jsAnimated = Object.entries((probe && probe.styles) || {}).map(([element, v]) => {
  let props = Object.keys(v.props)
  if (props.includes('transform')) props = props.filter((p) => !['translate', 'rotate', 'scale'].includes(p))
  // faixa de rolagem em que as escritas aconteceram (blocos de 300px com pelo menos 1% das escritas)
  const thr = Math.max(2, v.n * 0.01), bks = Object.entries(v.b || {}).filter(([, n]) => n >= thr).map(([k]) => +k).sort((a, b) => a - b)
  const pageBks = Math.max(1, Math.ceil((D.pageHeight - VH) / 300))
  const fromY = bks.length ? bks[0] * 300 : 0, toY = bks.length ? Math.min(D.pageHeight - VH, (bks[bks.length - 1] + 1) * 300) : 0
  return { element, elements: v.els, writes: v.n, props, fromY, toY, everywhere: bks.length >= pageBks * 0.85 && pageBks > 3, by: gsapTargets.has(element) ? 'GSAP' : 'outro JS' }
}).sort((a, b) => b.writes - a.writes)
const listeners = {}
for (const [k, n] of Object.entries((probe && probe.listeners) || {})) { const [type, who] = k.split(' @ '); const o = listeners[type] || (listeners[type] = { count: 0, targets: [] }); o.count += n; if (o.targets.length < 8 && !o.targets.includes(who)) o.targets.push(who) }
const animations = (() => {
  const SHORT = [[/^border-(top|right|bottom|left)-color$/, 'border-color'], [/^border-(top|right|bottom|left)-width$/, 'border-width'], [/^padding-(top|right|bottom|left)$/, 'padding'], [/^margin-(top|right|bottom|left)$/, 'margin'], [/^border-(top|bottom)-(left|right)-radius$/, 'border-radius']]
  const short = (n) => { for (const [re, to] of SHORT) if (re.test(n)) return to; return n }
  // 1) transição: a mesma propriedade no mesmo alvo aparece várias vezes (ida, volta encurtada) → fica a mais longa
  const tr = new Map(), rest = []
  for (const a of seenAnims.values()) {
    if (a.type !== 'transição') { rest.push(a); continue }
    const k = a.target + '|' + short(a.name), o = tr.get(k)
    if (!o || a.duration > o.duration) tr.set(k, { ...a, name: short(a.name), firstY: o ? Math.min(o.firstY, a.firstY) : a.firstY, phase: o ? o.phase : a.phase, elements: Math.max(a.elements, o ? o.elements : 0) })
  }
  // 2) transições do mesmo alvo com a mesma duração e curva viram uma linha com a lista de propriedades
  const out = new Map()
  for (const a of tr.values()) {
    const k = ['t', a.target, Math.round(a.duration), a.easing, Math.round(a.delay || 0), a.phase].join('|'), o = out.get(k)
    if (o) { if (!o.names.includes(a.name)) o.names.push(a.name); o.firstY = Math.min(o.firstY, a.firstY) } else out.set(k, { ...a, names: [a.name], delays: [Math.round(a.delay || 0)] })
  }
  // 3) keyframes/WAAPI: o mesmo nome no mesmo alvo com atrasos diferentes (escada) vira uma linha com os atrasos
  for (const a of rest) {
    const k = [a.type, a.name, a.target, Math.round(a.duration), a.easing, a.iterations].join('|'), o = out.get(k), d = Math.round(a.delay || 0)
    if (o) { if (!o.delays.includes(d)) { o.delays.push(d); o.elements += a.elements } o.firstY = Math.min(o.firstY, a.firstY) } else out.set(k, { ...a, names: [a.name], delays: [d] })
  }
  return [...out.values()].map((a) => ({ ...a, name: a.names.join(', '), delays: a.delays.sort((x, y) => x - y) })).sort((a, b) => (a.phase === b.phase ? a.firstY - b.firstY : a.phase === 'carga' ? -1 : 1))
})()

// arquivos de marca e lista de leitura (só com captura)
const copied = {}, reading = []
if (captureDir && index) {
  const byUrl = new Map(index.entries.filter((e) => e.file).map((e) => [e.url.split('#')[0], e]))
  const toOriginal = (u) => { try { const x = new URL(u, index.entry.url); return x.hostname.endsWith('localhost') || x.hostname === '127.0.0.1' ? new URL(x.pathname + x.search, index.entry.url).href : x.href } catch { return null } }
  const copy = (u, name) => { const e = byUrl.get(toOriginal(u)); if (!e) return null; const ext = path.extname(e.file) || '.bin'; const dest = `brand/${name}${ext}`; try { fs.copyFileSync(path.join(captureDir, ...e.file.split('/')), path.join(outDir, dest)); return dest } catch { return null } }
  if (stat.brand.logo && stat.brand.logo.src) copied.logo = copy(stat.brand.logo.src, 'logo-original')
  if (stat.brand.ogImage) copied.ogImage = copy(stat.brand.ogImage, 'og-image')
  const icon = stat.brand.icons.find((i) => /svg/.test(i.type || i.href)) || stat.brand.icons[0]
  if (icon) copied.favicon = copy(icon.href, 'favicon')
  const entryHost = new URL(index.entry.url).hostname.replace(/^www\./, '')
  for (const e of index.entries) {
    if (!e.file || !new URL(e.url).hostname.endsWith(entryHost)) continue
    const p = e.url.split('?')[0]
    const kind = /\.m?js$/i.test(p) || /\.m?js$/i.test(e.file) ? 'js' : /\.css$/i.test(p) || /\.css$/i.test(e.file) ? 'css' : /html/.test(e.contentType || '') && (/\.html?$/i.test(e.file) || p.endsWith('/')) && !/\.(ico|png|jpe?g|webp|svg|json|xml|txt|map)$/i.test(p) ? 'html' : null
    if (!kind || /\/cdn-cgi\//.test(p)) continue
    const vendor = /vendor|node_modules|\/three|gsap|jquery|lottie|swiper|lenis|chunk-vendors|polyfill|\.min\./i.test(e.url)
    reading.push({ file: path.relative(outDir, path.join(captureDir, ...e.file.split('/'))).split(path.sep).join('/'), kind, size: e.size, vendor })
  }
  reading.sort((a, b) => a.vendor - b.vendor || a.kind.localeCompare(b.kind) || a.size - b.size)
}
if (stat.brand.logo && stat.brand.logo.svg) { fs.writeFileSync(path.join(outDir, 'brand', 'logo.svg'), stat.brand.logo.svg.replace(/ data-fdc="[^"]*"/g, '')); copied.logoSvg = 'brand/logo.svg' }

const copyAll = { ...M.copy, nav: (stat.nav && stat.nav.linkTexts) || [], footer: stat.footerText }
const raw = {
  tool: `flowdesign-site-design ${VERSION}`, measuredAt: new Date().toISOString(), source: index ? index.entry.url : url, capture: captureDir ? path.relative(outDir, captureDir).split(path.sep).join('/') || '.' : null,
  scroll: { pageHeight: D.pageHeight, introMs: D.introMs, introShot: D.introShot, virtual: D.virtual, stoppedAt: D.stoppedAt, wheelSteps: D.steps, readings: D.stops.length, pinnedPx: gsapInfo ? gsapInfo.pinnedPx : 0 },
  brand: { ...stat.brand, files: copied }, copy: copyAll, tech, body: stat.body,
  css: { sheets: css.sheets, counts: css.counts, classRules: css.classRules, vars: css.vars, rootResolved: css.rootResolved, fontFaces: css.fontFaces, fontFaceCount: css.fontFaceCount, keyframes: css.keyframes, animations: css.animations, transitions: css.transitions, states: css.states, features: css.features, media: css.media, reducedMotionRules: css.reducedMotionRules },
  used: tokens ? { colors: tokens.colors, fontFamilies: tokens.fontFamilies, radii: tokens.radii, shadows: tokens.shadows, spacing: tokens.spacing, transitions: tokens.motion, libraries: tokens.libraries } : null,
  typography: { scale: typeScale, usedWeights, texts: M.texts.slice(0, 400) },
  layout: { ...stat.layout, pageHeight: D.pageHeight, breakpoints, sections: stat.sections }, media: stat.media,
  components: { ...components, navScrolled }, altTheme, a11y: stat.a11y,
  motion: { observed: animations, classToggles, jsAnimated, waapi: (probe && probe.waapi) || [], intersectionObservers: (probe && probe.io) || [], listeners, matchMedia: (probe && probe.media) || {}, rafPerSecondIdle: rafIdle, viewTransitions: (probe && probe.viewTransitions) || 0, gsap: gsapInfo, lenis },
  mobile: mobile && !mobile.error ? { viewport: mobile.viewport, pageHeight: mobile.pageHeight, introMs: mobile.introMs, virtual: mobile.virtual, nav: mobile.nav, sections: mobile.sections, grids: mobile.grids, buttons: mobile.buttons, scale: mobile.scale.slice(0, 40), body: mobile.body } : mobile,
  screens: { desktop: D.screens, fullPage, mobile: mobile && mobile.screens, altTheme: altTheme && altTheme.file }, jsErrors: [...new Set(jsErrors)].slice(0, 10), reading,
}
fs.writeFileSync(path.join(outDir, 'site-raw.json'), JSON.stringify(raw, null, 1))

// ------------------------------------------------------------------ resumo legível

const L = []
const H = (t) => L.push('', `## ${t}`, '')
const cell = (x) => String(x === null || x === undefined || x === '' ? '—' : x).replace(/\|/g, '\\|').replace(/\n/g, ' ')
const row = (...c) => L.push('| ' + c.map(cell).join(' | ') + ' |')
const head = (...c) => { row(...c); row(...c.map(() => '---')) }
const code = (s) => '`' + s + '`'
const list = (a, n, f = (x) => `"${x}"`) => a.slice(0, n).map(f).join(' · ') || '—'
const b = raw.brand
const telas = (p) => num(p / VH, 1)

L.push(`# Medição do site — ${b.title || raw.source}`, '', `Fonte: ${raw.source} · medido em ${raw.measuredAt.slice(0, 10)} · desktop ${VW}×${VH}${mobile && !mobile.error ? ' + mobile 390×844' : ''} · site_design ${VERSION}`,
  '', '> Valores computados pelo navegador: exatos para o que foi exercitado (carga, rolagem da página inteira, hover).', '> Dados completos em `site-raw.json`. Confirme a intenção lendo o código listado em "Arquivos para ler".')

H('Como a página se comporta')
L.push(`- **Intro:** ${D.introMs === null ? `a rolagem não destravou em ${opt.waitIntro}s (página de uma tela, rolagem virtual, ou exige clique para entrar)` : D.introMs > 1200 ? `a rolagem fica travada até ${D.introExact ? '' : '≈ '}${num(D.introMs / 1000, 1)}s depois da carga (loader/intro)${D.introShot ? ` → ${D.introShot}` : ''}` : 'sem trava: rola desde o início'}`,
  `- **Altura:** ${D.pageHeight}px (${telas(D.pageHeight)} telas de ${VH}px)${gsapInfo && gsapInfo.pinnedPx ? ` · **${gsapInfo.pinnedPx}px (${Math.round((gsapInfo.pinnedPx / Math.max(1, D.pageHeight - VH)) * 100)}% da rolagem) são trechos presos (pin)**: a tela fica parada e a rolagem conduz a animação` : ''}`,
  `- **Rolagem:** ${lenis && lenis.used ? `suavizada por Lenis${lenis.version ? ' ' + lenis.version : ''}` : stat.layout.scrollBehavior === 'smooth' ? 'nativa com scroll-behavior: smooth' : 'nativa'}${D.virtual ? ' · sem posição em pixels (as telas estão por passo de roda)' : ''}${D.stoppedAt !== null ? ` · **parou em ${D.stoppedAt}px e não avançou mais: o que vem depois não foi medido**` : ''}`,
  `- **Leituras:** ${D.stops.length} paradas ao longo da página (textos e componentes são somados de todas elas) · ${D.steps} passos de roda`)

H('Marca')
L.push(`- **Título:** ${b.title}`, `- **Descrição:** ${b.description || '—'}`, `- **Idioma:** ${b.lang || '—'} · **theme-color:** ${b.themeColor.map((t) => t.color + (t.media ? ` (${t.media})` : '')).join(', ') || '—'} · **atributos do html:** ${b.htmlAttrs.join(' ') || '—'}`,
  `- **Logo:** ${b.logo ? `${code(b.logo.selector)} (${b.logo.tag}${b.logo.text ? `, texto "${b.logo.text}"` : ''}, ${b.logo.rect.w}×${b.logo.rect.h}px) → brand/logo.png${copied.logoSvg ? ', brand/logo.svg' : ''}${copied.logo ? ', ' + copied.logo : ''}` : 'nenhum elemento de logo no topo da página (procure nas telas: pode ser o próprio título, ou não existir)'}`,
  `- **Favicon / imagem social:** ${copied.favicon || '—'} / ${copied.ogImage || b.ogImage || '—'}`)
L.push('', '**Voz (textos reais, na ordem em que aparecem):**', `- H1: ${list(copyAll.h1, 6)}`, `- H2: ${list(copyAll.h2, 16)}`, `- H3: ${list(copyAll.h3, 16)}`, `- Rótulos (caixa alta / pequenos): ${list([...new Set(copyAll.labels)], 24)}`,
  `- Botões: ${list([...new Set(copyAll.cta)], 20)}`, `- Navegação: ${copyAll.nav.join(' · ') || '— (sem menu no topo)'}`, `- Parágrafos: ${list(copyAll.paragraphs, 5)}`, `- Rodapé: ${copyAll.footer ? `"${copyAll.footer.slice(0, 200)}"` : '—'}`)

H('Stack e ferramentas')
if (tech) L.push(`- **Bibliotecas (captura):** ${[...(tech.builders || []), ...(tech.libraries || []).map((l) => l.name + (l.version ? ' ' + l.version : ''))].join(', ') || 'nenhuma conhecida'}`, `- **Runtime:** ${JSON.stringify(tech.runtime || {})}`)
L.push(`- **Globais na página:** ${(tokens && tokens.libraries.join(', ')) || '—'}`,
  `- **GSAP:** ${gsapInfo ? `v${gsapInfo.version} · ${gsapInfo.tweenCount} tweens em ${gsapInfo.timelines.length} timelines + ${gsapInfo.loose.length} soltos · ${gsapInfo.scrollTriggers.length} ScrollTriggers · plugins: ${gsapInfo.plugins.join(', ') || 'só o núcleo'}${gsapInfo.defaults ? ` · padrão: ease ${gsapInfo.defaults.ease}, ${gsapInfo.defaults.duration}s` : ''}` : 'não exposto como global (se o site usa, está empacotado: leia o código)'}`)
if (lenis && lenis.used) L.push(`- **Lenis:** ${lenis.version ? 'v' + lenis.version + ' · ' : ''}${lenis.constructorOptions.length ? 'opções passadas: ' + code(jsonShort(lenis.constructorOptions[0], 400)) : 'instância não alcançada (empacotado): leia as opções no código'}${lenis.effectiveOptions ? ` · em vigor: duration ${lenis.effectiveOptions.duration}, lerp ${lenis.effectiveOptions.lerp}, wheelMultiplier ${lenis.effectiveOptions.wheelMultiplier}, smoothWheel ${lenis.effectiveOptions.smoothWheel}` : ''}`)
else L.push('- **Lenis:** não')
L.push(`- **Canvas:** ${raw.media.canvases.map((c) => `${code(c.selector)} ${c.w}×${c.h} ${c.engine || ''} (position ${c.position}, pointer-events ${c.pointerEvents})`).join('; ') || 'nenhum'}`,
  `- **Vídeos / embeds:** ${raw.media.videos.map((v) => `${code(v.selector)} ${String(v.src).split('/').pop().split('?')[0]}${v.autoplay ? ' autoplay' : ''}${v.loop ? ' loop' : ''}${v.muted ? ' muted' : ''}`).join('; ') || 'nenhum vídeo'}${raw.media.embeds.length ? ' · ' + raw.media.embeds.join(', ') : ''}${raw.media.iframes.length ? ' · iframes: ' + raw.media.iframes.length : ''}`,
  `- **Recursos de CSS:** ${Object.entries(css.features || {}).map(([k, v]) => `${k} (${v.count})`).join(', ') || '—'}`,
  `- **Folhas de estilo:** ${(css.sheets || []).map((s) => (s.blocked ? `${s.href} (bloqueada)` : `${String(s.href).split('/').pop().split('?')[0].slice(0, 40) || s.href} (${s.rules} regras${s.fontFaces ? `, ${s.fontFaces} @font-face` : ''})`)).join(' · ')}`)

H('Tokens do próprio site (variáveis CSS)')
const varBlocks = (css.vars || []).slice().sort((x, y) => Object.keys(y.vars).length - Object.keys(x.vars).length).slice(0, 8)
if (!varBlocks.length) L.push('O site não declara variáveis CSS: os tokens precisam ser derivados dos valores em uso (seções abaixo).')
for (const v of varBlocks) { L.push(`**${code(v.selector)}**${v.media ? ` @media ${v.media}` : ''} — ${Object.keys(v.vars).length} variáveis`, '```css'); for (const [k, val] of Object.entries(v.vars).slice(0, 90)) L.push(`${k}: ${val};`); L.push('```') }
if (altTheme) L.push(`**Tema alternativo "${altTheme.name}"** (${altTheme.mechanism}): fundo ${rgbToHex(altTheme.background)}, texto ${rgbToHex(altTheme.color)}, ${Object.keys(altTheme.vars).length} variáveis mudam → ${altTheme.file}`)

H('Cores em uso (computadas)')
const bodyBg = rgbToHex(raw.body.background), bodyFg = rgbToHex(raw.body.color)
L.push(`Corpo: fundo ${bodyBg}, texto ${bodyFg}, contraste ${contrast(bodyFg, bodyBg)}:1`, '')
if (tokens) { head('papel', 'cor', 'peso (área em px² ou caracteres)'); for (const c of tokens.colors.background.slice(0, 10)) row('fundo', rgbToHex(c.value), c.weight); for (const c of tokens.colors.text.slice(0, 8)) row('texto', rgbToHex(c.value), c.weight); for (const c of tokens.colors.border.slice(0, 5)) row('borda', hexify(c.value), c.weight) }
const textColors = new Map()
for (const s of M.scale) for (const [c, n] of Object.entries(s.colors)) textColors.set(c, (textColors.get(c) || 0) + n)
L.push('', `**Cores de texto vistas em toda a rolagem** (caracteres): ${[...textColors.entries()].sort((a, b) => b[1] - a[1]).slice(0, 12).map(([c, n]) => `${rgbToHex(c)} ×${n}`).join(' · ') || '—'}`)

H('Tipografia')
L.push(`**@font-face** (${css.fontFaceCount || 0} regras, agrupadas por família):`)
for (const f of css.fontFaces || []) {
  const used = usedWeights[f.family] ? Object.keys(usedWeights[f.family]).sort() : null
  const has = (w) => f.weights.some((d) => { const [a, z] = d.split(/\s+/).map(Number); return z ? +w >= a && +w <= z : +w === a })
  const faux = used ? used.filter((w) => !has(w)) : []
  L.push(`- **${f.family}**${f.style !== 'normal' ? ' ' + f.style : ''} · pesos declarados ${f.weights.join(', ')} · ${used ? 'pesos usados na página: ' + used.join(', ') + (faux.length ? ` (**${faux.join(', ')} sem arquivo: o navegador aproxima a partir do peso mais próximo**)` : '') : '**declarada, mas nenhum texto visto com ela**'} · ${f.files} arquivo(s)${f.subsets ? ` (${f.subsets} subconjuntos unicode-range)` : ''} · ${f.formats.join('/')} · ${f.hosts.map((h) => (/gstatic|googleapis/.test(h) ? 'Google Fonts' : /typekit|adobe/.test(h) ? 'Adobe Fonts' : h)).join(', ')}${f.display.length ? ' · display ' + f.display.join('/') : ''}`)
}
if (!(css.fontFaces || []).length) L.push('- nenhuma declarada (fontes do sistema ou carregadas por script)')
const undeclared = Object.keys(usedWeights).filter((fam) => !(css.fontFaces || []).some((f) => f.family === fam))
if (undeclared.length) L.push(`- em uso sem @font-face (fonte do sistema ou de reserva): ${undeclared.join(', ')}`)
L.push('', `**Corpo (body):** ${raw.body.fontFamily.split(',')[0]} · ${raw.body.fontSize} / ${raw.body.lineHeight} · peso ${raw.body.fontWeight}`, '',
  '**Escala real** — cada estilo de texto visto na página, do maior para o menor. "CSS do autor" é o valor escrito na folha de estilo (é ele que vai para o design system; o px é o resultado em 1440).', '')
head('exemplo', 'onde', 'família', 'desktop', 'mobile', 'CSS do autor (font-size)', 'entrelinha', 'peso', 'tracking', 'caixa', 'cor', 'uso')
for (const s of typeScale.slice(0, 40)) {
  const a = s.authored['font-size'], am = s.authoredMobile && s.authoredMobile['font-size']
  row(`"${s.sample.slice(0, 34)}"`, s.selectors.slice(0, 2).map(code).join(' '), s.family + (s.style === 'italic' ? ' itálico' : ''), s.size + 'px', s.mobileSize ? s.mobileSize + 'px' : '—',
    (a ? code(a) : 'não declarado') + (am && am !== a ? ` · mobile ${code(am)}` : '') + (s.suggestedClamp ? ` · interpolação sugerida ${code(s.suggestedClamp)}` : ''),
    s.lineHeight + (s.authored['line-height'] ? ` ← ${code(s.authored['line-height'])}` : ''), s.weight, s.tracking + (s.authored['letter-spacing'] ? ` ← ${code(s.authored['letter-spacing'])}` : ''), s.transform === 'none' ? '—' : s.transform, s.stroke ? `só contorno ${hexify(s.stroke)}` : s.clipText ? 'imagem/gradiente recortado no texto' : rgbToHex(s.color), `${s.elements} el · ${s.chars} car`)
}
if (typeScale.length > 40) L.push('', `(+${typeScale.length - 40} estilos menores em site-raw.json → typography.scale)`)

H('Layout')
L.push(`- **Breakpoints:** ${breakpoints.map((p) => `${p.query} (${p.rules} regras)`).join(' · ') || 'nenhum @media de largura'}`, `- **Contêineres (max-width):** ${raw.layout.maxWidths.map((w) => `${w.value} ×${w.count} (${code(w.sample)})`).join(' · ') || '—'}`,
  `- **Grids:** ${raw.layout.grids.map((g) => `${g.value} ×${g.count} (${code(g.sample)})`).join(' · ') || '—'}`, `- **Gaps de flex:** ${raw.layout.flexGaps.map((g) => `${g.value} ×${g.count}`).join(' · ') || '—'}`,
  `- **Espaçamentos mais usados:** ${tokens ? tokens.spacing.slice(0, 14).map((s) => `${s.value} ×${s.weight}`).join(' · ') : '—'}`, '')
L.push('**Blocos da página** (estrutura do documento; "preso" = dentro de um pin do ScrollTrigger, a altura inclui a rolagem que ele consome):', '')
head('bloco', 'topo', 'altura', 'telas', 'fundo', 'padding', 'título', 'mídia')
for (const s of raw.layout.sections) row(code(s.selector) + (s.pinSpacer ? ' (preso)' : ''), s.y, s.h, telas(s.h), s.background ? rgbToHex(s.background) : s.backgroundImage ? 'imagem/gradiente' : '—', s.padding, s.heading, [s.images ? s.images + ' img' : '', s.hasCanvas ? 'canvas' : '', s.hasVideo ? 'vídeo' : ''].filter(Boolean).join(', '))
if (mobile && !mobile.error) L.push('', `**Mobile (390×844):** ${mobile.pageHeight}px de altura (${num(mobile.pageHeight / 844, 1)} telas)${mobile.introMs > 1500 ? ` · intro ≈ ${num(mobile.introMs / 1000, 1)}s` : ''}${mobile.virtual ? ' · rolagem não destravou' : ''} · grids: ${mobile.grids.map((g) => g.value).slice(0, 4).join(' · ') || '—'}`)

H('Forma e imagem')
L.push(`- **Raios:** ${tokens ? tokens.radii.map((r) => `${r.value} ×${r.weight}`).join(' · ') : '—'}`, `- **Sombras:** ${tokens ? tokens.shadows.map((s) => code(hexify(s.value)) + ' ×' + s.weight).join(' · ') || 'nenhuma' : '—'}`,
  `- **Imagens:** ${raw.media.images.total} no documento · formatos ${raw.media.images.formats.map((f) => f.value + ' ×' + f.count).join(', ')} · raio ${raw.media.images.radius.map((f) => f.value + ' ×' + f.count).join(', ')} · proporções ${raw.media.images.aspect.map((f) => f.value + ' ×' + f.count).join(', ')} · object-fit ${raw.media.images.objectFit.map((f) => f.value + ' ×' + f.count).join(', ')} · lazy ${raw.media.images.lazy} · fundos em CSS ${raw.media.images.backgroundImages}`,
  `- **Ícones:** ${raw.media.svg.inline} SVG inline (${raw.media.svg.strokeBased} de traço) · ${raw.media.svg.asImage} SVG como imagem · tamanhos ${raw.media.svg.sizes.map((s) => s.value + ' ×' + s.count).join(', ') || '—'}`)

H('Componentes')
L.push('Vistos em toda a rolagem. "Y" é a posição da página em que o componente estava na tela; os valores com ← são os escritos pelo autor no CSS.', '')
const authNote = (a) => { const p = []; if (a && a['font-size']) p.push(`font-size ${a['font-size']}`); if (a && a['padding-top']) p.push(`padding ${a['padding-top']} ${a['padding-left'] || ''}`.trim()); if (a && a['border-top-left-radius']) p.push(`raio ${a['border-top-left-radius']}`); if (a && a.height) p.push(`altura ${a.height}`); return p.length ? ` ← ${code(p.join(' · '))}` : '' }
const css1 = (s) => {
  const pad = `${s['padding-top']} ${s['padding-right']} ${s['padding-bottom']} ${s['padding-left']}`
  return [`fundo ${rgbToHex(s['background-color'])}${s['background-image'] && s['background-image'] !== 'none' ? ' + gradiente/imagem' : ''}`, s.color ? `texto ${rgbToHex(s.color)}` : '', s['border-top-width'] && s['border-top-width'] !== '0px' ? `borda ${s['border-top-width']} ${rgbToHex(s['border-top-color'])}` : '', `raio ${s['border-radius']}`, `padding ${pad}`,
    s['font-size'] ? `${s['font-size']}/${s['font-weight']}` : '', s['letter-spacing'] && s['letter-spacing'] !== 'normal' ? `tracking ${s['letter-spacing']}` : '', s['box-shadow'] && s['box-shadow'] !== 'none' ? `sombra ${hexify(s['box-shadow'])}` : '', s['text-transform'] && s['text-transform'] !== 'none' ? s['text-transform'] : '',
    s['backdrop-filter'] && s['backdrop-filter'] !== 'none' ? `backdrop ${s['backdrop-filter']}` : '', s.transition && !/^all( 0s|$)/.test(s.transition) ? `transição ${s.transition}` : ''].filter(Boolean).join(' · ')
}
const hov = (c) => {
  if (c.hover === undefined) return 'hover não medido' + (c.hoverError ? ` (${c.hoverError})` : '')
  const tw = (c.hoverTweens || []).map((t) => `GSAP ${t.targets.map(code).join(' ')} ${t.duration}s ${t.ease} ${jsonShort(t.to, 120)}`)
  const hv = (v) => jsonShort(hexify(v), 230)
  if (c.hover === null) return 'sem mudança no hover'
  return 'hover: ' + [...Object.entries(c.hover.self).map(([k, v]) => `${k} ${hv(v)}`), ...Object.entries(c.hover.children).map(([k, v]) => `filho ${code(k)} {${Object.entries(v).map(([p, x]) => `${p} ${hv(x)}`).join('; ')}}`), ...tw].join(' · ')
}
const foc = (c) => {
  if (c.focus === undefined || c.focus === null) return ''
  if (!c.focus.focusable) return ' · foco: não recebe foco por teclado'
  const d = Object.entries(c.focus.diff).filter(([k]) => !/^outline/.test(k)).map(([k, v]) => `${k} ${jsonShort(hexify(v), 120)}`)
  if (!c.focus.outline && !d.length) return ' · **foco: nenhuma mudança visível**'
  return ' · foco: ' + [c.focus.browserDefault ? 'anel padrão do navegador (o site não define estilo de foco)' : c.focus.outline ? `outline ${hexify(c.focus.outline)}` : '', ...d].filter(Boolean).join(' · ')
}
for (const [name, items] of [['Botões', components.buttons], ['Links de texto', components.links.slice(0, 5)], ['Campos', components.inputs], ['Cards / painéis', components.cards]]) {
  if (!items.length) continue
  L.push(`**${name}**`)
  for (const c of items) L.push(`- ${code(c.selector)} ×${c.count} · Y ${c.y}${c.size ? ` · ${c.size}` : ''}${c.samples && c.samples.length ? ` — "${c.samples.slice(0, 3).join('", "')}"` : ''}: ${name === 'Links de texto' ? `cor ${rgbToHex(c.style.color)} · ${c.style['font-size']}/${c.style['font-weight']} · decoração ${c.style['text-decoration-line']}${c.style['text-transform'] !== 'none' ? ' · ' + c.style['text-transform'] : ''}${c.style.transition && !/^all( 0s|$)/.test(c.style.transition) ? ' · transição ' + c.style.transition : ''}` : css1(c.style)}${c.borderBottom && !/^0px/.test(c.borderBottom) ? ` · borda inferior ${hexify(c.borderBottom)}` : ''}${c.placeholder ? ` · placeholder "${c.placeholder}"` : ''}${authNote(c.authored)} · ${hov(c)}${foc(c)}${c.file ? ` → ${c.file}${c.hoverFile ? ', ' + c.hoverFile : ''}` : ''}`)
}
if (components.nav) {
  const n = components.nav
  L.push(`**Navegação** ${code(n.selector)}: ${n.rect.w}×${n.rect.h}px, position ${n.style.position}, fundo ${rgbToHex(n.style['background-color'])}, ${n.links} links, botões: ${n.buttons.map((x) => x.label || x.selector).join(', ') || '—'} → components/nav_topo.png`)
  if (navScrolled) { const d = diff(n.style, navScrolled.style); L.push(`  - depois de rolar 400px: ${navScrolled.visible ? 'continua visível' : 'sai da tela'}${Object.keys(d).length ? ' · muda ' + Object.entries(d).map(([k, v]) => `${k} ${hexify(v)}`).join('; ') : ' · sem mudança de estilo'} · classes: ${code(navScrolled.className)} → components/nav_rolado.png`) }
} else L.push('**Navegação:** nenhum cabeçalho/menu visível no topo.')
if (mobile && mobile.nav) L.push(`  - mobile: ${mobile.nav.rect.w}×${mobile.nav.rect.h}px, ${mobile.nav.links} links visíveis, botões: ${mobile.nav.buttons.map((x) => x.label || x.selector).join(', ') || '—'}`)
L.push('', `**Estados em CSS (:hover / :focus-visible / :active):** ${(css.states || []).length} regras${(css.states || []).length > 40 ? ' (40 primeiras; todas em site-raw.json → css.states)' : ''}:`, '```css')
for (const s of (css.states || []).slice(0, 40)) L.push(`${s.media ? `@media ${s.media} { ` : ''}${s.selector} { ${s.css} }${s.media ? ' }' : ''}`)
L.push('```')

H('Motion')
const loops = rafIdle > 20 ? Math.max(1, Math.round(rafIdle / 60)) : 0
L.push(`- **@keyframes:** ${Object.keys(css.keyframes || {}).join(', ') || 'nenhum'}`, `- **prefers-reduced-motion:** ${css.reducedMotionRules} regra(s) em CSS · consultas via matchMedia: ${Object.keys(raw.motion.matchMedia).join(' | ') || '—'}`,
  `- **requestAnimationFrame em repouso (topo, 1 s):** ${rafIdle} chamadas${loops ? ` ≈ ${loops} laço(s) contínuo(s) a 60 fps (ticker do GSAP, Lenis, canvas…): a página nunca fica parada` : ': sem laço contínuo'}`,
  `- **View Transitions:** ${raw.motion.viewTransitions ? raw.motion.viewTransitions + ' chamada(s)' : 'não usadas'}`)

if (gsapInfo) {
  const stRow = (s) => row('ST#' + s.n + (s.id ? ` "${s.id}"` : ''), code(s.trigger), `${s.start} → ${s.end}`, `${s.startPx}–${s.endPx} (${telas(s.endPx - s.startPx)} telas)`, s.scrub === false ? 'não' : s.scrub === true ? 'true (colado)' : `${s.scrub}s de atraso`, s.pin ? code(s.pin) : '—',
    s.snap ? jsonShort(s.snap, 60) : '—', [s.toggleActions, s.toggleClass ? 'toggleClass ' + jsonShort(s.toggleClass, 40) : '', s.once ? 'once' : '', s.anticipatePin ? `anticipatePin ${s.anticipatePin}` : '', s.invalidateOnRefresh ? 'invalidateOnRefresh' : '', s.pinSpacing === false ? 'pinSpacing false' : '', s.callbacks.join('/')].filter(Boolean).join(' · ') || '—', s.animation ? (s.animation.tl ? `T${s.animation.tl} · ${s.animation.duration}s · ${s.animation.tweens} tweens` : `tween único de ${s.animation.duration}s (na tabela de soltos)`) : 'sem animação (só callbacks)')
  L.push('', `### GSAP ${gsapInfo.version} — mapa de rolagem`, '', 'Cada ScrollTrigger na ordem da página. Com `scrub`, a timeline inteira é esticada entre start e end: 1 s de timeline = (end − start) ÷ duração px de rolagem.', '')
  head('nº', 'gatilho', 'start → end', 'rolagem em px', 'scrub', 'pin', 'snap', 'ações / callbacks', 'animação')
  for (const s of gsapInfo.scrollTriggers.slice(0, 80)) stRow(s)
  const val = (o) => jsonShort(o, 150)
  const what = (t) => (t.kind === 'fromTo' ? `${val(t.from)} → ${val(t.to)}` : t.kind === 'from' ? `de ${val(t.to)}` : val(t.to)) + (t.resolved ? ` · calculado${t.count > 1 ? ' no 1º alvo' : ''}: ${Object.entries(t.resolved).map(([k, v]) => `${k} ${v}`).join(', ')}` : '') + (t.keyframes ? ` · keyframes ${val(t.keyframes)}` : '')
  const extra = (t) => [t.stagger !== null ? `stagger ${jsonShort(t.stagger, 60)}` : '', t.repeat ? `repeat ${t.repeat}${t.yoyo ? ' yoyo' : ''}${t.repeatDelay ? ` espera ${t.repeatDelay}s` : ''}` : '', t.delay ? `atraso ${t.delay}s` : ''].filter(Boolean).join(' · ')
  const tgt = (t) => t.targets.map(code).join(' ') + (t.count > 1 ? ` ×${t.count}` : '')
  let rows = 0
  L.push('', '### GSAP — timelines (na ordem de execução)', '')
  for (const tl of gsapInfo.timelines) {
    if (rows > 260) { L.push(`(+ timelines restantes em site-raw.json → motion.gsap.timelines)`); break }
    const st = gsapInfo.scrollTriggers.find((s) => s.n === tl.st)
    const pxPerSec = st && tl.duration ? Math.round((st.endPx - st.startPx) / tl.duration) : null
    L.push(`**T${tl.id}** · ${tl.duration}s · ${tl.tweens.length} tweens${st ? ` · guiada por ST#${st.n} ${code(st.trigger)} (${st.startPx}–${st.endPx}px${st.scrub !== false && pxPerSec ? `, 1 s = ${pxPerSec}px` : ', dispara e toca no tempo'})` : ' · roda no tempo (carga ou evento)'}${tl.repeat ? ` · repeat ${tl.repeat}${tl.yoyo ? ' yoyo' : ''}` : ''}${tl.defaults ? ` · defaults ${jsonShort(tl.defaults, 80)}` : ''}${tl.labels ? ` · labels ${jsonShort(tl.labels, 120)}` : ''}`, '')
    head('início (s)', st && st.scrub !== false ? 'rolagem (px)' : 'fim (s)', 'tipo', 'alvos', 'duração', 'ease', 'valores', 'extras')
    for (const t of tl.tweens.slice(0, 90)) { row(t.at, t.scrollPx ? `${t.scrollPx[0]}–${t.scrollPx[1]}` : num(t.at + t.total, 3), t.kind, tgt(t), t.duration + 's', t.ease, what(t), extra(t)); rows++ }
    if (tl.tweens.length > 90) L.push(`(+${tl.tweens.length - 90} tweens)`)
    L.push('')
  }
  if (gsapInfo.loose.length) {
    L.push('### GSAP — tweens soltos (fora de timeline)', '')
    head('quando', 'tipo', 'alvos', 'duração', 'ease', 'valores', 'extras')
    for (const t of gsapInfo.loose.slice(0, 80)) row(t.origin + (t.stN ? ` ST#${t.stN}${t.scrollPx ? ` ${t.scrollPx[0]}–${t.scrollPx[1]}px` : ''}` : '') + (t.origin !== 'carga' && !t.stN ? ` (Y ${t.y})` : ''), t.kind, tgt(t), t.duration + 's', t.ease, what(t) + (t.variants ? ` · repetido ${t.variants}× com outros valores (segue o ponteiro ou a rolagem)` : ''), extra(t))
    if (gsapInfo.loose.length > 80) L.push(`(+${gsapInfo.loose.length - 80} em site-raw.json)`)
  }
}

L.push('', '### CSS', '', '**Onde cada @keyframes é aplicado:**')
for (const a of (css.animations || []).slice(0, 40)) {
  if (a.raw) L.push(`- ${code(a.selector)}${a.media ? ` @${a.media}` : ''}: ${code('animation: ' + a.raw)}`)
  else L.push(`- ${code(a.selector)}${a.media ? ` @${a.media}` : ''}: ${code(a.name)} ${a.duration} ${a.easing} · atraso ${a.delay || '0s'} · ${a.iteration === 'infinite' ? 'infinita' : (a.iteration || 1) + '×'}${a.fill && a.fill !== 'none' ? ' · fill ' + a.fill : ''}${a.direction && a.direction !== 'normal' ? ' · ' + a.direction : ''}${a.timeline ? ' · animation-timeline ' + a.timeline : ''}`)
}
if (!(css.animations || []).length) L.push('- nenhuma')
L.push('', '**Definição dos @keyframes:**', '```css'); for (const k of Object.values(css.keyframes || {}).slice(0, 24)) L.push(k.slice(0, 700)); L.push('```')
const trans = new Map()
for (const t of css.transitions || []) { if (t.value === 'none' || /prefers-reduced-motion/.test(t.media)) continue; const o = trans.get(t.value) || { n: 0, sel: [] }; o.n++; if (o.sel.length < 4 && !o.sel.includes(t.selector)) o.sel.push(t.selector); trans.set(t.value, o) }
L.push('', '**Transições declaradas** (valor → regras):'); for (const [v, o] of [...trans.entries()].sort((x, y) => y[1].n - x[1].n).slice(0, 30)) L.push(`- ${code(v)} ×${o.n} — ${o.sel.map(code).join(', ')}`)
if (!trans.size) L.push('- nenhuma')

L.push('', '### O que foi visto rodando', '', '**Animações CSS e Web Animations** (keyframes = @keyframes · transição = transition · WAAPI = element.animate):', '')
if (animations.length) {
  head('fase', 'Y', 'tipo', 'nome / propriedade', 'alvo', 'elementos', 'duração', 'easing', 'atraso', 'repetição', 'propriedades')
  for (const a of animations.slice(0, 70)) row(a.phase, a.firstY, a.type, a.name, code(a.target), a.elements, Math.round(a.duration) + 'ms', a.easing, a.delays.map((d) => d + 'ms').join(' / '), a.iterations === 'infinite' ? 'infinita' : a.iterations + '×', a.type === 'transição' ? '—' : (a.props || []).join(', '))
} else L.push('nenhuma')
L.push('', '**Classes trocadas** (reveal, estado, trava de rolagem):', '')
if (classToggles.length) {
  head('elemento', 'classe', 'entra', 'sai', 'entre Y', 'regras envolvidas')
  for (const c of classToggles.slice(0, 36)) row(code(c.element), '.' + c.cls, c.add, c.remove, `${c.fromY}–${c.toY}`, [...(c.rules || []), ...(c.baseTransitions || [])].map((x) => code(hexify(x))).join(' ‖ ') || (/^lenis/.test(c.cls) ? 'classe interna do Lenis' : '— (sem regra de CSS: usada só pelo JS)'))
} else L.push('nenhuma')
L.push('', '**Elementos com style inline reescrito** (animação por JavaScript):', '')
if (jsAnimated.length) {
  head('elemento', 'quantos', 'escritas', 'propriedades', 'entre Y', 'por')
  for (const j of jsAnimated.slice(0, 40)) row(code(j.element), j.elements, j.writes, j.props.join(', '), j.everywhere ? 'a página toda (laço contínuo ou resposta ao ponteiro)' : `${j.fromY}–${j.toY}`, j.by)
  if (jsAnimated.length > 40) L.push(`(+${jsAnimated.length - 40} em site-raw.json)`)
} else L.push('nenhum')
if (raw.motion.waapi.length) { L.push('', '**Chamadas a element.animate():**'); for (const w of raw.motion.waapi.slice(0, 20)) L.push(`- ${code(w.target)} (Y ${w.y}): ${jsonShort(w.keyframes, 260)} · ${jsonShort(w.options, 160)}`) }
L.push('', '**IntersectionObservers:**')
for (const o of raw.motion.intersectionObservers.slice(0, 16)) L.push(`- rootMargin ${code(o.rootMargin)} · threshold ${JSON.stringify(o.threshold)}${o.root ? ` · root ${code(o.root)}` : ''} · ${o.n ? `${o.n} alvo(s): ${o.targets.map(code).join(', ')}` : 'criado sem alvos durante a medição (provável uso em conteúdo aberto depois: modal, lista dinâmica)'}`)
if (!raw.motion.intersectionObservers.length) L.push('- nenhum')
L.push('', '**Ouvintes de interação:**'); for (const [t, o] of Object.entries(listeners).sort((x, y) => y[1].count - x[1].count)) L.push(`- ${t} ×${o.count}: ${o.targets.map(code).join(', ')}`)

H('Acessibilidade (fatos)')
L.push(`- idioma ${code(raw.a11y.lang)} · marcos: ${raw.a11y.landmarks.join(', ') || 'nenhum'} · skip link: ${raw.a11y.skipLink ? 'sim' : 'não'} · h1: ${raw.a11y.h1Count} · ordem dos títulos no documento: ${raw.a11y.headingOrder || '—'}`, `- imagens: ${raw.media.images.withAlt} com alt, ${raw.media.images.decorativeAlt} decorativas (alt=""), ${raw.a11y.imagesWithoutAlt} sem atributo alt · aria-label: ${raw.a11y.ariaLabels}`,
  `- foco: ${(css.states || []).filter((s) => /focus-visible/.test(s.selector)).length} regra(s) :focus-visible · reduced motion: ${css.reducedMotionRules} regra(s) em CSS`)
if (reading.length) {
  H('Arquivos para ler (código real, relativo a esta pasta)')
  for (const r of reading.filter((x) => !x.vendor).slice(0, 24)) L.push(`- ${code(r.file)} (${r.kind}, ${(r.size / 1024).toFixed(1)} KB)`)
  const v = reading.filter((x) => x.vendor)
  if (v.length) L.push(`- bibliotecas de terceiros (não precisa ler): ${v.map((x) => x.file.split('/').pop()).slice(0, 12).join(', ')}`)
}
H('Telas')
L.push('Desktop (posição de rolagem e em que ponto de cada ScrollTrigger a tela foi tirada):')
for (const s of D.screens) L.push(`- ${s.file} · ${s.y === null ? `passo ${s.step}` : `Y ${s.y}`}${stAt(s.y) ? ` · ${stAt(s.y)}` : ''}`)
if (D.introShot) L.push(`- ${D.introShot} · intro/loader (antes de a rolagem destravar)`)
L.push(fullPage ? `- página inteira: ${fullPage}` : `- página inteira: não gerada${stat.layout.pinSpacers ? ' (há trechos presos: a foto corrida não corresponde ao que se vê rolando)' : ''}`,
  mobile && mobile.screens ? `- mobile: ${mobile.screens.map((s) => `${s.file} (Y ${s.y === null ? 'passo ' + s.step : s.y})`).join(' · ')}` : `- mobile: ${mobile && mobile.error ? 'falhou: ' + mobile.error : 'não medido'}`)
if (altTheme) L.push(`- tema alternativo: ${altTheme.file}`)
L.push(`- recortes: components/ (${fs.readdirSync(path.join(outDir, 'components')).length} arquivos) · brand/ (${fs.readdirSync(path.join(outDir, 'brand')).join(', ') || 'vazio'})`)
if (raw.jsErrors.length) L.push('', `Erros de JavaScript durante a medição: ${raw.jsErrors.join(' | ')}`)
fs.writeFileSync(path.join(outDir, 'summary.md'), L.join('\n') + '\n')

log(`\nPronto em ${secs()} → ${outDir}`)
log(`  ${Object.keys(css.rootResolved || {}).length} variáveis CSS na raiz · ${(css.fontFaces || []).length} famílias em @font-face · ${typeScale.length} estilos de texto · ${breakpoints.length} breakpoints`)
log(`  componentes: ${components.buttons.length} botões, ${components.cards.length} cards, ${components.links.length} links, ${components.inputs.length} campos${altTheme ? ` · tema "${altTheme.name}" detectado` : ''}`)
log(`  motion: ${Object.keys(css.keyframes || {}).length} @keyframes, ${animations.length} animações CSS observadas, ${classToggles.length} trocas de classe, ${jsAnimated.length} elementos animados por JS, ${raw.motion.intersectionObservers.length} IntersectionObservers${gsapInfo ? `, GSAP ${gsapInfo.version}: ${gsapInfo.tweenCount} tweens / ${gsapInfo.timelines.length} timelines / ${gsapInfo.scrollTriggers.length} ScrollTriggers` : ''}`)
if (D.stoppedAt !== null) log(`  ATENÇÃO: a rolagem parou em ${D.stoppedAt}px de ${D.pageHeight}px. O resto da página não foi medido.`)
log(`  leia: ${path.join(outDir, 'summary.md')}`)
