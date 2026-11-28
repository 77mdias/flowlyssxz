# Modo CAPTURE — trazer um site inteiro para rodar localmente

Entrega: uma pasta `captures/<domínio>_<página>/` que abre o site vivo no navegador, com JavaScript, animações, WebGL,
fontes e vídeos, sem depender do servidor original.

```
captures/exemplo.com_produto/
├── abrir.sh / abrir.bat      duplo clique (ou ./abrir.sh) → sobe o servidor e abre o navegador
├── serve.py                  servidor local (só Python 3.8+, sem dependências)
├── index.html                porta de entrada: registra o Service Worker e abre o site
├── Como rodar.md
└── site/
    ├── <domínio>/<caminho>   os arquivos ORIGINAIS, byte a byte, na mesma árvore de pastas do site
    ├── <cdn>/<caminho>       idem para cada domínio de terceiros
    └── _fd/
        ├── site-index.json   o mapa: URL + método → arquivo, status, content-type
        ├── sw.js             Service Worker de replay
        ├── tech.json         bibliotecas, versões, WebGL/WebGPU, fontes (detectado na captura)
        ├── manifest.json     inventário legível + resultado da conferência
        └── snapshot.jpg / replay.jpg   retrato do original e da cópia
```

## Por que funciona (gravar e reproduzir)

Salvar o HTML "depois do JavaScript" mata as animações: o DOM fica congelado e os scripts, ao rodar de novo,
encontram a página já montada. Aqui é o contrário: guardamos **as respostas de rede originais** e deixamos o
navegador executar o site do zero, enganado por um Service Worker.

1. **Captura** (`capture_site.mjs`, Playwright + Chromium): abre a página, rola até o fim com a roda do mouse
   (dispara lazy loading, `import()` sob demanda, seções pinadas), passa o mouse nos elementos e grava cada resposta
   (HTML, JS, CSS, imagens, fontes, JSON de API, GLB, vídeo). Faz uma segunda passada em tela de celular.
   Rastreadores são bloqueados; favicons e variantes de `srcset` são buscados à parte; vídeos pedidos em pedaços (206)
   são baixados inteiros.
2. **Player**: `serve.py` serve a pasta em `http://<domínio>.localhost:<porta>/`; `index.html` registra `sw.js`;
   o Service Worker intercepta **todas** as requisições da página (inclusive para CDNs), procura a URL no
   `site-index.json` e devolve o arquivo gravado com o content-type original.
3. **Conferência**: a própria captura sobe o player em modo offline, abre a cópia, rola e pergunta ao Service Worker
   o que faltou. O resultado sai no terminal e em `manifest.json › verify`.

Detalhes que fazem diferença: parâmetros voláteis (`?ts=1712…`, `?v=…`) são ignorados na busca; POST é casado pelo hash
do corpo; imagem pedida em outro tamanho recebe a maior variante gravada; o Service Worker do próprio site é
desativado (ele tomaria o lugar do nosso); links absolutos para o domínio original navegam dentro da cópia;
cada captura usa uma porta própria para um Service Worker nunca atender outra cópia.

## Uso

```bash
# uma vez, na raiz do repositório
npm i -D playwright && npx playwright install chromium     # ou use o Chrome instalado: --channel chrome

node skills/flowlyssxz/scripts/capture_site.mjs https://exemplo.com/produto
cd captures/exemplo.com_produto && ./abrir.sh
```

| opção | efeito |
|---|---|
| `--pages N` | captura também até N-1 páginas internas linkadas na entrada |
| `--headed` | abre a janela do navegador; **use em sites com WebGL pesado**: sem janela o Chromium costuma renderizar 3D por software, e a captura pode levar vários minutos |
| `--no-mobile` | pula a passada de celular |
| `--wait MS` | espera extra depois do carregamento (intros longas, loaders) |
| `--max-file-mb N` | arquivos maiores que N MB não entram (padrão 80; continuam vindo do site original) |
| `--channel chrome` / `--browser-path CAMINHO` | usa um navegador já instalado |
| `--keep-trackers` | não bloqueia analytics/chat (raramente necessário) |
| `--out PASTA`, `--no-verify`, `--timeout MS` | saída, pular conferência, tempo máximo de navegação |

Player: `python3 -I serve.py --open` · `--offline` (nada vem da internet) · `--port N`.

## Passo a passo do agente

1. Rode a captura. Precisa de acesso à internet a partir do shell; se o shell não alcança o site, diga isso e
   passe o comando para o usuário rodar no terminal dele.
2. Leia o final da saída: número de arquivos, bibliotecas, **faltas** e erros de JavaScript "só na cópia".
3. Olhe `site/_fd/snapshot.jpg` (original) e `site/_fd/replay.jpg` (cópia) lado a lado.
4. Se houver faltas:
   - conteúdo que só aparece com interação (abas, modal, hover, menu) → recapture com `--headed --wait 8000` e
     interaja manualmente durante a espera, ou aumente `--pages`;
   - intro/loader longo → `--wait`;
   - arquivo grande → `--max-file-mb`.
5. Entregue: caminho da pasta, como abrir, o que foi conferido e o que não foi.

## O que a captura destrava nos outros modos

- **DECODE com certeza**: o código-fonte real está em `site/<domínio>/…`. Leia os JS/CSS em vez de inferir pelo vídeo;
  `tech.json` já diz a stack e as versões. Marque como "certo (lido no código)".
- **Vídeo de referência**: `record_page.mjs` na URL local (`Abra: http://…` impresso pelo `serve.py`) gera o vídeo para
  o `analyze_video.py`.
- **BRAND SYSTEM** (design system + branding medidos): `node skills/flowlyssxz/scripts/site_design.mjs captures/<pasta>` e siga `site-design.md`.
- **Biblioteca**: `library.py add-url <URL> --category web --title "…"` e anote o caminho da captura no `meta.json` (`notes`).

## Limites (diga quando acontecer)

- **Só o que foi pedido durante a captura existe.** Rota, aba ou modal que ninguém abriu não está na cópia. Com internet,
  GETs que faltam são buscados no site original; com `--offline`, simplesmente faltam.
- **Sem login.** O capturador não recebe senha nem cookie; páginas atrás de autenticação não entram.
- **Tempo real não se grava**: WebSocket, streaming, respostas que mudam a cada chamada (busca, chat, carrinho). Formulários
  não são enviados: POST que não foi gravado dá 404 e nunca sai para a internet.
- **Vídeo por streaming** (HLS/DASH, YouTube, Vimeo) fica online; só arquivos de vídeo diretos entram.
- **Proteção anti-robô** (Cloudflare challenge, captcha) pode barrar o navegador automatizado: tente `--headed`.
- **Sites que conferem o domínio** (`location.hostname === 'site.com'`) podem se comportar diferente em `site.com.localhost`.
- Chrome, Edge e Firefox. No modo privado/anônimo alguns navegadores bloqueiam Service Worker.

## Uso responsável

A cópia serve para estudar como o site foi construído. O servidor só escuta no próprio computador. O conteúdo
(marca, textos, fotos, modelos 3D, código) pertence aos donos: não publique a pasta, não a hospede e não a use como base
de um site seu. Para um projeto real, leve a técnica e o ritmo (modo ADAPT), nunca os arquivos.
Adicione `captures/` ao `.gitignore` de repositórios públicos.
