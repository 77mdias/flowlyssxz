# Modo DESIGN SYSTEM — de uma referência para um sistema completo

Entrega: `library/refs/<id>/design-system/` com

| arquivo | o que é |
|---|---|
| `tokens.json` | **fonte única da verdade** (você escreve) |
| `tokens.css` | variáveis CSS + classes `.ds-*` dos componentes (gerado) |
| `tailwind-theme.css` | bloco `@theme` para Tailwind v4 (gerado) |
| `motion.ts` | durações, easings GSAP/CSS, staggers (gerado) |
| `preview.html` | página-espécime para conferir e mostrar (gerado) |
| `DESIGN.md` | o manual: princípios, uso, faça/não faça, o que foi medido e o que foi inferido (você escreve) |

## O que dá e o que não dá para extrair de um vídeo

| Camada | Precisão | De onde vem |
|---|---|---|
| Cores de interface (fundo, texto, bordas) | **alta** | `design-raw.json` → `roles`, `colors` |
| Acentos | média (misturam-se com fotos/3D) | `accent_candidates` + olhar |
| Tamanho de títulos | boa (±10–15%) | `type_scale` com `confidence: ok` |
| Tamanho de corpo | boa | `body_text` (passo entre linhas) |
| Texto minúsculo (labels) | baixa | ampliar com `frames.py --crop` e estimar |
| **Família tipográfica** | **não detectável** | classificar e escolher substituta (tabela abaixo) |
| Margens e colunas | média | `layout.left_guides_pct` + olhar |
| Raio, borda, sombra | visual | stills ampliados |
| Componentes e estados | parcial (só os estados que aparecem no vídeo) | stills + breakdown |
| Motion | média | `motion` do raw + `breakdown.md` |
| Breakpoints, estados de erro, telas que não aparecem | **não existe no vídeo** | você projeta por coerência e marca como "inferido" |

Com a **URL do site**, não use esta rota: vá para o modo BRAND SYSTEM (`site-design.md`). O `site_design.mjs` mede o site
rodando (tokens do autor, tipografia real, componentes com hover, animações, bibliotecas) e o resultado deixa de ser reconstrução.
O formato do `tokens.json` é o mesmo daqui, com grupos a mais (`brand`, `theme`, `stack`, `animation`).

## Passo a passo

1. **Pré-requisito:** referência analisada (`analysis/`) e, de preferência, decodificada (`breakdown.md`).
2. **Medir:** `python3 skills/flowlyssxz/scripts/extract_design.py library/refs/<id>/source.mp4`
   → `design/design-raw.json`, `design/stills/`, `design/stills_sheet.jpg`, `design/palette.png`.
3. **Olhar** (obrigatório): `stills_sheet.jpg` (caixas rosa = OCR, azul = morfologia, com px estimado), `palette.png`,
   e 2–4 stills em tamanho cheio. Para detalhes (botão, nav, card): `frames.py SOURCE --at T --crop x,y,w,h`.
4. **Decidir os tokens** (regras abaixo) e escrever `tokens.json`.
5. **Gerar:** `python3 skills/flowlyssxz/scripts/ds_build.py library/refs/<id>/design-system/tokens.json`
   (leia os avisos de contraste).
6. **Conferir:** abra `preview.html`, tire um print e compare lado a lado com os stills: mesma temperatura de cor?
   mesma proporção título/corpo? mesmo "ar"? Ajuste `tokens.json` e gere de novo.
7. **Escrever `DESIGN.md`** (estrutura abaixo) e catalogar: `library.py tag <id> --tags design-system`.

## Regras de decisão

**Cor**
- Separe cor de **interface** de cor de **conteúdo** (fotos, 3D). Só a primeira vira token de UI. Pista: cor de interface
  aparece em muitas telas (`presence` alto) e em áreas chapadas; cor de foto aparece em poucas.
- Tokens mínimos: `bg`, `surface`, `text`, `text-muted`, `border`, `accent`. Adicione `bg-alt`, `accent-contrast` etc. só se existirem na referência.
- Se o `text-muted` medido falha em contraste (< 4.5:1), registre o valor original numa `note` e **corrija** o token. Um design system
  é uma versão utilizável, não uma cópia de defeitos.
- Acento: no máximo 1–2. Se a cor só vem das fotos, diga isso (`note`) e defina um acento para estados/indicadores.

**Tipografia**
- Classifique cada papel (display, corpo, label) olhando os stills: serifa (didone, transicional, slab), grotesca (neo, geométrica,
  humanista), condensada, mono, script. Observe contraste de traço, largura, terminais, altura-x.
- Escolha substituta aberta (Google Fonts) e registre: `"note": "substituta de serifa didone condensada; original não identificada"`.

| Classificação | Substitutas abertas |
|---|---|
| Serifa didone/alto contraste, leve | Instrument Serif, Playfair Display, Cormorant Garamond, Bodoni Moda |
| Serifa editorial contemporânea | Fraunces, Newsreader, DM Serif Display |
| Grotesca neutra (neo) | Inter, Hanken Grotesk, Geist, Instrument Sans |
| Grotesca geométrica | Manrope, Outfit, Figtree, Plus Jakarta Sans |
| Grotesca com caráter | Space Grotesk, Bricolage Grotesque, Syne, Unbounded |
| Condensada bold | Anton, Bebas Neue, Oswald, Barlow Condensed, Archivo (eixo de largura) |
| Mono | JetBrains Mono, IBM Plex Mono, Space Mono, Geist Mono |

- Escala: pegue os tamanhos confiáveis, converta para fluido e arredonde para uma razão coerente.
  Fórmula: `clamp(MIN, Xvw, MAX)` com `X` = `vw` medido; `MAX` ≈ px em 1440–1600; `MIN` ≈ 45–55% do máx para títulos, 14–16px para corpo.
- Títulos grandes: `line-height` 0.9–1.05 e tracking levemente negativo; labels em caixa alta: tracking 0.12–0.25em.

**Espaço e layout**
- Base 4px. Escala curta (4, 8, 12, 16, 24, 32, 48, 64, 96, 128). Meça 3–4 distâncias reais nos stills (margem lateral, respiro
  título→parágrafo, parágrafo→CTA, altura de seção) e encaixe na escala.
- Layout: `margin` (da menor guia esquerda frequente), `columns`, `gutter`, `max`, `section-y`. Em sites editoriais use `vw`/`vh`.

**Raio, borda, sombra**
- Raio é assinatura: 0 (editorial/luxo), 4–8 (produto), 12–24 (amigável), pílula. Use poucos valores.
- Muitos sites premiados são planos: se não há sombra, não invente; use `border` hairline.

**Motion** (copie do breakdown, não do raw sozinho)
- `duration`: 4–5 degraus (xs…xl). `ease`: 2–3 curvas com `css` e `gsap`. `stagger`: char/line/item. `scroll`: `{smooth, lerp}`.
- Registre também o **padrão de coreografia** no DESIGN.md (ex.: "módulo de serviço = cortina + clip + text fill").

**Componentes**
- Inventarie o que aparece: nav, botão/CTA, link, eyebrow/label, card, mídia, input, tag, contador, progresso, rodapé.
- Cada componente em `tokens.json › component` é CSS em JSON, sempre referenciando tokens (`{color.text}`), com um `html` de exemplo
  para o preview. Estados que o vídeo não mostra (hover, foco, desabilitado) são **inferidos**: projete-os coerentes e diga isso.

## Formato do tokens.json

```json
{
  "meta": {
    "name": "Nome do sistema", "source": "library/refs/<id>", "summary": "uma frase",
    "principles": ["3–5 regras que explicam o sistema"],
    "confidence": {"cor": "alta (medida)", "tipografia": "tamanhos medidos; famílias substitutas", "motion": "média"},
    "notes": ["o que foi corrigido/inferido"],
    "specimen": {"default": "texto de exemplo", "display": "texto para o estilo display"}
  },
  "color":  { "bg": "#110d11", "text-muted": {"value": "#8a878b", "note": "original ≈ #4c494d (2.1:1), corrigido"} },
  "font":   { "display": {"stack": "'Instrument Serif', serif", "google": "Instrument+Serif:ital@0;1", "note": "…"} },
  "text":   { "display": {"font": "display", "size": "clamp(3.25rem, 7.5vw, 7.5rem)", "line": "0.98", "tracking": "-0.01em", "weight": "400", "transform": "none"} },
  "space":  { "1": "4px", "2": "8px" },
  "radius": { "none": "0", "pill": "999px" },
  "shadow": { },
  "border": { "hairline": "1px solid {color.border}" },
  "layout": { "margin": "8vw", "columns": "12", "gutter": "24px", "section-y": "18vh" },
  "motion": {
    "duration": {"s": "0.25s", "l": "0.9s"},
    "ease": {"out": {"css": "cubic-bezier(0.22, 1, 0.36, 1)", "gsap": "power4.out"}},
    "stagger": {"char": "0.03s"},
    "scroll": {"smooth": true, "lerp": 0.09}
  },
  "component": {
    "button": {
      "text": "label", "color": "{color.bg}", "background": "{color.text}", "padding": "{space.3} {space.5}",
      "border-radius": "{radius.pill}", "transition": "opacity {motion.duration.s} {motion.ease.out}",
      ":hover": {"opacity": "0.85"},
      "&::after": {"content": "'→'", "margin-left": "{space.2}"},
      "html": "<button class=\"ds-button\">Agendar</button>", "note": "hover inferido"
    }
  }
}
```

- `"text": "<estilo>"` dentro de um componente aplica o estilo tipográfico inteiro.
- Chaves começando com `:` (estado) ou `&` (pseudo-elemento/sufixo) viram seletores aninhados; outras chaves-objeto viram descendentes.
- Grupos obrigatórios: `meta`, `color`, `font`, `text`.

## Estrutura do DESIGN.md

```md
# <Nome> — design system
> Reconstruído a partir de <id>. Medido: … · Inferido: … · Substituído: …

## 1. Essência (3–5 princípios + o que o sistema NÃO é)
## 2. Cor (tabela token → uso; regras de combinação; contraste)
## 3. Tipografia (papéis, escala, regras: quando usar display, limites de linha, caixa)
## 4. Espaço e layout (grid, margens, ritmo vertical, padrões de seção)
## 5. Forma (raio, borda, sombra, imagem: proporções, tratamento, recorte)
## 6. Componentes (anatomia, variações, estados, faça/não faça)
## 7. Motion (tokens + padrões de coreografia + reduced motion)  ← link para o breakdown
## 8. Acessibilidade (contraste, foco, alvo de toque, movimento)
## 9. Como usar (importar tokens.css / tailwind-theme.css / motion.ts; exemplo de seção)
## 10. Como adaptar para outro projeto (o que manter, o que trocar)
```

## Do sistema da referência ao sistema do SEU projeto

O design system extraído é material de estudo e ponto de partida. Para um projeto real (modo ADAPT):
mantenha **estrutura** (escala, ritmo de espaço, lógica de componentes, tokens de motion) e troque **identidade**
(paleta, famílias, imagens, voz). Copie `tokens.json` para o projeto, altere `color` e `font`, rode `ds_build.py` de novo.
Nunca publique o sistema de outra marca como está.
