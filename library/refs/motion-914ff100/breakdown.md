# App de moda com cards saindo da tela do celular — breakdown

- **id:** motion-914ff100 · **categoria:** motion · **fonte:** Pinterest, sem fonte identificada
- **tipo de vídeo:** render 3D em loop curto (ROI 644×912)
- **duração:** 5.2s · **formato:** 720×1280
- **resumo em uma frase:** Um celular de pé com um app de loja; os cards de produto flutuam para fora e para trás da tela em várias profundidades, enquanto as peças de roupa trocam.

## 1. Conceito / metáfora
A vitrine não cabe na tela: o conteúdo transborda do aparelho.

## 2. Linha do tempo
| t | o que acontece | técnica na origem | equivalente na web | certeza |
|---|---|---|---|---|
| 0–3.7s (E1) | câmera aproxima devagar; cards à frente e atrás do aparelho derivam; o produto central troca (casaco verde → camisa bege) e ganha luz quente por trás | dolly linear + trocas | `translateZ` por card + crossfade do item central | certo |
| 3.7–4.9s | quase parado: flutuação leve | idle | float | certo |
| 4.9–5.2s (E2) | micro-movimento de reinício do loop | — | — | provável |

## 3. Sistema de motion extraído
- Um único movimento contínuo e lento (zoom linear de ~3.4s); 70% do tempo em movimento, mas com amplitude baixa.
- Cards desfocados na frente e no fundo (DOF) criam as camadas.
- Glow quente atrás do item em destaque.

## 4. Superfície visual
- Paleta: bege/areia (`#a89d93`, `#c0b4ab`, `#dbd0c8`, `#f7f0ec`), marrom `#4d3f36`; tudo quente e claro.
- Cards brancos com raio grande e sombra suave; aparelho branco.
- Luz de janela lateral com sombras longas no piso.

## 5. Como reproduzir na web
**Stack:** CSS 3D + GSAP (ou R3F com `Html`/planos texturizados).

1. Mockup do celular em `preserve-3d`; cards com `translateZ` de -200 a +300px e `filter: blur()` proporcional à distância do plano de foco.
2. Mouse parallax no conjunto (`rotateX/Y` ±6°).
3. Item em destaque: crossfade a cada 2s + `box-shadow` quente animado.
4. Float: `gsap.to(card, {y: '+=10', duration: 2 + random, yoyo: true, repeat: -1, ease: 'sine.inOut'})`.

## 6. Transferível vs. específico
- **Levar:** conteúdo transbordando do device; blur por profundidade; destaque com luz.
- **Não levar:** o app mostrado.
- **Bom para:** landing de app, e-commerce, moda · **Ruim para:** B2B sério

## 7. Custo
Complexidade 2/5 em CSS 3D · muitos `blur` custam no mobile (use imagens pré-desfocadas).

## 8. Lições
- Blur por profundidade em CSS já dá 80% da sensação de 3D.
- Um hero de app fica mais vivo quando a UI sai do aparelho.
