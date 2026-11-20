# Mãos que se tocam e viram ouro (transição de material) — breakdown

- **id:** motion-6cb8ef7c · **categoria:** motion · **fonte:** Pinterest, sem fonte identificada
- **tipo de vídeo:** loop 3D lento (sem cortes)
- **duração:** 15.9s · **formato:** 612×1088
- **resumo em uma frase:** Duas mãos de gesso com texto gravado se aproximam; onde se tocam, o material vira ouro líquido que se espalha, e depois volta ao gesso.

## 1. Conceito / metáfora
O contato transforma: conexão como valor.

## 2. Linha do tempo
| t | o que acontece | técnica na origem | equivalente na web | certeza |
|---|---|---|---|---|
| 0–5s | mãos se aproximam bem devagar; linhas finas (plexus) ligam pontos dos dedos | animação lenta | idle + linhas | certo |
| 5–10s | dedos se encaixam; o ouro nasce no ponto de contato e sobe pelas mãos | máscara de material | mistura de materiais por distância ao ponto de contato | certo |
| 10.2–12.4s (E1–E2) | câmera aproxima; quase tudo dourado; depois afasta | zoom leve | dolly | certo |
| 12.4–15.9s | mãos se separam e o ouro recua até voltar ao gesso (loop) | reverso | mesma máscara ao contrário | certo |

## 3. Sistema de motion extraído
- Movimento contínuo e muito lento: só 13% do tempo passa do limiar de 'evento'.
- Loop perfeito (fim = começo).
- Nenhum easing brusco.

## 4. Superfície visual
- Paleta: cinzas claros `#b7b6b8`, gesso, ouro/bronze com reflexos.
- Texto manuscrito gravado na superfície; partículas e fios finos.
- Fundo liso com leve gradiente.

## 5. Como reproduzir na web
**Stack:** R3F com shader de mistura de materiais; ou simplesmente o vídeo em loop como hero.

1. Mais simples: usar como vídeo de fundo (`muted loop playsinline`) com título por cima.
2. Em 3D: `mix(matGesso, matOuro, smoothstep(r, r + borda, distancia(ponto, contato)))`, com `r` animado.
3. Linhas: `LineSegments` entre pontos próximos com opacidade baixa.
4. Ligue `r` ao scroll para o usuário 'causar' a transformação.

## 6. Transferível vs. específico
- **Levar:** transformação de material que nasce de um ponto; loop lento como ambiente.
- **Não levar:** as mãos em si (imagem muito usada).
- **Bom para:** institucional, parcerias, consultoria, finanças, arte · **Ruim para:** produto que pede energia e velocidade

## 7. Custo
Complexidade 1/5 como vídeo; 4/5 em 3D real.

## 8. Lições
- Lentidão também é uma decisão de motion: comunica peso e valor.
- Uma metáfora visual forte dispensa texto.
