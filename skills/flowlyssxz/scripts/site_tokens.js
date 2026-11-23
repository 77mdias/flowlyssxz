// site_tokens.js — extrai os valores REAIS (computados) de um site aberto no navegador.
// Use quando a referência tem URL: é muito mais preciso do que medir vídeo.
//
// Como rodar (qualquer um):
//   • Console do DevTools: cole o arquivo inteiro; o resultado fica em window.__flowTokens e é copiado se possível.
//   • Ferramenta de JavaScript do navegador do agente: execute o arquivo e leia o valor retornado.
//   • Playwright: const data = await page.evaluate(fs.readFileSync('site_tokens.js', 'utf8'))
//
// Role a página até o fim antes (conteúdo lazy) e rode em 1440px de largura para comparar com as medições de vídeo.
(() => {
  const vis = (el) => {
    const r = el.getBoundingClientRect(), s = getComputedStyle(el)
    return r.width > 1 && r.height > 1 && s.visibility !== 'hidden' && s.display !== 'none' && +s.opacity > 0.05
  }
  const bump = (m, k, w = 1, extra) => { const o = m.get(k) || { weight: 0, ...extra }; o.weight += w; m.set(k, o) }
  const top = (m, n) => [...m.entries()].sort((a, b) => b[1].weight - a[1].weight).slice(0, n).map(([k, v]) => ({ value: k, ...v, weight: Math.round(v.weight) }))
  const colors = { text: new Map(), background: new Map(), border: new Map() }
  const families = new Map(), sizes = new Map(), radii = new Map(), shadows = new Map(), spacing = new Map()
  const durations = new Map(), easings = new Map()
  const els = [...document.querySelectorAll('body *')].filter(vis).slice(0, 6000)
  for (const el of els) {
    const s = getComputedStyle(el), r = el.getBoundingClientRect(), area = Math.min(r.width * r.height, innerWidth * innerHeight)
    const own = [...el.childNodes].filter((n) => n.nodeType === 3).map((n) => n.textContent.trim()).join(' ').trim()
    if (own.length > 1) {
      bump(colors.text, s.color, own.length)
      bump(families, s.fontFamily, own.length)
      const key = `${parseFloat(s.fontSize)}px`
      const o = sizes.get(key) || { weight: 0, variants: new Map() }
      o.weight += own.length
      const vk = [s.fontFamily.split(',')[0].trim(), s.fontWeight, s.lineHeight, s.letterSpacing, s.textTransform, s.fontStyle].join(' | ')
      if (!o.variants.has(vk)) o.variants.set(vk, { tag: el.tagName.toLowerCase(), sample: own.slice(0, 60) })
      sizes.set(key, o)
    }
    if (s.backgroundColor !== 'rgba(0, 0, 0, 0)' && s.backgroundColor !== 'transparent') bump(colors.background, s.backgroundColor, area)
    if (parseFloat(s.borderTopWidth) > 0 && s.borderTopStyle !== 'none') bump(colors.border, `${s.borderTopWidth} ${s.borderTopStyle} ${s.borderTopColor}`, 1)
    if (s.borderRadius !== '0px') bump(radii, s.borderRadius, 1, { tag: el.tagName.toLowerCase() })
    if (s.boxShadow !== 'none') bump(shadows, s.boxShadow, 1)
    for (const p of ['paddingTop', 'paddingLeft', 'marginTop', 'marginBottom', 'rowGap', 'columnGap']) {
      const v = parseFloat(s[p]); if (v > 0 && v < 400) bump(spacing, `${Math.round(v)}px`, 1)
    }
    const d = s.transitionDuration.split(',').map((x) => x.trim()).filter((x) => x !== '0s')
    if (d.length) { d.forEach((x) => bump(durations, x)); s.transitionTimingFunction.split(/,(?![^(]*\))/).forEach((x) => bump(easings, x.trim())) }
    if (s.animationName !== 'none') { bump(durations, s.animationDuration.split(',')[0].trim()); bump(easings, s.animationTimingFunction.split(/,(?![^(]*\))/)[0].trim()) }
  }
  const vars = {}
  for (const sheet of document.styleSheets) {
    let rules; try { rules = sheet.cssRules } catch { continue }                // folhas de outro domínio são bloqueadas
    for (const rule of rules) if (rule.selectorText === ':root' || rule.selectorText === 'html') for (const p of rule.style) if (p.startsWith('--')) vars[p] = rule.style.getPropertyValue(p).trim()
  }
  const body = getComputedStyle(document.body)
  const libs = ['gsap', 'ScrollTrigger', 'Lenis', 'THREE', 'barba', 'Swup', 'lottie', 'rive', 'Webflow', '__NEXT_DATA__', '__NUXT__'].filter((k) => k in window)
  if (document.querySelector('.lenis, [data-lenis-prevent]')) libs.push('lenis (classe)')
  if (document.querySelector('.pin-spacer')) libs.push('ScrollTrigger pin (pin-spacer)')
  if (document.querySelector('canvas')) libs.push(`canvas ×${document.querySelectorAll('canvas').length}`)
  const out = {
    url: location.href, viewport: [innerWidth, innerHeight], pageHeight: document.documentElement.scrollHeight,
    body: { background: body.backgroundColor, color: body.color, fontFamily: body.fontFamily, fontSize: body.fontSize, lineHeight: body.lineHeight },
    colors: { text: top(colors.text, 8), background: top(colors.background, 10), border: top(colors.border, 6) },
    fontFamilies: top(families, 6),
    typeScale: [...sizes.entries()].sort((a, b) => parseFloat(b[0]) - parseFloat(a[0])).map(([size, o]) => ({
      size, vw: +(parseFloat(size) / innerWidth * 100).toFixed(2), chars: o.weight,
      variants: [...o.variants.entries()].slice(0, 3).map(([k, v]) => {
        const [family, weight, lineHeight, letterSpacing, textTransform, fontStyle] = k.split(' | ')
        return { family, weight, lineHeight, letterSpacing, textTransform, fontStyle, ...v }
      }),
    })),
    radii: top(radii, 8), shadows: top(shadows, 6), spacing: top(spacing, 16),
    motion: { durations: top(durations, 8), easings: top(easings, 6) },
    cssVariables: vars, libraries: libs,
  }
  window.__flowTokens = out
  try { copy(JSON.stringify(out, null, 2)) } catch {}
  return out
})()
