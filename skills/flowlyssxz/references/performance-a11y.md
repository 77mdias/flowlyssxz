# Performance e acessibilidade

## Orçamento padrão
- 60fps em notebook médio; 30fps+ estável em celular intermediário.
- JS de animação (gzip): GSAP core ~25KB + ScrollTrigger ~12KB + Lenis ~4KB. Three.js ~150KB+ — carregue sob demanda (`import()`), só quando a seção 3D se aproxima.
- Modelos 3D: < 2–3MB por cena (Draco/Meshopt + KTX2). Hero não pode depender do 3D para o LCP.

## Regras de render
- Anime `transform`, `opacity`, `clip-path` (leve) e `filter` com moderação. Evite `width/height/top/left/margin`.
- `will-change` só durante a animação (GSAP faz `force3D` sozinho).
- Não leia layout (`getBoundingClientRect`) dentro de loops de animação — leia uma vez, guarde, recalcule no resize (`ScrollTrigger.refresh()`).
- WebGL: `renderer.setPixelRatio(Math.min(devicePixelRatio, 2))`; pause o loop quando o canvas sai da tela (IntersectionObserver) ou a aba fica oculta; R3F: `frameloop="demand"` quando a cena é estática.
- Vídeo de fundo: `muted playsinline loop`, poster, AV1/H.265 + H.264 fallback, < 3MB.
- Fontes: `font-display: swap`, subset. SplitText **depois** de `document.fonts.ready` (ou `autoSplit: true`).
- Imagens: AVIF/WebP, tamanhos responsivos; imagens que viram textura WebGL devem ter dimensões razoáveis (≤ 2048px).

## Primeira pintura e SEO
- Conteúdo visível sem JS. Estados iniciais escondidos só via classe adicionada por JS (`.js .reveal { opacity:0 }`) — se o JS falhar, o conteúdo aparece.
- Não segure o hero atrás de loader > 1.5s. Intro longa = só na primeira visita (sessionStorage).

## Acessibilidade
- `prefers-reduced-motion: reduce` → sem parallax, sem scrub, sem smooth scroll, sem autoplay; troque por fades curtos ou estado final direto.
  ```js
  const mm = gsap.matchMedia()
  mm.add({ full: '(prefers-reduced-motion: no-preference)', reduced: '(prefers-reduced-motion: reduce)' }, (ctx) => {
    const { full } = ctx.conditions
    if (full) { /* timelines completas */ } else { /* estados finais / fades */ }
  })
  ```
- Nada que pisque > 3 vezes por segundo. Cuidado com zooms e rotações grandes (vestibular).
- Texto dividido (SplitText) precisa continuar legível por leitores de tela (SplitText 3.13+ cuida do `aria-label`; confira).
- Cursor custom nunca substitui o foco do teclado; mantenha `:focus-visible` claro. Não esconda o cursor nativo em inputs.
- Scroll-jacking (bloquear/alterar a velocidade do scroll) só em sites de campanha, nunca em app.
- Conteúdo dentro de seções pinadas deve ser alcançável por teclado e por âncoras.

## Mobile
- Desligue/simplifique: cursor custom, hover effects, mouse parallax, shaders pesados, partículas.
- Lenis: `syncTouch` geralmente **desligado** (deixe o scroll nativo do toque).
- Pins longos no mobile cansam; encurte `end`.
- Teste num celular real; o emulador não mostra jank de GPU.
