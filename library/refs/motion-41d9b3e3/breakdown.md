# Tênis com estética de visão computacional (glitch, pixel sort, nuvem de pontos) — breakdown

- **id:** motion-41d9b3e3 · **categoria:** motion · **fonte:** Pinterest; marca visível: Moncler
- **tipo de vídeo:** filme 3D/VFX com cortes
- **duração:** 18.9s · **formato:** 720×1280
- **resumo em uma frase:** O tênis surge como dado: borrões, caixas de detecção com rótulos, blocos de pixels e nuvem de pontos que vão 'resolvendo' até virar o produto limpo sobre uma rocha.

## 1. Conceito / metáfora
A máquina tentando enxergar o objeto: do ruído à forma.

## 2. Linha do tempo
| t | o que acontece | técnica na origem | equivalente na web | certeza |
|---|---|---|---|---|
| 0–4.7s | sola e tênis em azul/rosa (mapa de calor), com caixas e números; trocas borradas entre poses | morph + motion blur | shader de cor falsa + overlay de caixas | provável |
| 4.8–8.7s | versão cinza líquida; blocos de pixels coloridos tomam o objeto | pixel sorting | shader de displacement por blocos | provável |
| 8.7–14.1s (E4) | paisagem em nuvem de pontos; retângulos com recortes nítidos do tênis vão crescendo até cobrir tudo | máscaras retangulares | janelas `clip-path` crescendo sobre versão 'ruído' | certo |
| 14.2–18.9s | tênis real sobre a rocha, céu lilás, câmera orbitando devagar | órbita linear | rotação lenta do modelo/vídeo | certo |

## 3. Sistema de motion extraído
- Primeira metade nervosa (trocas a cada ~0.5s), segunda metade calma: o ritmo acompanha a ideia de 'resolver'.
- Órbita final linear e longa (2s+).

## 4. Superfície visual
- Paleta: azul-noite `#181820`, lilás acinzentado `#bebecb`, azul `#454b77`, bege do produto; rosa/azul saturado nas fases de 'dado'.
- Overlay técnico: caixas de 1px brancas com rótulos mono minúsculos.
- Gradiente vertical escuro→claro no fundo.

## 5. Como reproduzir na web
**Stack:** Three.js/R3F com shaders (Points, pixelização), + overlay DOM/SVG para as caixas.

1. Duas versões da mesma imagem/modelo: 'ruído' e 'limpa'. Revele a limpa por janelas `clip-path: inset()` que crescem (scroll scrub).
2. Caixas de detecção: `div`s absolutas com borda 1px e label mono; anime `width/height` via `scale` e troque o número.
3. Pixelização: shader `floor(uv * n) / n` com `n` crescendo conforme o progresso.
4. Fecho: produto limpo girando devagar.

## 6. Transferível vs. específico
- **Levar:** revelar por janelas retangulares; overlay de 'detecção'; ritmo nervoso→calmo.
- **Não levar:** produto e marca.
- **Bom para:** moda/streetwear, tecnologia, IA, visão computacional · **Ruim para:** marcas tradicionais

## 7. Custo
Complexidade 4/5 com shaders; 2/5 se usar só janelas de clip-path sobre duas imagens.

## 8. Lições
- Mudar o ritmo ao longo da peça (caos → calma) é narrativa.
- Um overlay simples de caixas e números vende 'tecnologia' sem 3D nenhum.
