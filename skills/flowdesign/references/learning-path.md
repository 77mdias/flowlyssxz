# Trilha de estudo — design por trás da codificação

Cada etapa: estude → reproduza 1 referência da biblioteca que use aquilo → escreva o breakdown → anote lições.

| # | Tema | Objetivo prático | Fontes |
|---|---|---|---|
| 1 | **Fundamentos de motion** — easing, duração, stagger, overlap, 12 princípios | Animar o mesmo card com 5 easings e sentir a diferença | easings.net, GSAP Ease Visualizer, livro *The Illusion of Life* (princípios), "Designing Interface Animation" (Val Head) |
| 2 | **CSS transitions/animations + WAAPI** | Hover states e entradas sem biblioteca | MDN |
| 3 | **GSAP core + timelines** | Intro de hero coreografada com overlap (`"<"`, `"-=0.3"`) | gsap.com/docs, GSAP Showcase |
| 4 | **ScrollTrigger + Lenis** | Pin storytelling, horizontal, parallax, batch reveals | docs GSAP, Lenis README, tutoriais Codrops |
| 5 | **Tipografia em movimento** — SplitText | Line reveal, char stagger, text fill | docs SplitText 3.13+ |
| 6 | **CSS scroll-driven + View Transitions** | Mesmos efeitos sem JS; transição entre páginas | web.dev, developer.chrome.com, MDN |
| 7 | **Layout e direção de arte** | Página estática bonita com grid tenso e tipografia forte | Awwwards, Fonts In Use, "Grid Systems" (Müller-Brockmann) |
| 8 | **Three.js fundamentos** — cena, câmera, luz, material, glTF | Objeto girando ligado ao scroll | threejs.org/manual, Three.js Journey (curso pago, referência do mercado) |
| 9 | **React Three Fiber + drei** | A mesma cena em React, com Environment e pós | docs pmndrs |
| 10 | **Shaders** — GLSL e TSL | Hover distortion numa imagem; gradiente com noise | The Book of Shaders, Shadertoy, docs TSL |
| 11 | **Blender básico para web** | Modelar/ajustar, exportar GLB otimizado | Blender Guru (donut), gltf-transform |
| 12 | **Rive / Lottie** | Botão com estados; ilustração interativa | rive.app/docs |
| 13 | **Performance e acessibilidade** | Página 60fps com reduced motion completo | `performance-a11y.md`, Chrome DevTools Performance |

**Hábito que mais acelera:** todo site que te impressionar → grave a tela → jogue no `library/_inbox` → peça o breakdown → reconstrua o efeito principal em um HTML único.
