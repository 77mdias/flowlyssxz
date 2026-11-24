/* flowlyssxz: Service Worker que reproduz um site capturado.
 *
 * Toda requisição da página, para este endereço local ou para qualquer outro domínio, é respondida
 * com a resposta gravada na captura. O índice (site-index.json, nesta mesma pasta) diz qual arquivo
 * corresponde a cada URL + método. Nada fica em cache: o estado vive na memória e é remontado do
 * índice sempre que o navegador religa o worker.
 */
'use strict';

const PLAYER_DIR = new URL('./', self.location.href);
const CAPTURE_ROOT = new URL('../../', self.location.href);
const HERE = self.location.origin;

const REPLAYED_HEADERS = ['content-type', 'content-language', 'content-disposition', 'last-modified',
  'cross-origin-opener-policy', 'cross-origin-embedder-policy'];
const REDIRECTS = [301, 302, 303, 307, 308];
const BODILESS = [204, 205, 304];
// Parâmetros e sufixos que só mudam o tamanho pedido da mesma imagem (srcset, CDNs, WordPress, Webflow, Shopify).
const SIZING_QUERY = new Set('auto blur crop dpr fit fm format h height lossless q quality resize scale size w width'.split(' '));
const SIZE_SUFFIX = /(?:-\d{2,5}x\d{2,5}|-p-\d{3,4}|_\d{2,5}x(?:\d{2,5})?|@[23]x)(?=\.[^./]+$)/;

const tally = { served: 0, blocked: 0, online: 0 };
const missing = new Map();
let pending = null;

// === índice ===

function withoutHash(href) {
  const cut = href.indexOf('#');
  return cut < 0 ? href : href.slice(0, cut);
}

function sortedQuery(pairs) {
  return pairs.map(([name, value]) => encodeURIComponent(name) + '=' + encodeURIComponent(value)).sort().join('&');
}

/** Mesma URL sem os parâmetros que mudam a cada visita (versão, carimbo de tempo) e sem depender da ordem. */
function stableKey(href, volatile) {
  const url = new URL(href);
  const kept = [...url.searchParams].filter(([name, value]) =>
    !volatile.has(name) && !/^\d{10,13}$/.test(value) && !(value === '' && /^\d+$/.test(name)));
  return url.origin + url.pathname + '?' + sortedQuery(kept);
}

function pathKey(href) {
  const url = new URL(href);
  return url.origin + url.pathname;
}

function imageKey(href) {
  const url = new URL(href);
  let path = url.pathname;
  while (SIZE_SUFFIX.test(path)) path = path.replace(SIZE_SUFFIX, '');
  const kept = [...url.searchParams].filter(([name]) => !SIZING_QUERY.has(name.toLowerCase()));
  return url.origin + path + '?' + sortedQuery(kept);
}

function addTo(map, key, value) {
  const list = map.get(key);
  if (list) list.push(value); else map.set(key, [value]);
}

function buildBook(index, runtime) {
  const home = new URL(index.entry.url);
  const book = {
    home: home.origin,
    start: (index.entry.path || '/') + (index.entry.search || ''),
    online: index.onlineFallback !== false && !(runtime && runtime.offline),
    blocked: [],
    volatile: new Set(index.volatileParams || []),
    exact: new Map(),    // "MÉTODO url" → gravações, na ordem do índice
    stable: new Map(),   // GET por URL sem parâmetros voláteis → primeira gravação
    paths: new Map(),    // GET por origem + caminho → gravações
    images: new Map(),   // imagem sem marca de tamanho → a maior gravada
  };
  for (const pattern of index.blocked || []) {
    try { book.blocked.push(new RegExp(pattern, 'i')); } catch (_) { /* padrão inválido: ignora */ }
  }
  for (const item of index.entries || []) {
    let href;
    try { href = withoutHash(new URL(item.url).href); } catch (_) { continue; }
    addTo(book.exact, item.method + ' ' + href, item);
    if (item.method !== 'GET') continue;
    const stable = stableKey(href, book.volatile);
    if (!book.stable.has(stable)) book.stable.set(stable, item);
    addTo(book.paths, pathKey(href), item);
    if (item.file && /^image\//i.test(item.contentType || '')) {
      const key = imageKey(href);
      const best = book.images.get(key);
      if (!best || (item.size || 0) > (best.size || 0)) book.images.set(key, item);
    }
  }
  return book;
}

async function readJson(name) {
  const response = await fetch(new URL(name, PLAYER_DIR), { cache: 'no-store' });
  if (!response.ok) throw new Error(name + ': ' + response.status);
  return response.json();
}

/** O índice desta captura, ou null se não deu para ler (aí a próxima requisição tenta de novo). */
function openBook() {
  if (!pending) {
    pending = Promise.all([readJson('site-index.json'), readJson('runtime.json').catch(() => null)])
      .then(([index, runtime]) => buildBook(index, runtime))
      .catch(() => { pending = null; return null; });
  }
  return pending;
}

// === casamento ===

/** A URL que o site original teria pedido: o endereço local vira o domínio capturado. */
function originalUrl(book, url) {
  const href = withoutHash(url.href);
  return url.origin === HERE ? book.home + href.slice(url.origin.length) : href;
}

async function bodyDigest(request) {
  const bytes = await request.clone().arrayBuffer();
  if (!bytes.byteLength) return '';
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

async function findRecording(book, request, href) {
  const method = request.method === 'HEAD' ? 'GET' : request.method;
  const same = book.exact.get(method + ' ' + href) || [];
  if (method === 'GET') {
    if (same.length) return same[0];
    const lone = book.paths.get(pathKey(href)) || [];
    return book.stable.get(stableKey(href, book.volatile)) || (lone.length === 1 ? lone[0] : null);
  }
  if (!same.length) return null;
  const digest = await bodyDigest(request);
  return same.find((item) => (item.bodyHash || '') === digest) || (same.length === 1 ? same[0] : null);
}

function noteMissing(href, request, substitute) {
  const seen = missing.get(href);
  if (seen) { seen.count += 1; return; }
  missing.set(href, { url: href, method: request.method, destination: request.destination || '', count: 1,
    substitute: substitute || null });
}

const empty = (status) => new Response(null, { status });

// === resposta ===

function contentTypeFor(item) {
  let type = item.contentType || (item.headers && item.headers['content-type']) || 'application/octet-stream';
  let path = '';
  try { path = new URL(item.url).pathname.toLowerCase(); } catch (_) { /* fica com o tipo gravado */ }
  if (path.endsWith('.wasm')) type = 'application/wasm';
  else if (/\.m?js$/.test(path) && !/javascript|ecmascript/i.test(type)) type = 'text/javascript';
  else if (path.endsWith('.css') && !/css/i.test(type)) type = 'text/css';
  return type;
}

function headersFor(item) {
  const headers = new Headers();
  for (const name of REPLAYED_HEADERS) {
    const value = item.headers && item.headers[name];
    if (value) { try { headers.set(name, value); } catch (_) { /* valor inválido: fica de fora */ } }
  }
  headers.set('content-type', contentTypeFor(item));
  headers.set('access-control-allow-origin', HERE);
  headers.set('access-control-allow-credentials', 'true');
  headers.set('cross-origin-resource-policy', 'cross-origin');
  headers.set('timing-allow-origin', '*');
  return headers;
}

function decodeHtml(bytes, contentType) {
  const declared = /charset\s*=\s*["']?([^\s;"']+)/i.exec(contentType);
  try { return new TextDecoder(declared ? declared[1] : 'utf-8').decode(bytes); }
  catch (_) { return new TextDecoder('utf-8').decode(bytes); }
}

async function replay(book, request, item, asDocument) {
  if (item.redirect) {
    let target = new URL(item.redirect, item.url);
    // Numa navegação, um destino dentro do site capturado continua na cópia em vez de ir para o site real.
    if (asDocument && target.origin === book.home) target = new URL(target.href.slice(target.origin.length), HERE);
    return new Response(null, { status: REDIRECTS.includes(item.status) ? item.status : 302,
      headers: { location: target.href } });
  }
  const headers = headersFor(item);
  const status = item.status >= 200 && item.status <= 599 ? item.status : 200;
  if (!item.file || BODILESS.includes(status)) {
    return new Response(null, { status: BODILESS.includes(status) ? status : 200, headers });
  }

  const file = new URL(item.file.split('/').map(encodeURIComponent).join('/'), CAPTURE_ROOT);
  const range = request.headers.get('range');
  const stored = await fetch(file, range ? { headers: { range } } : undefined);
  if (!stored.ok) {
    noteMissing(withoutHash(item.url), request, null);
    return empty(404);
  }
  tally.served += 1;

  if (asDocument && /html/i.test(headers.get('content-type'))) {
    const html = decodeHtml(await stored.arrayBuffer(), headers.get('content-type'));
    headers.set('content-type', 'text/html; charset=utf-8');
    return new Response(prepareDocument(html, new URL(item.url).origin), { status, headers });
  }
  if (stored.status === 206) {
    headers.set('content-range', stored.headers.get('content-range') || '');
    headers.set('accept-ranges', 'bytes');
    return new Response(stored.body, { status: 206, headers });
  }
  const media = headers.get('content-type').split('/')[0].toLowerCase();
  if (media === 'video' || media === 'audio') headers.set('accept-ranges', 'bytes');  // o navegador pode pedir pedaços
  return new Response(request.method === 'HEAD' ? null : stored.body, { status, headers });
}

// === documentos ===

/** Roda dentro de cada documento servido, antes dos scripts do site. Não usa nada de fora. */
function documentPatch(siteOrigin) {
  try {
    // O Service Worker do próprio site tomaria o lugar deste.
    const container = navigator.serviceWorker;
    if (container) {
      container.register = () => Promise.reject(new DOMException('Service Worker desligado na cópia local.', 'SecurityError'));
      container.getRegistration = () => Promise.resolve(undefined);
      container.getRegistrations = () => Promise.resolve([]);
    }
  } catch (_) { /* segue */ }
  try {
    // Documento vindo de Service Worker informa transferência zero; alguns sites leem isso como "veio do cache" e pulam a intro.
    const inherited = Object.getOwnPropertyDescriptor(PerformanceResourceTiming.prototype, 'transferSize');
    Object.defineProperty(PerformanceNavigationTiming.prototype, 'transferSize', {
      configurable: true,
      enumerable: true,
      get() {
        const real = inherited.get.call(this);
        return real > 0 ? real : (this.encodedBodySize || 0) + 300;
      },
    });
  } catch (_) { /* segue */ }
  try {
    // Link absoluto para o domínio original continua dentro da cópia.
    window.addEventListener('click', (event) => {
      if (event.defaultPrevented || !event.target || !event.target.closest) return;
      const link = event.target.closest('a[href]');
      if (!link || link.hasAttribute('download')) return;
      let target;
      try { target = new URL(link.getAttribute('href'), document.baseURI); } catch (_) { return; }
      if (target.origin !== siteOrigin) return;
      event.preventDefault();
      location.assign(location.origin + target.pathname + target.search + target.hash);
    });
  } catch (_) { /* segue */ }
}

function prepareDocument(html, siteOrigin) {
  // A política de segurança do original bloquearia o endereço local e o script abaixo.
  const text = html.replace(/<meta\b[^>]*http-equiv\s*=\s*["']?content-security-policy["']?[^>]*>/gi, '');
  const patch = '<script>(' + documentPatch + ')(' + JSON.stringify(siteOrigin).replace(/</g, '\\u003c') + ')</scr' + 'ipt>';
  const anchor = /<head(?:\s[^>]*)?>/i.exec(text) || /<html(?:\s[^>]*)?>/i.exec(text) || /^\s*<!doctype[^>]*>/i.exec(text);
  const at = anchor ? anchor.index + anchor[0].length : 0;
  return text.slice(0, at) + patch + text.slice(at);
}

async function navigate(book, request, url) {
  const href = originalUrl(book, url);
  const item = await findRecording(book, request, href);
  if (item) return replay(book, request, item, true);

  const local = url.origin === HERE;
  const asked = url.pathname + url.search;
  const toStart = () => Response.redirect(new URL(book.start, HERE).href, 302);
  if (local && (url.pathname === '/' || url.pathname === '/index.html') && asked !== book.start) return toStart();

  noteMissing(href, request, null);
  if (request.destination !== 'document') {
    return book.online && !local ? fetch(request) : empty(404);
  }
  // Página não capturada: um clique dentro do site não sai do lugar; um endereço digitado volta ao início.
  return request.referrer || asked === book.start ? empty(204) : toStart();
}

async function respond(request) {
  const book = await openBook();
  if (!book) return fetch(request);
  const url = new URL(request.url);
  if (url.origin === HERE && url.pathname.startsWith('/site/_fd/')) return fetch(request);
  if (request.mode === 'navigate') return navigate(book, request, url);

  if (book.blocked.some((pattern) => pattern.test(request.url))) {
    tally.blocked += 1;
    // Script vazio ainda dispara onload; o resto recebe "sem conteúdo".
    return request.destination === 'script'
      ? new Response('', { status: 200, headers: { 'content-type': 'text/javascript' } })
      : empty(204);
  }

  const href = originalUrl(book, url);
  const item = await findRecording(book, request, href);
  if (item) return replay(book, request, item, false);

  if (request.method === 'GET') {
    const other = book.images.get(imageKey(href));
    if (other) {
      noteMissing(href, request, withoutHash(other.url));
      return replay(book, request, other, false);
    }
  }
  noteMissing(href, request, null);
  if (book.online && (request.method === 'GET' || request.method === 'HEAD')) {
    tally.online += 1;
    try {
      return await fetch(href, { method: request.method, credentials: 'omit',
        mode: request.mode === 'no-cors' ? 'no-cors' : 'cors' });
    } catch (_) { /* sem internet ou recusado: vira 404 */ }
  }
  return empty(404);
}

// === eventos ===

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(openBook().then((book) => { if (!book) throw new Error('índice da captura ilegível'); }));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (!/^https?:/i.test(request.url)) return;
  if (request.cache === 'only-if-cached' && request.mode !== 'same-origin') return;
  event.respondWith(respond(request).catch(() => empty(502)));
});

self.addEventListener('message', (event) => {
  if (!event.source || !event.data || event.data.type !== 'fd:report') return;
  event.source.postMessage({ type: 'fd:report', stats: { ...tally }, misses: [...missing.values()] });
});
