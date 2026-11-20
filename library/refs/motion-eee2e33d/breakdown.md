# Marketplace — colunas de cards em sentidos opostos + produtos que se desmontam — breakdown

- **id:** motion-eee2e33d · **categoria:** motion · **fonte:** Pinterest; marca visível: Amazon (assinatura de estúdio no fim)
- **tipo de vídeo:** filme 3D/motion com cortes
- **duração:** 26.8s · **formato:** 700×880
- **resumo em uma frase:** Uma caixa abre para uma parede de três colunas de cards de produto rolando em sentidos alternados; depois, produtos-herói (abajur, cadeira, chuteira, relógio) giram e se desmontam um a um.

## 1. Conceito / metáfora
Do pacote ao catálogo infinito e de volta ao pacote.

## 2. Linha do tempo
| t | o que acontece | técnica na origem | equivalente na web | certeza |
|---|---|---|---|---|
| 0–1.8s | caixa parada, depois tomba | antecipação | — | certo |
| 1.9–5.1s (E2–E3) | parede de cards: 3 colunas, a do meio rola no sentido contrário | marquee vertical | colunas com `yPercent` em loop, direções alternadas | certo |
| 5.2–18s (E4–E8) | um produto por vez no centro: entra girando, segura ~2s, desmonta/sai (eventos locais, área 14–20%) | rotação + vista explodida | modelo com partes animadas; ciclo de ~2.5s | certo |
| 18.2–22.8s (E9–E12) | volta à parede de cards (zoom-out com power4.out), colunas rolando | marquee | idem | certo |
| 22.9–26.8s | caixa; assinatura do estúdio em preto | corte | — | certo |

## 3. Sistema de motion extraído
- Ciclo de produto regular (~2.5s): entra, segura, sai.
- Marquee linear nas colunas; transições de cena com power4.out.
- Fundo e câmera parados durante os produtos: só o objeto se move.

## 4. Superfície visual
- Paleta: cinza-claro de estúdio (`#dad8da`, `#b4b2b5`), laranja `#d88d55` em todos os produtos, azul `#2796f6` no fundo da parede.
- Cards estilo post de rede social: cabeçalho, texto curto, etiqueta laranja de categoria, estrelas.
- Produtos 3D foscos, todos na mesma cor de marca.

## 5. Como reproduzir na web
**Stack:** GSAP (colunas) + R3F para os produtos; sem 3D: sequências de imagens.

1. Colunas: conteúdo duplicado, `gsap.to(col, {yPercent: -50, repeat: -1, ease: 'none', duration: 30})`; coluna do meio com `reversed` (ou `yPercent: 50`).
2. Velocidade das colunas reage ao scroll (`timeScale`), ver `recipes-scroll.md` §12.
3. Produto-herói: timeline com entrada `rotation.y` + `back.out`, hold, e partes saindo em stagger.
4. Tingir todos os produtos com a cor da marca unifica o catálogo.

## 6. Transferível vs. específico
- **Levar:** colunas em sentidos opostos; todos os produtos na cor da marca; ciclo entra-segura-sai.
- **Não levar:** marca, caixa, logotipo.
- **Bom para:** marketplace, e-commerce, catálogos, depoimentos em colunas · **Ruim para:** produto único

## 7. Custo
Complexidade 2/5 (colunas) a 4/5 (produtos 3D desmontáveis).

## 8. Lições
- Colunas alternadas dão sensação de abundância com pouco código.
- Pintar tudo com uma cor resolve a bagunça visual de um catálogo variado.
