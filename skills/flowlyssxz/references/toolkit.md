# Toolkit — o que o mercado usa para motion, scroll, parallax e 3D na web

_Estado verificado em nov/2026. Antes de instalar, confira a versão atual no npm (`npm view <pacote> version`)._

## Árvore de decisão rápida

```
O que você precisa?
├─ Site de marketing / landing com narrativa no scroll
│    → Lenis (smooth scroll) + GSAP ScrollTrigger (+ SplitText p/ texto)
│    └─ tem 3D/shader? → + Three.js (vanilla) ou React Three Fiber (se o projeto é React)
├─ App React (produto logado): micro-interações, listas, modais, layout que muda
│    → Motion (motion.dev) — AnimatePresence, layout/layoutId, springs, gestos
├─ Reveals, parallax leve, barra de progresso, sem JS
│    → CSS scroll-driven animations (animation-timeline: scroll()/view()) com @supports
├─ Transição entre páginas/rotas
│    → View Transitions API (nativo) → fallback/controle fino: Barba.js, Swup, ou o router do framework
├─ Objeto 3D interativo sem programar 3D (protótipo rápido)
│    → Spline (exporta embed/runtime) — migre para Three/R3F quando precisar de controle e performance
├─ Ilustração/ícone/mascote interativo com estados (hover, click, loading)
│    → Rive (state machines) | animação linear vinda do After Effects → Lottie/dotLottie
├─ Efeito de shader em fundo/imagem (gradiente vivo, distorção, partículas, grão)
│    → Three.js/OGL com shader próprio | sem código: Unicorn Studio (embed)
└─ Coreografar uma cena 3D longa num editor de timeline
     → Theatre.js (cuidado: projeto em transição p/ 1.0, fixe versão) ou GSAP timeline + lil-gui
```

## 1. Motores de animação (tween/timeline)

| Ferramenta | Para quê | Notas 2026 |
|---|---|---|
| **GSAP 3** (`gsap`) | Padrão da indústria em sites premiados. Timelines, controle total, plugins | Desde 2025, 100% gratuito (Webflow), **incluindo** os ex-plugins pagos: SplitText, MorphSVG, DrawSVG, ScrollSmoother, Inertia, CustomEase… Versão 3.15.x. Em React: `@gsap/react` (`useGSAP`) |
| **Motion** (`motion`, ex-Framer Motion) | React/Vue/JS. Declarativo, springs, `layout`, `AnimatePresence`, gestos, `useScroll` | Pacote `motion` (import `motion/react`), v13.x. `framer-motion` ainda publicado por compatibilidade. Motion+ é pacote pago de extras |
| **anime.js v4** | Alternativa leve ao GSAP, boa API de timeline e stagger | Bom para projetos pequenos |
| **Web Animations API** | `el.animate()` nativo, sem dependência | Ótimo para micro-interações e para entender a base |
| **CSS transitions/animations** | Hover, estados, entradas simples | Sempre a primeira opção para coisas simples |

## 2. Scroll

| Ferramenta | Para quê | Notas |
|---|---|---|
| **Lenis** (`lenis`, darkroom.engineering) | Smooth scroll por lerp sobre o scroll **nativo** (sticky, âncoras e acessibilidade continuam funcionando) | v1.3.x. Integração oficial com GSAP ticker/ScrollTrigger; pacotes p/ React e Vue; plugin de snap |
| **GSAP ScrollTrigger** | Pin, scrub, gatilhos, seções horizontais, batch | O mais usado em sites de alto nível |
| **GSAP ScrollSmoother** | Smooth scroll + `data-speed`/`data-lag` (parallax declarativo) | Agora gratuito; alternativa ao Lenis quando tudo é GSAP |
| **CSS scroll-driven animations** | `animation-timeline: scroll()` / `view()` — roda fora da main thread | **Baseline desde out/2026** (Chrome/Edge 115, Safari 26, Firefox 159). Use `@supports` para navegadores antigos |
| **Motion `scroll()` / `useScroll`** | Scroll-linked no ecossistema Motion | Usa ScrollTimeline nativo quando disponível |
| **Locomotive Scroll v5** | Atributos `data-scroll` + Lenis por baixo | Reescrito sobre Lenis |

## 3. 3D, WebGL e WebGPU

| Ferramenta | Para quê | Notas |
|---|---|---|
| **Three.js** | O padrão de 3D na web | **WebGPURenderer é o recomendado desde r182** (fallback automático p/ WebGL2). Shaders novos em **TSL** (compila p/ WGSL e GLSL). Import `three/webgpu`, `three/tsl`. Release atual ~r185. WebGPU funciona em Chrome/Edge, Safari 26 e Firefox (Windows/macOS Apple Silicon; Linux/Android ainda não estável) |
| **React Three Fiber** + **drei** + **postprocessing** | Three.js declarativo em React; drei = centenas de helpers (ScrollControls, Environment, useGLTF, MeshTransmissionMaterial…) | v9 estável; v10 (WebGPU/TSL nativo) em alpha — fixe versões |
| **OGL** | WebGL minimalista (~sem abstrações) | Ótimo para efeitos de imagem/shader leves |
| **Babylon.js 8** | Motor completo (física, XR, editor) | WebGPU de primeira classe |
| **PlayCanvas** | Motor + editor colaborativo | Bom para experiências tipo jogo |
| **TresJS** (Vue) / **Threlte** (Svelte) | Equivalentes ao R3F | |
| **Spline** | Editor 3D no navegador, estados/eventos sem código, export p/ web | Ótimo para protótipo e hero 3D simples; menos controle/perf que código |
| **Needle Engine** | Unity/Blender → web | |
| **Gaussian splats** (Spark, three r186+) | Cenas fotorreais capturadas | Tendência; pesado, use com critério |

**Pipeline de assets 3D:** Blender → glTF/GLB → `gltf-transform` (Draco/Meshopt + texturas KTX2) → `gltfjsx` (gera componente R3F). Texturas: KTX2/Basis. Ambiente: HDRI leve (Poly Haven).

## 4. Shaders e efeitos visuais

- **GLSL** (WebGLRenderer, OGL) e **TSL** (Three WebGPU). Base: *The Book of Shaders*, Shadertoy para estudo.
- Efeitos clássicos de "site premiado": distorção de imagem no hover, RGB shift, noise/grain, displacement em transição, metaballs, fluid/cursor trail, gradiente animado com noise, partículas instanciadas.
- **Unicorn Studio**: editor no-code de efeitos WebGL (gradientes, distorção, partículas, reação ao cursor) com embed — bom para prototipar o *look* antes de codar.
- Pós-processamento: bloom, DOF, chromatic aberration, film grain (pmndrs `postprocessing` / RenderPipeline do Three WebGPU).

## 5. Animação vetorial 2D

| Ferramenta | Para quê |
|---|---|
| **Rive** | Animações interativas com **state machine** (botões, mascotes, onboarding, loaders), runtime leve web/mobile |
| **Lottie / dotLottie** | Exportar animação do After Effects (Bodymovin) — linear, sem lógica |
| **SVG + GSAP** (DrawSVG, MorphSVG, MotionPath) | Traços desenhando, morph de formas, objetos seguindo caminho |

## 6. Transições de página

- **View Transitions API**: same-document é Baseline (Firefox 144+, Chrome 111+, Safari 18+). Cross-document (MPA, `@view-transition { navigation: auto; }`) funciona em Chrome/Edge e Safari; Firefox em andamento (foco do Interop 2026). Astro e Next têm suporte integrado.
- **Barba.js / Swup / Taxi.js**: transições controladas por JS (com GSAP), comuns em sites premiados.

## 7. Texto

- **GSAP SplitText** (grátis, reescrito na 3.13: `mask`, `autoSplit`, acessível com aria). Linhas com máscara, chars com stagger, scramble (ScrambleText).
- **Splitting.js**: alternativa leve, só divide (você anima com CSS/var).

## 8. Ferramentas de desenvolvimento

- Ajuste fino ao vivo: **lil-gui**, **Tweakpane**, **leva** (R3F).
- Performance: **stats-gl**, **r3f-perf**, Chrome Performance panel, Spector.js (WebGL).
- Visualizar easings: **GSAP Ease Visualizer**, cubic-bezier.com, easings.net.

## 9. Fontes de referência (para alimentar a biblioteca)

Awwwards (SOTD/Developer award), **Codrops/Tympanus** (tutoriais com código das técnicas da moda), GSAP Showcase,
Lenis Showcase, Godly, Land-book, SiteInspire, Mobbin (apps), Dribbble/Behance (motion de UI), Pinterest, CodePen
(busque por técnica), Three.js examples e o showcase do R3F/pmndrs.

## Stack padrão sugerida para seus projetos

- **Site/landing com motion forte:** Vite ou Astro + TypeScript + Lenis + GSAP (ScrollTrigger, SplitText) + Three.js (WebGPURenderer) quando houver 3D.
- **Produto React/Next:** Motion para UI + GSAP pontual para storytelling + R3F se houver 3D.
- **Protótipo de ideia:** HTML único com GSAP via CDN — rápido para validar ritmo com o usuário.
