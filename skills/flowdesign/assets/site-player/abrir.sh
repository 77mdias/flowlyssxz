#!/bin/sh
# Abre a cópia local no navegador. O que vier depois do nome vai para o serve.py (ex.: ./abrir.sh --offline).
cd "$(dirname "$0")" || exit 1
command -v python3 >/dev/null 2>&1 && exec python3 serve.py --open "$@"
exec python serve.py --open "$@"
