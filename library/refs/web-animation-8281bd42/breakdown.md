# Oficina de carros de luxo (dark, editorial) — breakdown

- **id:** web-animation-8281bd42 · **categoria:** web-animation · **fonte:** Pinterest (site premiado com SOTD da Awwwards, nome não identificado)
- **tipo de vídeo:** mockup de apresentação (site dentro de janela de navegador, selo SOTD) — ROI 44% do quadro
- **duração:** 19.4s · **formato:** 720×900 · **ROI:** sim (x=30 y=252 658×432)
- **resumo em uma frase:** landing escura e editorial em que cada serviço vira uma "cena" pinada: o bloco anterior sobe como cortina, a imagem troca por máscara vertical e o título se acende letra a letra. Luxo vem do ritmo lento, da serifa fina e das fotos enormes.

## 1. Conceito / metáfora
"Peça por peça": o site percorre o carro por partes (Identity, Insight, Cohesion, Bodystyling, Interior, Wheels, Lighting, Exhaust, Protection) como se fosse a montagem de um carro sob medida. O fecho repete o hero ("Refuse Ordinary") visto de trás: o começo e o fim se espelham.

## 2. Linha do tempo
| t | evento | gatilho | técnica | duração | easing | stagger/offset | certeza |
|---|---|---|---|---|---|---|---|
| 0.0–0.9s | hero (3 carros) → close no carro vermelho, título "For Those…" se desfaz | scroll | zoom/scale do hero + texto saindo por char | ~0.5s | out | chars | provável |
| 0.93s | troca dura para manifesto ("We Don't Modify…") | scroll | seção nova cobrindo (o script marcou como corte) | — | — | — | provável |
| 1.4–3.0s | fotos pequenas aparecem e somem em volta do texto | **cursor** (sem scroll) | **image trail** seguindo o mouse | ~0.5s/foto | out | ~80px de distância | provável |
| 3.3–3.6s | seção "Our Approach" entra por baixo com close de costura | scroll | section curtain + parallax interno | scrub | none | — | certo |
| 4.1–5.1s (E4) | bloco escuro sobe e revela "Identity" **fixa por baixo**; imagem central sobe mais devagar | scroll | **pin + section curtain**; card com parallax; fundo = a mesma foto desfocada | scrub | none (cauda do smooth scroll) | — | certo (strip) |
| 4.5–5.0s | título "Identity" acende da esquerda p/ direita | scroll | **text fill por char** (opacity scrub) | scrub | none | char | certo |
| 5.3–10.7s | Insight → Cohesion → Bodystyling → Interior → Wheels → Lighting → Exhaust → Protection | scroll | mesmo módulo repetido: layout split (texto esq./imagem dir.), imagem trocando com **clip vertical**, título com fill | ~0.8s cada | inOut/out | — | provável |
| 11.3–13.0s (E11) | carro visto de cima atravessa a seção de baixo p/ cima; "Ordinary" → "Ends Here" | scroll | **seção pinada + objeto em translateY scrub** (o script classificou errado como "rotação") | scrub | none | — | certo (sheets) |
| 13.3–15.4s | farol em full-bleed sobe sobre "Ends Here"; "Previous Builds" → "Available Stock" | scroll | clip reveal de baixo p/ cima + crossfade de imagens de fundo | ~0.9s | power3.inOut | — | provável |
| 16–19s | footer "Refuse Ordinary" com carros de costas, fade out | scroll | fade + parallax leve | ~1s | out | — | provável |

## 3. Sistema de motion extraído
- Durações: transições de seção ~0.8–1.0s; quase tudo atrelado ao scroll (scrub).
- Easing: linear no scrub + suavização do smooth scroll (cauda tipo expo.out) → sensação "pesada e cara".
- Distâncias: grandes (seção inteira); poucas animações pequenas.
- Stagger: por letra no fill dos títulos.
- Smooth scroll: **sim** (provável Lenis, lerp ~0.08–0.1).
- Ritmo: calmo e repetitivo de propósito — o mesmo módulo cria previsibilidade luxuosa.

## 4. Camadas e profundidade
- Fundo: foto da seção ampliada e desfocada (blur forte) — dá profundidade sem 3D.
- Meio: card de imagem nítida com parallax interno.
- Frente: texto (título serifado + parágrafo pequeno + CTA "Start your project").
- Pins: cada seção de serviço é fixa enquanto a anterior sai (cortina). Tudo 2.5D, **sem WebGL aparente**.

## 5. Superfície visual
- Paleta: quase preto (`#130d12`, `#050205`), cinzas quentes (`#4d4649`, `#302328`), texto off-white (`#b5a7a4`), acento vermelho só nas fotos (`#b10b13`).
- Tipografia: serifada fina de alto contraste nos títulos (estilo editorial), sans pequena no corpo, labels/CTA em caixa alta minúscula.
- Layout: split assimétrico, muito respiro, imagens grandes, contador "01/03" discreto.
- Textura: escuridão + reflexos de carro fazem o papel de textura; sem grão.

## 6. Stack provável
Lenis + GSAP ScrollTrigger (pin, scrub) + SplitText (chars para o fill) + image trail em GSAP. Alternativa sem JS para cortina: `position: sticky`. Transição de página não aparece.

## 7. Receita de implementação
1. Smooth scroll: `recipes-scroll.md` §1 (lerp 0.08).
2. Cortina: `recipes-scroll.md` §9 (sticky) + escurecer a seção que sai.
3. Imagem trocando no módulo: `clip-path: inset(100% 0 0 0) → inset(0)` scrub na imagem nova, por cima da antiga.
4. Título com fill por char: `recipes-scroll.md` §4.
5. Image trail no manifesto: `recipes-interaction.md` §5.
6. Carro atravessando: seção pinada (`end: '+=150%'`), `gsap.fromTo(car, {yPercent: 60}, {yPercent: -120, ease: 'none', scrub: true})`, troca de texto no meio da timeline.
7. Fundo desfocado: a mesma imagem em `filter: blur(40px) brightness(.5); scale: 1.2` atrás do card.

## 8. Transferível vs. específico
- **Levar:** módulo de serviço repetível (cortina + clip + text fill); fundo = foto desfocada; fecho que espelha o hero; image trail num manifesto curto.
- **Não levar:** fotos, nomes, o "carro atravessando" literal.
- **Bom para:** serviços premium com várias etapas/categorias (estética/ateliê, arquitetura, joalheria, consultoria, imóveis de alto padrão).
- **Ruim para:** produto que precisa de leitura rápida/comparação (SaaS de preço, e-commerce de catálogo), app logado.

## 9. Custo
Complexidade 3/5 · leve (sem WebGL) · mobile: encurtar pins e desligar o image trail · acessibilidade: textos reais no DOM, reduced motion → seções empilhadas sem pin.

## 10. Lições
- Repetir um módulo bem feito é mais "premium" que inventar um efeito por seção.
- Fundo desfocado da própria foto resolve profundidade e paleta de uma vez.
- Espelhar abertura e fechamento dá sensação de narrativa completa.
- A análise automática errou o E11 (disse rotação): **sempre confirme com as imagens**.
