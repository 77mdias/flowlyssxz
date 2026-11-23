#!/usr/bin/env python3
"""Confere o servidor do player (assets/site-player/serve.py) contra uma captura mínima montada na hora.

Uso:  python3 tests/test_site_player.py
"""
import http.client
import json
import os
import shutil
import subprocess
import sys
import tempfile
import zlib

PLAYER = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "skills", "flowdesign", "assets", "site-player")
CSS = b"body{color:red}" * 20
INDEX = {
    "version": 1, "captureId": "abc", "onlineFallback": True, "blocked": [], "volatileParams": ["v"],
    "entry": {"url": "https://www.exemplo.com/pagina?ref=1", "path": "/pagina", "search": "?ref=1",
              "file": "site/www.exemplo.com/pagina.html", "contentType": "text/html"},
    "entries": [
        {"url": "https://www.exemplo.com/a%20b/style.css?v=1", "method": "GET", "status": 200,
         "contentType": "text/css; charset=utf-8", "file": "site/www.exemplo.com/a b/style__q1.css"},
        {"url": "https://cdn.outro.com/style.css", "method": "GET", "status": 200,
         "contentType": "text/css", "file": "site/cdn.outro.com/style.css"},
    ],
}


def build(root):
    for name in ("serve.py", "sw.js"):
        target = root if name == "serve.py" else os.path.join(root, "site", "_fd")
        os.makedirs(target, exist_ok=True)
        shutil.copy(os.path.join(PLAYER, name), target)
    files = {
        "index.html": b"<!doctype html><title>entrada</title>",
        "segredo.txt": b"fora de site/",
        "site/_fd/site-index.json": json.dumps(INDEX).encode(),
        "site/www.exemplo.com/a b/style__q1.css": CSS,
        "site/cdn.outro.com/style.css": b"x",
        "site/www.exemplo.com/vazio.bin": b"",
    }
    for name, data in files.items():
        path = os.path.join(root, name)
        os.makedirs(os.path.dirname(path), exist_ok=True)
        with open(path, "wb") as handle:
            handle.write(data)


def main():
    root = tempfile.mkdtemp(prefix="fd-player-")
    build(root)
    expected_port = 20000 + zlib.crc32(b"abc") % 20000
    assert expected_port == 28578, expected_port

    help_run = subprocess.run([sys.executable, os.path.join(PLAYER, "serve.py"), "--help"], capture_output=True, text=True)
    assert help_run.returncode == 0 and "--offline" in help_run.stdout
    lost = subprocess.run([sys.executable, os.path.join(PLAYER, "serve.py")], capture_output=True, text=True)
    assert lost.returncode != 0 and "site-index.json" in lost.stderr, lost

    # De outro diretório e com a saída num pipe, como o capturador faz.
    server = subprocess.Popen([sys.executable, os.path.join(root, "serve.py"), "--offline"],
                              stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, cwd="/")
    try:
        lines = [server.stdout.readline() for _ in range(4)]
        address = lines[1].strip()
        assert address.startswith("Abra: http://www.exemplo.com.localhost:"), lines
        assert address.endswith("/pagina?ref=1") and " " not in address[6:], address
        port = int(address.split(":")[3].split("/")[0])
        assert port >= expected_port, port
        assert "offline" in lines[2].lower(), lines

        link = http.client.HTTPConnection("127.0.0.1", port, timeout=5)

        def ask(path, method="GET", **headers):
            link.request(method, path, headers=headers)
            reply = link.getresponse()
            return reply.status, dict((k.lower(), v) for k, v in reply.getheaders()), reply.read()

        status, head, body = ask("/site/_fd/runtime.json?x=1")
        assert (status, json.loads(body)) == (200, {"offline": True}) and head["cache-control"] == "no-store"

        for path in ("/", "/index.html?a=b", "/rota/que/nao/existe"):
            status, head, body = ask(path)  # mesma conexão: keep-alive
            assert status == 200 and b"entrada" in body and head["cache-control"] == "no-store", path
        status, head, body = ask("/rota", **{"Sec-Fetch-Dest": "document"})
        assert status == 200 and b"entrada" in body
        status, head, body = ask("/rota", **{"Sec-Fetch-Dest": "image"})
        assert (status, head["content-length"], body) == (404, "0", b"")

        status, head, body = ask("/site/_fd/sw.js")
        assert status == 200 and "javascript" in head["content-type"]
        assert head["service-worker-allowed"] == "/" and head["cache-control"] == "no-store"

        status, head, body = ask("/site/www.exemplo.com/a%20b/style__q1.css?qualquer=1")
        assert (status, body) == (200, CSS) and head["accept-ranges"] == "bytes" and head["cache-control"] == "no-cache"
        assert "service-worker-allowed" not in head

        # Sub-recurso que escapou do Service Worker: achado pelo índice, com o tipo gravado.
        for path in ("/a%20b/style.css?v=1", "/a%20b/style.css?v=outro"):
            status, head, body = ask(path, **{"Sec-Fetch-Dest": "empty"})
            assert (status, body, head["content-type"]) == (200, CSS, "text/css; charset=utf-8"), path
        status, _, _ = ask("/style.css", **{"Sec-Fetch-Dest": "style"})  # só existe em outro domínio
        assert status == 404

        for path in ("/site/../segredo.txt", "/site/%2e%2e/segredo.txt", "/site/..%2fsegredo.txt", "/segredo.txt", "/serve.py"):
            status, _, body = ask(path, **{"Sec-Fetch-Dest": "script"})
            assert status == 404 and b"fora" not in body and b"python" not in body, path

        size = len(CSS)
        target = "/site/www.exemplo.com/a%20b/style__q1.css"
        for asked, want_status, want_range, want_body in (
            ("bytes=0-99", 206, "bytes 0-99/%d" % size, CSS[:100]),
            ("bytes=100-", 206, "bytes 100-%d/%d" % (size - 1, size), CSS[100:]),
            ("bytes=-50", 206, "bytes %d-%d/%d" % (size - 50, size - 1, size), CSS[-50:]),
            ("bytes=0-999999999", 206, "bytes 0-%d/%d" % (size - 1, size), CSS),
            ("bytes=%d-" % size, 416, "bytes */%d" % size, b""),
            ("bytes=-0", 416, "bytes */%d" % size, b""),
            ("bytes=0-1,5-6", 200, None, CSS),
            ("itens=0-1", 200, None, CSS),
        ):
            status, head, body = ask(target, Range=asked)
            assert (status, head.get("content-range"), body) == (want_status, want_range, want_body), asked
            assert head["content-length"] == str(len(want_body)), asked
        status, head, body = ask(target, method="HEAD", Range="bytes=0-99")
        assert (status, head["content-length"], body) == (206, "100", b"")
        status, head, body = ask("/site/www.exemplo.com/vazio.bin", Range="bytes=0-9")
        assert (status, head["content-length"]) == (200, "0")

        link.close()
        link = http.client.HTTPConnection("127.0.0.1", port, timeout=5)
        status, _, _ = ask("/", method="POST")
        assert status in (405, 501), status
        link.close()
    finally:
        server.terminate()
        server.wait(timeout=5)
        shutil.rmtree(root, ignore_errors=True)
    print("ok: servidor do player")


if __name__ == "__main__":
    main()
