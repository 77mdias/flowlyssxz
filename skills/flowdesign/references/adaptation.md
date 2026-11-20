# Adaptação — da referência para o nicho

Copiar uma referência produz um site "bonito e de ninguém". Adaptar produz um site que só poderia ser daquela marca.

## 1. As quatro camadas de uma referência

| Camada | Pergunta | Normalmente você… |
|---|---|---|
| **Conceito / metáfora** | Que ideia o motion encena? (ex.: "peças sendo montadas", "camadas de um tecido") | **Troca** pela ideia do nicho |
| **Técnica** | Com o que foi feito? (pin + clip reveal, shader de distorção, câmera 3D) | **Mantém** (é o ofício que você estudou) |
| **Coreografia / timing** | Ordem, ritmo, durações, easing, stagger, overlap | **Mantém o ritmo**, recalibra a intensidade |
| **Superfície** | Cores, tipografia, fotos, textura, ícones | **Troca** pela identidade do cliente |

Exemplo: referência de oficina de carros de luxo (seção sobe revelando a próxima fixa, título acende letra a letra, imagem troca com máscara vertical).
Para um ateliê de beleza: mesma técnica de *section curtain* e *text fill*, mas o conceito vira "camadas de cuidado"
(cada seção é uma etapa do atendimento), easing mais macio (expo.inOut → sine/power2), fotos claras, serifa delicada, grão leve.

## 2. Personalidade → parâmetros de motion

| Personalidade | Durações | Easing | Distâncias | Stagger | Recursos típicos | Evitar |
|---|---|---|---|---|---|---|
| **Confiável / institucional** (banco, crédito, saúde, jurídico) | curtas (200–600ms) | power2/3.out, sem overshoot | pequenas (8–24px) | curto | contadores, gráficos desenhando, line reveals, parallax sutil | bounce, 3D chamativo, scroll-jacking |
| **Premium / luxo** (carros, joias, imóveis alto padrão) | longas (0.9–1.6s) | expo.out / power4.inOut | grandes, com máscara | médio | clip reveals, scale settle, pin storytelling, imagens grandes, cursor custom | cores saturadas, muitos elementos animando juntos |
| **Elegante / acolhedor** (beleza, estética, moda, bem-estar) | médias-longas | sine.inOut, power2.out | médias | médio-longo | blur-in suave, fill de texto, parallax interno, grão, transições cross-fade | cortes secos, glitch |
| **Tech / inovador** (SaaS, IA, dev tools) | médias | power3.out, expo | médias | curto | 3D/shader, partículas, código digitando, grid animado, scramble | clichê de "blob roxo + glow" |
| **Divertido / jovem** (apps de consumo, games, educação infantil) | curtas | back.out, springs | médias-grandes | curto | Rive, squash & stretch, cursores lúdicos, stickers | lentidão "luxuosa" |
| **Editorial / cultural** (revistas, museus, portfólios) | variadas | power4.inOut | grandes | longo | tipografia gigante, marquee, transições de página, layouts quebrados | template de cards |
| **Industrial / técnico** (engenharia, logística, agro) | médias | power2.inOut, linear p/ scrub | médias | — | exploded view 3D, diagramas que se desenham, números | ornamentos gratuitos |

## 3. Superfície → intensidade

| Superfície | Intensidade | Regras |
|---|---|---|
| Landing / site institucional / campanha | **Alta** | narrativa no scroll, 1 momento-herói por seção, 3D opcional |
| Onboarding, páginas de produto dentro do app | **Média** | transições de etapa, ilustrações Rive, progress |
| App logado (dashboard, formulários, tabelas) | **Baixa / funcional** | feedback, continuidade (layout/shared element), 150–300ms, nada de smooth scroll global, nada de pin |
| E-commerce (lista/checkout) | **Baixa** na compra, **média** na vitrine | nunca atrase o caminho até o botão |

## 4. Sistema de motion (tokens)

Defina antes de animar. Exemplo base (ajuste por personalidade):

```css
:root {
  --dur-xs: 120ms;  --dur-s: 220ms;  --dur-m: 420ms;  --dur-l: 800ms;  --dur-xl: 1300ms;
  --ease-out: cubic-bezier(0.22, 1, 0.36, 1);     /* power4.out / expo-like */
  --ease-in-out: cubic-bezier(0.76, 0, 0.24, 1);  /* power3.inOut */
  --ease-soft: cubic-bezier(0.37, 0, 0.63, 1);    /* sine.inOut */
  --dist-s: 12px; --dist-m: 32px; --dist-l: 12vh;
  --stagger-char: 25ms; --stagger-line: 90ms; --stagger-item: 110ms;
}
```

```ts
// motion.ts — os mesmos tokens para GSAP/Motion
export const dur = { xs: .12, s: .22, m: .42, l: .8, xl: 1.3 }
export const ease = { out: 'power4.out', inOut: 'power3.inOut', soft: 'sine.inOut', spring: { type: 'spring', stiffness: 260, damping: 28 } }
export const stagger = { char: .025, line: .09, item: .11 }
```

Regras: no máximo 2–3 easings no projeto inteiro; durações vêm da escala; toda exceção é justificada no Motion Direction.

## 5. Motion Direction — formato de entrega

```md
# Motion Direction — <projeto>
**Conceito:** uma frase ligando motion ao negócio.
**Personalidade:** 3 adjetivos + o que NÃO somos.
**Superfícies e intensidade:** …
**Tokens:** (tabela)
**Referências usadas:** <id> → o que levamos (técnica/ritmo) / o que mudamos (conceito/superfície)
**Plano por seção:**
| seção | objetivo da seção | momento-herói | apoio | gatilho | técnica | ref |
**Interação global:** cursor? smooth scroll? transição de página?
**Mobile:** o que simplifica/desliga.
**Reduced motion:** o que vira estático/fade.
**Orçamento:** JS de animação ≤ X KB, 3D ≤ Y MB, 60fps em notebook médio.
```

## 6. Usando muitas referências sem virar colagem

- Escolha **uma referência-mãe** para o ritmo geral e no máximo 2–3 **referências de detalhe** (um hover, uma transição).
- Mesmo easing e escala de durações em tudo — é isso que dá unidade.
- Se dois efeitos disputam o mesmo momento, fique com o que serve melhor ao conteúdo.
