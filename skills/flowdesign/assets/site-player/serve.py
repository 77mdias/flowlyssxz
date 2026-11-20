#!/usr/bin/env python3
"""flowdesign: reproduz no seu computador um site capturado.

A cópia abre em http://<domínio-original>.localhost:<porta>/ . Nomes terminados em .localhost apontam
para a sua própria máquina, e o site continua vendo o domínio dele no endereço.
Só aceita conexões do próprio computador. Requer Python 3.8 ou mais novo, sem instalar nada.
"""
import argparse
import ipaddress
import json
import mimetypes
import os
import re
import socket
import sys
import threading
import webbrowser
import zlib
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import unquote, urlsplit

CAPTURE = os.path.realpath(os.path.dirname(os.path.abspath(__file__)))
SITE = os.path.realpath(os.path.join(CAPTURE, "site"))
PLAYER = os.path.join(SITE, "_fd")
ENTRY_PAGE = os.path.join(CAPTURE, "index.html")
RUNTIME_ROUTE = "/site/_fd/runtime.json"
NAVIGATION_DESTS = {"", "document", "iframe", "frame"}
ONE_RANGE = re.compile(r"^bytes=(\d*)-(\d*)$")

# Tipos que o palpite do sistema erra ou desconhece. O do sw.js e o do .wasm são os que quebram a cópia.
TYPES = {
    "html": "text/html; charset=utf-8", "js": "text/javascript", "mjs": "text/javascript",
    "css": "text/css", "json": "application/json", "wasm": "application/wasm",
    "svg": "image/svg+xml", "webp": "image/webp", "avif": "image/avif", "ktx2": "image/ktx2",
    "hdr": "image/vnd.radiance", "woff2": "font/woff2", "woff": "font/woff", "ttf": "font/ttf",
    "otf": "font/otf", "glb": "model/gltf-binary", "gltf": "model/gltf+json",
    "mp4": "video/mp4", "webm": "video/webm", "mp3": "audio/mpeg",
    "m3u8": "application/vnd.apple.mpegurl",
    "riv": "application/octet-stream", "splinecode": "application/octet-stream",
}


def file_within(base, relative):
    """Caminho real de `relative` dentro de `base`, ou None se sair da pasta ou não for arquivo."""
    try:
        full = os.path.realpath(os.path.join(base, relative.lstrip("/")))
        inside = os.path.commonpath([base, full]) == base
    except ValueError:  # byte nulo no caminho, ou outra unidade de disco no Windows
        return None
    return full if inside and os.path.isfile(full) else None


def type_of(path):
    ext = os.path.splitext(path)[1][1:].lower()
    return TYPES.get(ext) or mimetypes.guess_type(path)[0] or "application/octet-stream"


def byte_window(header, size):
    """(início, fim) pedido em Range, None para mandar tudo, ou False se o intervalo não existe."""
    found = ONE_RANGE.match((header or "").strip())
    if not found or size == 0:
        return None
    first, last = found.groups()
    if first == "" and last == "":
        return None
    if first == "":  # bytes=-N: os últimos N
        tail = int(last)
        return (max(size - tail, 0), size - 1) if tail else False
    start = int(first)
    end = min(int(last), size - 1) if last else size - 1
    return (start, end) if start <= end and start < size else False


def local_host(entry_url):
    name = (urlsplit(entry_url).hostname or "").lower()
    try:
        ipaddress.ip_address(name)
        return "localhost"
    except ValueError:
        pass
    if not name or name == "localhost" or name.endswith(".localhost") or len(name) > 200:
        return "localhost"
    return name + ".localhost"


def port_is_free(port):
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as probe:
        try:
            probe.bind(("127.0.0.1", port))
            return True
        except OSError:
            return False


def stable_port(capture_id):
    """Sempre a mesma porta para a mesma captura: o Service Worker pertence a host + porta."""
    port = 20000 + (zlib.crc32(capture_id.encode("utf-8")) & 0xFFFFFFFF) % 20000
    while not port_is_free(port):
        port += 1
    return port


def fallback_table(index):
    """Recursos da origem de entrada por caminho, para pedidos que chegam sem passar pelo Service Worker."""
    home = urlsplit(index.get("entry", {}).get("url", ""))
    table = {}
    for item in index.get("entries", []):
        if item.get("method") != "GET" or not item.get("file"):
            continue
        url = urlsplit(item.get("url", ""))
        if (url.scheme, url.netloc) != (home.scheme, home.netloc):
            continue
        path = url.path or "/"
        for key in (path + "?" + url.query if url.query else path, path):
            table.setdefault(key, item)
    return table


class Player(BaseHTTPRequestHandler):
    protocol_version = "HTTP/1.1"
    offline = False
    table = {}

    def log_message(self, *args):
        pass

    def do_GET(self):
        self.answer()

    def do_HEAD(self):
        self.answer()

    def answer(self):
        target = self.path.split("#", 1)[0]
        raw_path = target.split("?", 1)[0]
        path = unquote(raw_path)

        if raw_path == RUNTIME_ROUTE:
            return self.send_bytes(json.dumps({"offline": self.offline}).encode(), "application/json")
        if path in ("/", "/index.html"):
            return self.send_entry_page()
        if path.startswith("/site/"):
            found = file_within(SITE, path[len("/site/"):])
            if found:
                own = os.path.commonpath([PLAYER, found]) == PLAYER
                return self.send_file(found, type_of(found), "no-store" if own else "no-cache")
        # Sem Service Worker ainda (primeira visita, endereço profundo): a página de entrada o registra.
        if self.headers.get("Sec-Fetch-Dest", "").strip().lower() in NAVIGATION_DESTS:
            return self.send_entry_page()
        item = self.table.get(target) or self.table.get(raw_path)
        found = item and file_within(CAPTURE, item["file"])
        if found:
            return self.send_file(found, item.get("contentType") or type_of(found), "no-cache")
        self.send_response(404)
        self.send_header("Content-Length", "0")
        self.end_headers()

    def send_entry_page(self):
        self.send_file(ENTRY_PAGE, TYPES["html"], "no-store")

    def send_bytes(self, body, content_type):
        self.send_response(200)
        self.send_header("Content-Type", content_type)
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        if self.command != "HEAD":
            self.wfile.write(body)

    def send_file(self, path, content_type, cache):
        try:
            source = open(path, "rb")
        except OSError:
            self.send_response(404)
            self.send_header("Content-Length", "0")
            self.end_headers()
            return
        with source:
            size = os.fstat(source.fileno()).st_size
            window = byte_window(self.headers.get("Range"), size)
            if window is False:
                self.send_response(416)
                self.send_header("Content-Range", "bytes */%d" % size)
                self.send_header("Content-Length", "0")
                self.end_headers()
                return
            start, end = window or (0, size - 1)
            length = end - start + 1
            self.send_response(206 if window else 200)
            self.send_header("Content-Type", content_type)
            self.send_header("Content-Length", str(length))
            self.send_header("Accept-Ranges", "bytes")
            if window:
                self.send_header("Content-Range", "bytes %d-%d/%d" % (start, end, size))
            if path == os.path.join(PLAYER, "sw.js"):
                self.send_header("Service-Worker-Allowed", "/")
            self.send_header("Cache-Control", cache)
            self.end_headers()
            if self.command == "HEAD":
                return
            source.seek(start)
            while length > 0:
                chunk = source.read(min(length, 256 * 1024))
                if not chunk:
                    break
                self.wfile.write(chunk)
                length -= len(chunk)


class Loopback(ThreadingHTTPServer):
    daemon_threads = True

    def handle_error(self, request, client_address):
        pass  # aba fechada no meio de um vídeo não é erro


class Loopback6(Loopback):
    address_family = socket.AF_INET6


def fail(message):
    sys.stderr.write(message + "\n")
    sys.exit(1)


def read_options(argv):
    parser = argparse.ArgumentParser(prog="serve.py", description=__doc__,
                                     formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--open", action="store_true", help="abre o navegador no endereço da cópia")
    parser.add_argument("--port", type=int, metavar="N",
                        help="escuta na porta N (sem isso, a porta é sempre a mesma para esta captura)")
    parser.add_argument("--offline", action="store_true",
                        help="o que não foi capturado não é buscado na internet")
    return parser.parse_known_args(argv)[0]  # argumento desconhecido não derruba o servidor


def main(argv):
    options = read_options(argv)
    try:
        with open(os.path.join(PLAYER, "site-index.json"), encoding="utf-8") as handle:
            index = json.load(handle)
    except (OSError, ValueError):
        index = None
    if not index:
        fail("Não achei a captura (site/_fd/site-index.json). Rode o serve.py que está dentro da pasta da captura.")

    entry = index.get("entry") or {}
    port = options.port or stable_port(index.get("captureId") or CAPTURE)

    Player.offline = options.offline
    Player.table = fallback_table(index)
    try:
        server = Loopback(("127.0.0.1", port), Player)
    except OSError as error:
        fail("Não consegui usar a porta %d (%s). Feche o outro programa ou escolha outra com --port." % (port, error))
    try:  # alguns sistemas resolvem *.localhost primeiro para IPv6
        threading.Thread(target=Loopback6(("::1", port), Player).serve_forever, daemon=True).start()
    except OSError:
        pass

    address = "http://%s:%d%s%s" % (local_host(entry.get("url", "")), port, entry.get("path") or "/", entry.get("search") or "")
    for line in (
        "flowdesign: cópia local de %s" % (entry.get("url") or "?"),
        "Abra: %s" % address,
        "Modo offline: nada é buscado na internet." if Player.offline
        else "O que faltou na captura é buscado na internet (use --offline para impedir).",
        "Deixe esta janela aberta enquanto usa a cópia. Ctrl+C encerra.",
    ):
        print(line, flush=True)

    if options.open:
        def launch():
            try:
                webbrowser.open(address)
            except Exception:
                pass
        threading.Timer(0.4, launch).start()
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass


if __name__ == "__main__":
    main(sys.argv[1:])
