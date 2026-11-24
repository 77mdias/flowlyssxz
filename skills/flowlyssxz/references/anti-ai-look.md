# Anti-"cara de IA"

Design genérico não vem de uma ferramenta; vem de **decisões que ninguém tomou**. A IA escolhe a média. Você escolhe com intenção.

## Sinais que denunciam (evite por padrão)

**Layout:** hero centralizado com título + subtítulo + 2 botões · grade de 3 cards com ícone em cima · seções todas com a mesma altura e o mesmo ritmo · tudo dentro de `max-w-7xl` centralizado · espaçamento uniforme em tudo.

**Visual:** gradiente roxo→azul / blob com glow · glassmorphism em tudo · `rounded-2xl` + sombra suave em todos os elementos · Inter/Geist em tudo, um peso só · ícones genéricos (Lucide/Heroicons) como decoração · ilustrações 3D "clay" de banco de imagens · emojis como ícones · badge "✨ New" no topo.

**Motion:** todo elemento faz fade-up de 20px com a mesma duração · tudo anima ao mesmo tempo · hover = scale 1.05 em tudo · contador animado sem contexto · parallax aleatório sem motivo · loader decorativo.

**Texto:** "Unlock the power of…", "Seamless", "Elevate your…", "Revolutionize", três benefícios com três palavras cada, lorem ipsum disfarçado.

## Antídotos

1. **Direção de arte antes do código.** Uma ideia central (metáfora) que explica por que a página é assim. Se não der para descrever em uma frase, não comece.
2. **Tipografia com voz.** Uma display com caráter (serifada contemporânea, grotesca condensada, mono) + uma de texto. Contraste de escala grande (título 8–14vw vs. corpo 16–18px). Ajuste tracking e line-height à mão.
3. **Grid com tensão.** Assimetria, colunas desalinhadas de propósito, elementos sangrando a borda, texto sobre imagem, espaço vazio generoso em um lugar e denso em outro.
4. **Conteúdo real.** Fotos do cliente (ou direção de foto clara), números reais, textos com a voz da marca. Nada de placeholder "bonito".
5. **Hierarquia no motion.** Um herói por seção; o resto silencioso. Varie os tipos de entrada conforme o papel do conteúdo.
6. **Coreografia, não efeitos.** Overlap, stagger com intenção, saída e entrada conversando (o que sai indica de onde vem o próximo).
7. **Easing próprio.** Defina 2–3 curvas do projeto (CustomEase/cubic-bezier) e use sempre.
8. **Textura e imperfeição.** Grão, papel, ruído, sombras com cor, bordas não perfeitas — onde fizer sentido com a marca.
9. **Uma interação-assinatura** ligada ao significado da marca (ex.: cursor que "costura" num ateliê; números que "carimbam" num serviço de crédito). Apenas uma.
10. **Paleta com acento disciplinado.** 1 cor de acento usada raramente; neutros com temperatura (não `#f5f5f5` cinza puro).

## Checklist antes de entregar

- [ ] Consigo dizer o conceito da página em uma frase?
- [ ] Se eu tirar o logo, ainda dá para saber de que marca/nicho é?
- [ ] Há pelo menos uma decisão tipográfica ousada?
- [ ] O grid tem pelo menos um momento de quebra/tensão?
- [ ] Cada seção tem no máximo um momento-herói de motion?
- [ ] Existem ≥ 2 tipos diferentes de entrada, escolhidos pelo papel do conteúdo?
- [ ] Os easings vêm dos tokens?
- [ ] A página é bonita **sem** animação (teste com reduced motion)?
- [ ] Nenhum item da lista "Sinais que denunciam" sobrou sem justificativa?
