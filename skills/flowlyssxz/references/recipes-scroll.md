# Receitas — scroll, parallax e texto

Base: `npm i gsap lenis` (GSAP 3.13+ para a API nova do SplitText). Ajuste parâmetros pelos tokens do projeto.

## 1. Setup: Lenis + GSAP ScrollTrigger sincronizados

```js
import Lenis from 'lenis'
import 'lenis/dist/lenis.css'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
gsap.registerPlugin(ScrollTrigger)

const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches
export const lenis = reduce ? null : new Lenis({ lerp: 0.1, wheelMultiplier: 1 })
if (lenis) {
  lenis.on('scroll', ScrollTrigger.update)
  gsap.ticker.add((time) => lenis.raf(time * 1000))   // um único loop para tudo
  gsap.ticker.lagSmoothing(0)
}
// elementos com scroll próprio (modais, listas): <div data-lenis-prevent>
```

`lerp` menor = mais "pesado/luxuoso" (0.06–0.08); maior = mais responsivo (0.12–0.15).

## 2. Reveals em lote (entradas ao entrar na tela)

```js
gsap.set('[data-reveal]', { y: 40, autoAlpha: 0 })
ScrollTrigger.batch('[data-reveal]', {
  start: 'top 85%',
  once: true,
  onEnter: (els) => gsap.to(els, { y: 0, autoAlpha: 1, duration: 0.9, ease: 'power3.out', stagger: 0.1, overwrite: true }),
})
```

## 3. Line reveal com máscara (SplitText 3.13+)

```js
import { SplitText } from 'gsap/SplitText'
gsap.registerPlugin(SplitText)

document.fonts.ready.then(() => {
  document.querySelectorAll('[data-split-lines]').forEach((el) => {
    SplitText.create(el, {
      type: 'lines', mask: 'lines', autoSplit: true,          // re-divide no resize/troca de fonte
      onSplit: (self) => gsap.from(self.lines, {
        yPercent: 100, duration: 1.1, ease: 'power4.out', stagger: 0.09,
        scrollTrigger: { trigger: el, start: 'top 80%', once: true },
      }),
    })
  })
})
```

## 4. Texto "acendendo" com o scroll (scrub por letra/palavra)

```js
SplitText.create('[data-fill]', {
  type: 'words,chars', autoSplit: true,
  onSplit: (self) => gsap.fromTo(self.chars, { opacity: 0.15 }, {
    opacity: 1, ease: 'none', stagger: 0.05,
    scrollTrigger: { trigger: self.elements[0], start: 'top 80%', end: 'bottom 40%', scrub: true },
  }),
})
```

## 5. Parallax por atributo (`data-speed`)

```js
// data-speed="0.8" → parece andar a 80% da velocidade do scroll; "1.2" mais rápido; "1" = normal
// Enquanto o elemento atravessa a tela, o scroll percorre d = altura da janela + altura do elemento.
// Para parecer andar a `speed`, ele precisa se deslocar (1 - speed) * d no sentido do scroll.
gsap.utils.toArray('[data-speed]').forEach((el) => {
  const speed = parseFloat(el.dataset.speed)
  const range = () => (1 - speed) * (innerHeight + el.offsetHeight) / 2
  gsap.fromTo(el, { y: () => -range() }, {
    y: () => range(), ease: 'none',
    scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: true, invalidateOnRefresh: true },
  })
})
```

Mais previsível para seções: `yPercent` fixo por camada (fundo -10, meio -25, frente -45) atrelado à mesma seção.

## 6. Parallax interno de imagem (imagem desliza dentro da moldura)

```html
<figure class="frame" style="overflow:hidden"><img class="inner" src="..." style="scale:1.2"></figure>
```
```js
gsap.utils.toArray('.frame').forEach((f) => gsap.fromTo(f.querySelector('.inner'), { yPercent: -8 }, {
  yPercent: 8, ease: 'none', scrollTrigger: { trigger: f, start: 'top bottom', end: 'bottom top', scrub: true },
}))
```

## 7. Clip reveal de imagem + scale settle

```js
gsap.from('.hero-media', {
  clipPath: 'inset(100% 0% 0% 0%)', duration: 1.4, ease: 'expo.out',
  scrollTrigger: { trigger: '.hero-media', start: 'top 75%' },
})
gsap.from('.hero-media img', { scale: 1.35, duration: 1.8, ease: 'expo.out', scrollTrigger: { trigger: '.hero-media', start: 'top 75%' } })
```

## 8. Storytelling pinado (passos dentro de uma seção fixa)

```js
const tl = gsap.timeline({
  scrollTrigger: { trigger: '.story', start: 'top top', end: '+=300%', pin: true, scrub: 1, snap: { snapTo: 'labels', duration: 0.4, ease: 'power2.inOut' } },
})
tl.addLabel('s1')
  .to('.story .media-1', { clipPath: 'inset(0 0 100% 0)', ease: 'none' })
  .from('.story .step-2', { yPercent: 100, autoAlpha: 0 }, '<')
  .addLabel('s2')
  .to('.story .media-2', { clipPath: 'inset(0 0 100% 0)', ease: 'none' })
  .from('.story .step-3', { yPercent: 100, autoAlpha: 0 }, '<')
  .addLabel('s3')
```

## 9. Seção "cortina" (a atual sobe e revela a próxima fixa)

Sem JS: a seção de baixo fica `position: sticky; top: 0` atrás; a de cima tem `z-index` maior e rola normalmente.
```css
.curtain { position: relative; z-index: 2; }
.revealed { position: sticky; top: 0; height: 100vh; z-index: 1; }
```
Refine com GSAP: escurecer/escala a seção que está saindo (`scale: 0.92, filter: brightness(.6)` scrub).

## 10. Scroll horizontal pinado

```js
const track = document.querySelector('.h-track')
gsap.to(track, {
  x: () => -(track.scrollWidth - innerWidth), ease: 'none',
  scrollTrigger: { trigger: '.h-section', start: 'top top', end: () => '+=' + (track.scrollWidth - innerWidth), pin: true, scrub: 1, invalidateOnRefresh: true },
})
```
Para animar itens *dentro* da faixa: `containerAnimation` no ScrollTrigger deles.

## 11. Sticky stack de cards

```css
.stack-card { position: sticky; top: calc(10vh + var(--i) * 24px); }
```
```js
gsap.utils.toArray('.stack-card').forEach((card, i, all) => {
  if (i === all.length - 1) return
  gsap.to(card, { scale: 0.92, filter: 'brightness(0.7)', ease: 'none',
    scrollTrigger: { trigger: all[i + 1], start: 'top bottom', end: 'top 20%', scrub: true } })
})
```

## 12. Marquee com skew pela velocidade

```js
const loop = gsap.to('.marquee__inner', { xPercent: -50, repeat: -1, duration: 20, ease: 'none' })
const skewTo = gsap.quickTo('.marquee__inner', 'skewX', { duration: 0.4, ease: 'power3' })
ScrollTrigger.create({ onUpdate: (s) => {
  const v = s.getVelocity() / 300
  skewTo(gsap.utils.clamp(-12, 12, v))
  loop.timeScale(1 + Math.abs(v) * 0.2)
}})
```
(conteúdo duplicado dentro de `.marquee__inner` para o loop ser contínuo)

## 13. Image sequence no canvas (estilo Apple)

```js
const canvas = document.querySelector('#seq'), ctx = canvas.getContext('2d')
const frames = 120, imgs = [], state = { f: 0 }
for (let i = 0; i < frames; i++) { const im = new Image(); im.src = `/seq/${String(i).padStart(4, '0')}.webp`; imgs.push(im) }
const draw = () => { const im = imgs[Math.round(state.f)]; if (im.complete) { ctx.clearRect(0, 0, canvas.width, canvas.height); ctx.drawImage(im, 0, 0, canvas.width, canvas.height) } }
imgs[0].onload = draw
gsap.to(state, { f: frames - 1, ease: 'none', snap: 'f', onUpdate: draw,
  scrollTrigger: { trigger: '.seq-section', start: 'top top', end: '+=250%', pin: true, scrub: 0.5 } })
```

## 14. CSS puro: scroll-driven (Baseline 2026) com fallback

```css
@supports (animation-timeline: view()) {
  @media (prefers-reduced-motion: no-preference) {
    .reveal { animation: reveal linear both; animation-timeline: view(); animation-range: entry 0% cover 30%; }
    .progress { position: fixed; inset: 0 0 auto; height: 3px; transform-origin: left;
                animation: grow linear both; animation-timeline: scroll(root); }
    .parallax-bg { animation: drift linear both; animation-timeline: view(); animation-range: cover; }
  }
}
@keyframes reveal { from { opacity: 0; translate: 0 40px; } to { opacity: 1; translate: 0 0; } }
@keyframes grow { from { scale: 0 1; } to { scale: 1 1; } }
@keyframes drift { from { translate: 0 -10%; } to { translate: 0 10%; } }
```
Não misture com Lenis esperando sincronia perfeita: Lenis mexe no scroll nativo, então funciona, mas o "atraso" do lerp aparece igual.

## 15. Motion (React) — scroll

```tsx
import { motion, useScroll, useTransform, useSpring } from 'motion/react'
export function HeroParallax() {
  const { scrollYProgress } = useScroll({ offset: ['start start', 'end start'] })
  const y = useTransform(scrollYProgress, [0, 1], ['0%', '30%'])
  const scale = useSpring(useTransform(scrollYProgress, [0, 1], [1, 1.15]), { stiffness: 120, damping: 30 })
  return <motion.img src="/hero.avif" style={{ y, scale }} />
}
```

## 16. React + GSAP sem vazamento

```tsx
import { useRef } from 'react'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'
gsap.registerPlugin(useGSAP)
export function Section() {
  const root = useRef<HTMLElement>(null)
  useGSAP(() => {
    gsap.from('.item', { y: 30, autoAlpha: 0, stagger: 0.1, scrollTrigger: { trigger: root.current, start: 'top 80%' } })
  }, { scope: root })   // seletores limitados à seção; tudo é revertido no unmount
  return <section ref={root}>…</section>
}
```
