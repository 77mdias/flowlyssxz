# Anel de moedas cromadas girando (loop) — breakdown

- **id:** motion-a0346a8d · **categoria:** motion · **fonte:** Pinterest, sem fonte identificada
- **tipo de vídeo:** loop 3D contínuo (ROI 618×664)
- **duração:** 13.2s · **formato:** 720×1280
- **resumo em uma frase:** Doze moedas cromadas dispostas em círculo, cada uma girando no próprio eixo, com o anel inteiro em rotação lenta sobre preto.

## 1. Conceito / metáfora
Circulação: valor em movimento constante.

## 2. Linha do tempo
| t | o que acontece | técnica na origem | equivalente na web | certeza |
|---|---|---|---|---|
| 0–13.1s (E1) | rotação linear contínua, sem início nem fim; reflexos varrem as moedas | loop linear | rotação por `delta` no frame loop | certo |

## 3. Sistema de motion extraído
- 100% do tempo em movimento, velocidade constante (linear).
- Duas rotações sobrepostas: anel (lenta) e moedas (mais rápida, defasada por índice).
- Loop perfeito.

## 4. Superfície visual
- Preto puro `#010001`; cromado em cinzas (`#272326` → `#ededeb`).
- Iluminação de estúdio com reflexos fortes (HDRI), sem cor.

## 5. Como reproduzir na web
**Stack:** R3F + drei `Environment`.

1. `coins.map((_, i) => position = [cos(a) * R, sin(a) * R, 0])` com `a = i / n * 2π`.
2. `useFrame((_, dt) => { ring.rotation.z += dt * .15; coins.forEach((c, i) => c.rotation.y += dt * (1 + i * .05)) })`.
3. Material `metalness: 1, roughness: .15` + HDRI de estúdio.
4. Mouse parallax leve na câmera.

## 6. Transferível vs. específico
- **Levar:** loop de hero leve e hipnótico; rotação dupla; cromado sobre preto.
- **Não levar:** o símbolo da moeda.
- **Bom para:** fintech, cripto, pagamentos, fundos de seção · **Ruim para:** marcas quentes

## 7. Custo
Complexidade 1–2/5 · 12 meshes, baratíssimo.

## 8. Lições
- Movimento linear infinito é 'ambiente', não 'evento': não disputa atenção com o texto.
- A análise automática acertou aqui (rotação linear, 1 evento): loops simples são o caso fácil.
