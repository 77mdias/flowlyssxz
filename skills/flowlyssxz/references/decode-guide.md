# Guia de decodificação — de sinais para técnicas

O script entrega **sinais**. Você entrega **técnicas**. Este guia é a ponte.

## 0. Primeiro: que tipo de vídeo é?

| Tipo | Como reconhecer | Consequência |
|---|---|---|
| **Gravação de site real** | barra do navegador, cursor, rolagem com cauda | Mistura scroll do usuário + animação do site. Separe os dois |
| **Mockup de apresentação** | site dentro de moldura/navegador/celular, fundo neutro, selo (SOTD, Awwwards) | ROI detectada. Às vezes acelerado/editado: durações podem não ser reais |
| **Conceito Dribbble/Behance** | perfeito demais, sem cursor, câmera "de After Effects" | Pode ser impossível ou caro na web. Avalie viabilidade antes |
| **Motion reel / 3D render** | iluminação de render offline, DOF cinematográfico | Extraia ritmo, composição e paleta; a técnica web será outra (shader/3D realtime/vídeo) |
| **Compilação** | muitos cortes de cena | Trate cada cena como referência separada |

## 1. Sinais globais (timeline.png e tabela de eventos)

| Sinal | Leitura provável |
|---|---|
| vel. y coerente, área ≥ 60%, decaimento suave no fim | **Scroll** (do usuário). Cauda longa e "macia" ⇒ **smooth scroll por lerp** (Lenis/ScrollSmoother). Parada seca ⇒ scroll nativo |
| eventos de scroll com `layered_speeds` | **Parallax**: as razões por célula ≈ velocidade relativa de cada camada (1 = acompanha o scroll; 0.5 = metade; >1 = mais rápido; negativo = sentido oposto) |
| `pinned_region` (célula ≈ 0 enquanto outras ≈ 1) | **Pin/sticky**: uma camada fica parada e a outra passa por cima/por baixo (stack de seções, cortina, storytelling pinado) |
| vel. x coerente durante scroll vertical do usuário | **Seção horizontal pinada** (ScrollTrigger pin + `x` scrub) |
| zoom consistente | `scale` scrubado, **câmera 3D dolly**, ou transição "zoom-through" (entra numa imagem) |
| rotação consistente | objeto 3D girando (`rotation.y` atrelado a tempo/scroll) |
| "complexo" com área grande | 3D com perspectiva, morph, shader, distorção, troca de seção com várias camadas |
| "local" com área pequena | Reveal, hover, micro-interação, troca de texto |
| corte de cena (hist) | Transição de página brusca, troca de slide, ou corte de edição do vídeo |
| eventos curtos e regulares (≈ mesmo intervalo) | Carrossel/autoplay, marquee, loop |
| atividade contínua de baixa amplitude | Fundo vivo: gradiente/noise animado, partículas, vídeo de fundo |

## 2. Sinais visuais (sheets, keyframes, strips)

| Você vê | Técnica provável | Implementação |
|---|---|---|
| Borda reta e nítida "varrendo" uma imagem/bloco | **Mask/clip reveal** | `clip-path: inset()` ou wrapper `overflow:hidden` + `yPercent` |
| Linhas de texto subindo de dentro de "nada" | **Line reveal com máscara** | SplitText `type:'lines', mask:'lines'` + `yPercent:100 → 0` + stagger |
| Letras aparecendo uma a uma / acendendo | **Char stagger** (tempo) ou **char opacity scrub** (scroll) | SplitText chars + stagger ~0.02–0.04s; ou `opacity` com `scrub` |
| Letras trocando por caracteres aleatórios | **Scramble/decode text** | GSAP ScrambleText ou script próprio |
| Imagem maior que o quadro deslizando dentro dele | **Parallax interno** | imagem `scale:1.2` + `yPercent` scrub dentro de container com overflow hidden |
| Imagem começa grande e "assenta" | **Scale-down reveal** | `scale:1.3 → 1` + clip-path, ease expo.out |
| Elementos com blur que vira nitidez | **Blur-in** | `filter: blur(10px) → 0` (cuidado com performance; prefira poucos elementos) |
| Franjas vermelho/azul nas bordas, ondulação | **Shader**: RGB shift / displacement | plano WebGL com textura da imagem; uniform de velocidade do scroll/hover |
| Imagens seguindo o cursor, deixando rastro | **Image trail** | pool de imgs posicionadas no `mousemove` com GSAP, fade/scale |
| Cursor custom (círculo que segue com atraso) | **Cursor lerp** | `gsap.quickTo` ou lerp no rAF |
| Botão "puxado" pelo cursor | **Magnetic button** | deslocamento proporcional à distância do ponteiro |
| Card inclinando com o mouse | **Tilt 3D** | `rotateX/rotateY` + `perspective` |
| Profundidade real, luz especular, reflexo mudando | **3D realtime** (WebGL) | Three/R3F; HDRI; câmera ligada ao scroll |
| Profundidade "chapada" em camadas | **2.5D** (camadas DOM com velocidades/translateZ) | parallax de camadas, `perspective` CSS |
| Sequência perfeita de produto girando | **Image sequence** em canvas (estilo Apple) ou vídeo scrubado | frames WebP/AVIF desenhados conforme scroll |
| Grão/ruído estático por cima | **Grain overlay** | textura noise em `::after` animada por steps, ou shader |
| Texto gigante passando em loop | **Marquee**; inclinando com a velocidade ⇒ **velocity skew** | GSAP + `ScrollTrigger.getVelocity()` |
| Cards empilhando ao rolar | **Sticky stack** | `position: sticky` com `top` crescente + scale/brightness no anterior |
| Elemento compartilhado viajando entre telas | **Shared element / FLIP** | View Transitions (`view-transition-name`) ou GSAP Flip / Motion `layoutId` |
| Tela inteira coberta por painel e revelada | **Overlay wipe** (page transition) | Barba/Swup + GSAP, ou View Transitions com `clip-path` |
| Números contando | **Counter** | tween de objeto `{v:0}` com `onUpdate`; `snap` |
| Traço de SVG se desenhando | **Line draw** | DrawSVG ou `stroke-dashoffset` |

## 3. Lendo easing e duração pelo strip

Faça um strip de 12–16 frames cobrindo o evento (`frames.py --strip`). Observe o **espaçamento** do elemento entre frames:

- Grandes saltos no início, frames quase iguais no fim → **ease-out** (power3/expo.out). É o padrão de reveals premium.
- Frames iguais nas duas pontas, salto no meio → **inOut** (power2–4.inOut, expo.inOut). Típico de transições de página e câmera.
- Espaçamento uniforme → **linear** (`ease:'none'`): quase sempre significa **scrub atrelado ao scroll**, ou marquee.
- Passa do ponto e volta → **back.out / spring**.
- Saída acelerando (pequeno → grande) → **ease-in**: usado em elementos que *saem* da tela.

Duração: conte frames do primeiro ao último movimento e divida pelo fps do vídeo. Referências típicas:
micro 120–250ms · UI 250–450ms · reveal 600–1200ms · transição de página 800–1600ms · hero/intro 1.2–3s.

**Stagger**: diferença de tempo entre o início de elementos irmãos (cards, letras, linhas). Letras 15–40ms, linhas 60–120ms, cards 80–150ms.

## 4. Separando scroll do usuário vs. animação do site

- Se o conteúdo inteiro sobe junto (área alta, coerência alta) → é scroll; não é "animação".
- O que se move **diferente** do scroll dentro de um evento de scroll é a animação do site (camadas, pins, reveals).
- Animações que acontecem com scroll parado → disparadas por tempo (entrada/toggle), hover ou clique.
- Animação que anda junto e para junto com o scroll → **scrub**. Animação que, uma vez iniciada, termina sozinha → **toggle** (`toggleActions`).

## 5. Descobrindo a stack de um site vivo

1. Abra a URL no navegador disponível, rode no console: `Object.keys(window).filter(k=>/gsap|ScrollTrigger|lenis|THREE|Barba|swup|Spline|rive|lottie/i.test(k))`.
2. Veja scripts carregados e o bundle (nomes como `ScrollTrigger`, `lenis`, `three.module`, `@react-three`, `splinetool`, `rive.wasm`).
3. Classes reveladoras: `.lenis`, `data-lenis-prevent`, `data-scroll`, `[data-speed]`, `pin-spacer` (ScrollTrigger pin), `canvas` em full-screen (WebGL), `data-barba`.
4. Framework: `__NEXT_DATA__`, `astro-island`, `data-v-` (Vue), `nuxt`, `webflow` (Webflow + GSAP interactions).

## 6. Grau de certeza

Escreva sempre: **certo** (visto claramente + confirmado no strip/código) · **provável** (sinais concordam) · **hipótese** (há alternativas — liste-as). Isso ensina e evita copiar errado.
