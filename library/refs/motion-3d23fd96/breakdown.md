# Filme de produto monocromático vermelho (frasco cosmético) — breakdown

- **id:** motion-3d23fd96 · **categoria:** motion · **fonte:** Pinterest; marca visível: Cellcosmet UltraCell Intensive-XT
- **tipo de vídeo:** filme publicitário 3D com cortes (9 cenas)
- **duração:** 16.1s · **formato:** 720×1280
- **resumo em uma frase:** Tudo vermelho: aproximação macro no frasco, mergulho no líquido com bolhas e uma palavra-benefício por cena, volta ao frasco e fecha no logotipo.

## 1. Conceito / metáfora
Entrar no produto: de fora (embalagem) para dentro (fórmula) e de volta.

## 2. Linha do tempo
| t | o que acontece | técnica na origem | equivalente na web | certeza |
|---|---|---|---|---|
| 0–1.1s | frasco pequeno no escuro, luz sobe | dolly-in | fade de luz + scale | certo |
| 1.1–4.4s (E1–E2) | macro no rótulo e na molécula; câmera orbita | câmera 3D linear | câmera em caminho ou vídeo scrubado | certo |
| 4.5–5.7s | frasco tomba e a tela é coberta de vermelho | transição por cor | wipe de cor cheia | certo |
| 5.8–11s (E4–E7) | bolhas e gotas em macro; palavras centrais trocam: Revitalisation², Moisture², Firmness², Radiance² | cortes a cada ~1.5s | seção pinada com palavra trocando sobre vídeo/shader | certo |
| 11.2–12.8s (E8–E9) | flash claro; frasco volta, pousa numa base hexagonal iluminada | zoom-out | scale settle | certo |
| 12.9–16s | nome do produto no topo, depois logotipo sobre gradiente | fade | fade | certo |

## 3. Sistema de motion extraído
- Câmera sempre em movimento linear lento; cortes marcam o ritmo (~1 a cada 1.5s no miolo).
- Texto: só troca (cut/fade), nunca 'pula'.
- Estrutura A–B–A: produto → interior → produto.

## 4. Superfície visual
- Paleta monocromática: `#1c0003`, `#450108`, `#710718`, `#aa1026`, rosa `#d7b6cb` nos reflexos; texto branco.
- Tipografia: sans neutra fina, pequena, centrada, com expoente '²' como assinatura.
- Luz vermelha de borda (rim light) e reflexo no piso.

## 5. Como reproduzir na web
**Stack:** Vídeo ou sequência de imagens scrubada (`recipes-scroll.md` §13) + GSAP; alternativa 3D: R3F com GLB do frasco.

1. Seção pinada de ~400vh com o vídeo/sequência ao fundo.
2. Palavras-benefício numa timeline com labels: cada uma faz `autoAlpha` 0→1→0 em sua faixa.
3. Fecho: packshot com `scale 1.15 → 1` e logotipo em fade.
4. Tema monocromático via tokens (5 tons da mesma matiz).

## 6. Transferível vs. específico
- **Levar:** paleta de uma cor só; uma palavra por cena; estrutura fora→dentro→fora.
- **Não levar:** marca, frasco, a molécula.
- **Bom para:** cosméticos, estética, perfumaria, bebidas · **Ruim para:** produto sem apelo visual próprio

## 7. Custo
Complexidade 2/5 com vídeo; 4/5 com 3D real · peso do vídeo/sequência é o risco.

## 8. Lições
- Monocromia dá luxo instantâneo e simplifica o design system.
- Uma palavra por cena comunica mais que um parágrafo.
