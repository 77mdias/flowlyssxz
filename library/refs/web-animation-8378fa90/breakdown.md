# Tecnologia verde — toro 3D que vira musgo + tipografia gigante — breakdown

- **id:** web-animation-8378fa90 · **categoria:** web-animation · **fonte:** Pinterest; marca visível: GreenMotive
- **tipo de vídeo:** mockup de apresentação (site em cartão flutuando sobre vídeo de paisagem com fumaça; ROI 568×694)
- **duração:** 22.1s · **formato:** 576×1024
- **resumo em uma frase:** Site claro e limpo em que um toro 3D gira e troca de material (cinza fosco → coberto de musgo), seguido de manifesto em caixa alta e uma palavra gigante sobre foto.

## 1. Conceito / metáfora
'Tecnologia que vira natureza': a forma geométrica industrial é tomada pelo verde conforme você avança.

## 2. Linha do tempo
| t | o que acontece | técnica na origem | equivalente na web | certeza |
|---|---|---|---|---|
| 0–4.2s (E1) | hero: título 'Empowering sustainable progress', toro girando; o musgo cresce sobre o cinza | tempo/scroll | R3F: mistura de dois materiais por máscara de ruído animada | provável |
| 4.4–9s | toro já todo verde continua girando e inclinando | tempo | rotação idle | certo |
| 9–10.2s (E3) | conteúdo sobe; manifesto grande em caixa alta ('Our mission is…') aparece com fade por linhas | scroll | line reveal / text fill | provável |
| 12.3–13.4s (E4) | seção com logotipo central e 3 cards de imagem desfocada com ícone | scroll | fade + blur-in dos cards | provável |
| 15.4–19s (E5) | foto panorâmica em faixa no topo e a palavra 'Nature' enorme; campo de e-mail + botão | scroll | clip reveal da foto + título display entrando por opacidade | provável |

## 3. Sistema de motion extraído
- Ritmo calmo: eventos de 1–4s, easing suave (ease-out leve / inOut).
- Texto entra por opacidade (cinza → preto), sem pulo.
- Um herói 3D no topo; o resto é tipografia.

## 4. Superfície visual
- Paleta: off-white `#e9e7e8`, grafite `#20201f`/`#3d3c37`, verdes-oliva e areia (`#636058`, `#8d887c`, `#bcb7ae`).
- Tipografia: grotesca neo (tipo Helvetica Now/Neue Montreal) — caixa alta média no manifesto, display enorme em caixa mista em 'Nature'.
- Componentes: nav pílula segmentada (ativo verde-claro), tags pílula, botão escuro arredondado, input escuro largo com botão claro ao lado, cards com imagem desfocada + ícone.
- Raios médios (8–12px) no cartão do site; muita área vazia.

## 5. Como reproduzir na web
**Stack:** Lenis + GSAP + React Three Fiber (ou Three puro).

1. Toro: `TorusGeometry` + material com `mix(cinza, musgo, smoothstep(noise + progresso))`; para o relevo do musgo, displacement leve ou instâncias de 'tufos'.
2. Progresso do crescimento ligado ao tempo no load e/ou ao scroll.
3. Manifesto: `recipes-scroll.md` §4 (fill por palavra).
4. Palavra gigante: `font-size: clamp(6rem, 22vw, 20rem)`; foto com `recipes-scroll.md` §7.

## 6. Transferível vs. específico
- **Levar:** transição de material como metáfora do negócio; manifesto em fill; palavra-tema gigante.
- **Não levar:** o toro + musgo literal.
- **Bom para:** sustentabilidade, energia, agro, arquitetura, bem-estar · **Ruim para:** produtos com muita informação por tela

## 7. Custo
Complexidade 3/5 · shader de mistura simples · fallback: vídeo/imagem do toro no mobile fraco.

## 8. Lições
- Transição de material conta uma história inteira sem texto.
- Fundo de apresentação (paisagem + fumaça) não faz parte do site: a ROI separa isso.
