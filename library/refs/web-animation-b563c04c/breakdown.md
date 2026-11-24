# Ferramenta de IA para imagens de produto — logo desenhado + cards em 3D — breakdown

- **id:** web-animation-b563c04c · **categoria:** web-animation · **fonte:** Pinterest; marca visível: oun
- **tipo de vídeo:** mockup cinematográfico (site rodando num notebook em cena 3D de rochas, com cortes de câmera)
- **duração:** 13.5s · **formato:** 720×900
- **resumo em uma frase:** Site preto em que o logotipo geométrico se desenha em traço, cards de imagens passam girando em 3D por cima dele e o título mistura romano com itálico.

> **Cobertura da análise:** o site aparece pequeno dentro do notebook; detalhes de UI são aproximados.

## 1. Conceito / metáfora
As imagens geradas 'voam' pelo palco; o logo é o cenário.

## 2. Linha do tempo
| t | o que acontece | técnica na origem | equivalente na web | certeza |
|---|---|---|---|---|
| 0–1.3s | logo 'oun' aparece desenhando o traço branco | load | stroke draw (DrawSVG) | certo |
| 1.3–4.9s (E1–E3) | cards de imagens (frascos, relógios) entram girando e passam em fila por cima do logo | tempo/scroll | carrossel 3D: cards com rotateY/rotateZ e translate em caminho | provável |
| 5.0s | corte de câmera (da apresentação, não do site) | edição | — | certo |
| 5.1–8.5s (E4) | título 'Revolutionizing *Product* Visualization' entra por linhas, com pilha de cards ao lado trocando | scroll | line reveal + stack de imagens trocando (crossfade/flip) | provável |
| 8.7–13.5s (E5) | grade de imagens escurecidas ao fundo e, no centro, 'Your Next Big Idea Starts Here' + campo de prompt | scroll | grid com brilho baixo + CTA central | certo |

## 3. Sistema de motion extraído
- Movimentos de câmera do mockup (zoom contínuo) mascaram o ritmo real do site: ignore os 'zoom in' da análise.
- No site: entradas de ~0.6–0.9s, ease-out.
- Cards sempre em movimento lento (idle).

## 4. Superfície visual
- Paleta: preto `#020102`, cinzas quentes (`#171415`, `#322e2e`), branco puro em logo e texto; a cor vem só das imagens.
- Tipografia: grotesca leve grande + **itálico** numa palavra-chave; UI minúscula.
- Componentes: toggle pílula no topo, botão pílula branco, lista lateral com bolinhas, campo de prompt arredondado.
- Logo: formas de traço grosso hexagonais.

## 5. Como reproduzir na web
**Stack:** GSAP (DrawSVG, SplitText) + CSS 3D ou R3F para os cards.

1. Logo em SVG com `stroke`; `gsap.from(paths, {drawSVG: 0, duration: 1.2, stagger: 0.15})`.
2. Cards: container com `perspective`; cada card numa timeline em loop com `rotationY`, `x`, `z` defasados (stagger negativo).
3. Título: `recipes-scroll.md` §3, com `<em>` na palavra em itálico.
4. Grade final: imagens com `filter: brightness(.35)` e hover clareando.

## 6. Transferível vs. específico
- **Levar:** logo como cenário; cor só nas imagens; itálico como ênfase.
- **Não levar:** a cena do notebook nas rochas (é da apresentação).
- **Bom para:** ferramentas de IA, SaaS criativo, portfólio de fotografia · **Ruim para:** serviços locais tradicionais

## 7. Custo
Complexidade 2–3/5 · sem WebGL obrigatório.

## 8. Lições
- Em mockups com câmera, separe o movimento da câmera do movimento do site antes de medir.
- Preto + branco + imagens coloridas é um sistema inteiro.
