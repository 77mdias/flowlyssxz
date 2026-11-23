# Receitas — cursor, hover, interação e transições de página

Desative tudo que depende de hover em telas de toque: `matchMedia('(hover: hover) and (pointer: fine)')`.

## 1. Cursor custom com atraso (lerp) e estados

```js
const fine = matchMedia('(hover: hover) and (pointer: fine)').matches
if (fine) {
  const dot = document.querySelector('.cursor')
  gsap.set(dot, { xPercent: -50, yPercent: -50 })
  const x = gsap.quickTo(dot, 'x', { duration: 0.45, ease: 'power3' })
  const y = gsap.quickTo(dot, 'y', { duration: 0.45, ease: 'power3' })
  addEventListener('pointermove', (e) => { x(e.clientX); y(e.clientY) })
  document.querySelectorAll('[data-cursor]').forEach((el) => {
    el.addEventListener('pointerenter', () => { dot.dataset.state = el.dataset.cursor; gsap.to(dot, { scale: 3, duration: 0.4 }) })
    el.addEventListener('pointerleave', () => { dot.dataset.state = ''; gsap.to(dot, { scale: 1, duration: 0.4 }) })
  })
}
```
```css
.cursor { position: fixed; top: 0; left: 0; width: 12px; height: 12px; border-radius: 50%; pointer-events: none; z-index: 1000;
          background: currentColor; mix-blend-mode: difference; }
.cursor[data-state="view"]::after { content: 'ver'; font-size: 3px; }
```

## 2. Botão magnético

```js
document.querySelectorAll('[data-magnetic]').forEach((el) => {
  const strength = parseFloat(el.dataset.magnetic) || 0.35
  const xTo = gsap.quickTo(el, 'x', { duration: 0.6, ease: 'elastic.out(1, 0.4)' })
  const yTo = gsap.quickTo(el, 'y', { duration: 0.6, ease: 'elastic.out(1, 0.4)' })
  el.addEventListener('pointermove', (e) => {
    const r = el.getBoundingClientRect()
    xTo((e.clientX - (r.left + r.width / 2)) * strength)
    yTo((e.clientY - (r.top + r.height / 2)) * strength)
  })
  el.addEventListener('pointerleave', () => { xTo(0); yTo(0) })
})
```

## 3. Tilt 3D em card

```js
document.querySelectorAll('[data-tilt]').forEach((card) => {
  gsap.set(card, { transformPerspective: 900 })
  const rx = gsap.quickTo(card, 'rotationX', { duration: 0.5, ease: 'power3' })
  const ry = gsap.quickTo(card, 'rotationY', { duration: 0.5, ease: 'power3' })
  card.addEventListener('pointermove', (e) => {
    const r = card.getBoundingClientRect()
    ry(((e.clientX - r.left) / r.width - 0.5) * 14)
    rx(-((e.clientY - r.top) / r.height - 0.5) * 14)
  })
  card.addEventListener('pointerleave', () => { rx(0); ry(0) })
})
```

## 4. Imagem que aparece seguindo o cursor (lista de projetos)

```js
const preview = document.querySelector('.hover-preview')       // position:fixed; pointer-events:none
const px = gsap.quickTo(preview, 'x', { duration: 0.6, ease: 'power3' })
const py = gsap.quickTo(preview, 'y', { duration: 0.6, ease: 'power3' })
addEventListener('pointermove', (e) => { px(e.clientX); py(e.clientY) })
document.querySelectorAll('.project-row').forEach((row) => {
  row.addEventListener('pointerenter', () => {
    preview.querySelector('img').src = row.dataset.img
    gsap.to(preview, { autoAlpha: 1, scale: 1, duration: 0.5, ease: 'power3.out' })
  })
  row.addEventListener('pointerleave', () => gsap.to(preview, { autoAlpha: 0, scale: 0.85, duration: 0.4 }))
})
```

## 5. Image trail (imagens deixando rastro)

```js
const imgs = [...document.querySelectorAll('.trail img')]     // pool; position:fixed; opacity:0
let i = 0, last = { x: 0, y: 0 }
addEventListener('pointermove', (e) => {
  if (Math.hypot(e.clientX - last.x, e.clientY - last.y) < 80) return   // distância mínima entre imagens
  last = { x: e.clientX, y: e.clientY }
  const img = imgs[i++ % imgs.length]
  gsap.killTweensOf(img)
  gsap.timeline()
    .set(img, { x: e.clientX, y: e.clientY, xPercent: -50, yPercent: -50, scale: 0.6, autoAlpha: 1, zIndex: i })
    .to(img, { scale: 1, duration: 0.5, ease: 'power3.out' })
    .to(img, { autoAlpha: 0, scale: 0.8, duration: 0.6, ease: 'power2.in' }, '+=0.3')
})
```

## 6. Spotlight / gradiente que segue o mouse (CSS + 2 linhas de JS)

```js
addEventListener('pointermove', (e) => {
  document.documentElement.style.setProperty('--mx', e.clientX + 'px')
  document.documentElement.style.setProperty('--my', e.clientY + 'px')
})
```
```css
.spot { background: radial-gradient(600px circle at var(--mx) var(--my), rgb(255 255 255 / .08), transparent 40%); }
```

## 7. Scramble de texto (sem plugin)

```js
function scramble(el, { duration = 900, chars = '!<>-_\\/[]{}—=+*^?#' } = {}) {
  const final = el.textContent, start = performance.now()
  const tick = (now) => {
    const p = Math.min((now - start) / duration, 1), reveal = Math.floor(p * final.length)
    el.textContent = final.split('').map((c, k) => k < reveal || c === ' ' ? c : chars[(Math.random() * chars.length) | 0]).join('')
    if (p < 1) requestAnimationFrame(tick)
  }
  requestAnimationFrame(tick)
}
```
(GSAP também oferece o plugin ScrambleText, agora gratuito.)

## 8. Transição de página — View Transitions (nativo)

Mesmo documento (SPA):
```js
function navigate(update) {
  if (!document.startViewTransition || matchMedia('(prefers-reduced-motion: reduce)').matches) return update()
  document.startViewTransition(update)
}
```
Entre páginas (MPA) — Chrome/Edge/Safari; Firefox ainda chegando:
```css
@view-transition { navigation: auto; }
::view-transition-old(root) { animation: 500ms cubic-bezier(.76,0,.24,1) both slide-out; }
::view-transition-new(root) { animation: 700ms cubic-bezier(.76,0,.24,1) both slide-in; }
@keyframes slide-out { to { clip-path: inset(0 0 100% 0); } }
@keyframes slide-in  { from { clip-path: inset(100% 0 0 0); } }
.card-thumb { view-transition-name: var(--vt-name); }   /* elemento compartilhado entre lista e detalhe */
```

## 9. Transição de página — overlay com GSAP (Barba.js)

```js
import barba from '@barba/core'
barba.init({ transitions: [{
  async leave() { await gsap.to('.overlay', { scaleY: 1, transformOrigin: 'bottom', duration: 0.6, ease: 'power4.inOut' }) },
  enter() { window.scrollTo(0, 0); return gsap.to('.overlay', { scaleY: 0, transformOrigin: 'top', duration: 0.6, ease: 'power4.inOut' }) },
  after() { ScrollTrigger.refresh() },   // e reinicialize animações da nova página
}]})
```

## 10. Elemento compartilhado em React (Motion)

```tsx
import { motion, AnimatePresence } from 'motion/react'
// lista
<motion.img layoutId={`photo-${id}`} src={src} />
// detalhe (outro componente/rota)
<motion.img layoutId={`photo-${id}`} src={src} transition={{ type: 'spring', stiffness: 220, damping: 30 }} />
```

## 11. Micro-interações de produto (app logado)

```css
.btn { transition: transform 160ms var(--ease-out), background-color 200ms; }
.btn:active { transform: scale(0.97); }
.toast-enter { animation: toast-in 260ms var(--ease-out) both; }
@keyframes toast-in { from { opacity: 0; translate: 0 8px; } }
```
Motion: `whileTap={{ scale: 0.97 }}`, `AnimatePresence` para entrada/saída, `layout` para listas que reordenam.
