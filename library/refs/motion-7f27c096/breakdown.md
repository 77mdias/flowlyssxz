# Filme de skincare em lilás — líquido de vidro, macro e flores — breakdown

- **id:** motion-7f27c096 · **categoria:** motion · **fonte:** Pinterest; marca visível: Fenty Beauty
- **tipo de vídeo:** filme publicitário 3D com muitos cortes (14 cenas)
- **duração:** 26.8s · **formato:** 720×1280
- **resumo em uma frase:** Gota de vidro que se deforma, macro do creme em espiral, embalagem girando, lavanda em close e packshot final sobre espelho d'água, tudo em tons de lilás.

## 1. Conceito / metáfora
Ingrediente → textura → produto: a fórmula contada por materiais.

## 2. Linha do tempo
| t | o que acontece | técnica na origem | equivalente na web | certeza |
|---|---|---|---|---|
| 0–2.6s | esfera de vidro sobre água se deforma em respingo | simulação de fluido | blob com MeshTransmissionMaterial + noise | provável |
| 2.6–6.3s | macros do líquido e do creme em espiral dentro do frasco | cortes + rotação | vídeo/sequência | certo |
| 6.3–10.5s | tampa com monograma em relevo; frasco sai da água girando | câmera | — | certo |
| 10.5–13s | macro com nome do produto e benefícios em caixa alta sobre o creme | texto integrado à cena | texto DOM sobre vídeo | certo |
| 14.5–21.4s | frasco flutuando; lavanda em close; flores e pétalas voando | partículas | PNGs/instâncias com parallax | certo |
| 21.5–26.8s | packshot sobre espelho d'água; monograma branco em gradiente | zoom-out + fade | scale settle + fade | certo |

## 3. Sistema de motion extraído
- Um corte a cada ~1.9s; dentro de cada plano, movimento lento e linear.
- Easing suave (sine/power1) nos zooms.
- Fecho calmo de 3s no logotipo.

## 4. Superfície visual
- Paleta lilás em 6 tons: `#e8dfef`, `#d4c7e5`, `#b5a7d6`, `#9280be`, `#635092`, `#2d1f55`.
- Materiais: vidro, creme fosco, plástico branco acetinado, pelúcia das flores.
- Tipografia: sans em caixa alta com tracking aberto; monograma serifado.

## 5. Como reproduzir na web
**Stack:** Vídeo/sequência + GSAP; blob de vidro em R3F se for interativo.

1. Hero: blob com `MeshTransmissionMaterial` e vértices deslocados por noise (reage ao mouse).
2. Seções seguintes: vídeo scrubado ou planos em crossfade.
3. Pétalas: 20–30 PNGs com `data-speed` diferentes e rotação idle.
4. Tokens: rampa de 6 lilases + branco; sombras coloridas (nunca cinza).

## 6. Transferível vs. específico
- **Levar:** rampa monocromática suave; blob de vidro interativo; pétalas em parallax.
- **Não levar:** marca, embalagem.
- **Bom para:** beleza, skincare, estética, bem-estar · **Ruim para:** tech/industrial

## 7. Custo
Complexidade 2/5 com vídeo · transmissão de vidro é cara no mobile.

## 8. Lições
- Sombras e fundos tingidos da cor da marca deixam tudo mais 'caro' que cinza neutro.
- Material é linguagem: vidro = pureza, fosco = cuidado.
