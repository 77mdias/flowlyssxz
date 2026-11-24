# Interfaces explodidas em camadas 3D (4 produtos) — breakdown

- **id:** motion-25466642 · **categoria:** motion · **fonte:** Pinterest, sem fonte identificada
- **tipo de vídeo:** motion reel / render 3D com cortes (4 cenas)
- **duração:** 8.0s · **formato:** 720×1280
- **resumo em uma frase:** Telas de apps flutuando em perspectiva isométrica, com as camadas da interface se separando no eixo Z; no fim, as peças voam e se montam num site visto de frente.

## 1. Conceito / metáfora
'O que há por baixo da tela': mostrar a interface como um sanduíche de camadas.

## 2. Linha do tempo
| t | o que acontece | técnica na origem | equivalente na web | certeza |
|---|---|---|---|---|
| 0–1.5s | app laranja: camadas se afastam umas das outras, botão com glow | keyframes 3D | `translateZ` por camada em container com `rotateX/rotateZ` | certo |
| 1.6–3.3s | corte; app de loja bege: cards de tênis saltam da tela e ganham sombra | keyframes 3D | stagger de `translateZ` + sombra crescendo | certo |
| 3.4–5.0s | dissolução em partículas → dashboard escuro com neon rosa/ciano em camadas | partículas | transição por partículas (WebGL) ou simples crossfade | provável |
| 5.1–6.9s (E6) | telas claras de móveis; peças voam, giram e se encaixam num site frontal | câmera + layout | FLIP: de posições 3D espalhadas para o layout final (sine.inOut ~1.1s) | certo |
| 7–8s | site montado, parado, com reflexo no chão | — | `-webkit-box-reflect` ou cópia espelhada com máscara | certo |

## 3. Sistema de motion extraído
- Durações curtas (0.2–0.6s) dentro de cada cena, 1.1s na montagem final.
- Easing suave nas separações (sine.inOut), cortes secos entre cenas.
- Leve flutuação idle em todas as camadas.

## 4. Superfície visual
- Fundo cinza-escuro de estúdio com vinheta; cada cena tem paleta própria (laranja, bege, neon, off-white).
- Cantos bem arredondados, sombras longas, reflexo no piso.
- Glow nos botões da cena laranja e nas bordas da cena neon.

## 5. Como reproduzir na web
**Stack:** CSS 3D (`perspective`, `transform-style: preserve-3d`) + GSAP; R3F só se quiser partículas e reflexo real.

1. Monte a tela como camadas absolutas dentro de um wrapper `rotateX(55deg) rotateZ(-35deg)`.
2. Timeline: `gsap.to(layers, {z: i => i * 60, stagger: .06, ease: 'sine.inOut'})`, ligada ao scroll ou ao hover.
3. Montagem final: GSAP Flip (`Flip.from(state)`) de posições espalhadas para o grid.
4. Mouse parallax leve no wrapper (`recipes-interaction.md` §3).

## 6. Transferível vs. específico
- **Levar:** vista explodida de UI para explicar um produto digital; montagem das peças como fecho.
- **Não levar:** as quatro identidades visuais juntas.
- **Bom para:** SaaS, apps, agências, estudos de caso · **Ruim para:** marcas sem interface para mostrar

## 7. Custo
Complexidade 2/5 em CSS 3D · leve.

## 8. Lições
- Separar camadas no Z transforma um print de tela em objeto.
- É ótimo para a seção 'como funciona' de um SaaS.
