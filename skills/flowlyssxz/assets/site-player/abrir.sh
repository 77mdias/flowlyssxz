#!/bin/sh
# Abre a cópia local no navegador. O que vier depois do nome vai para o serve.py (ex.: ./abrir.sh --offline).
# -I: o Python não carrega módulos da pasta da captura (arquivos dela vieram de um site de terceiros).
cd "$(dirname "$0")" || exit 1
command -v python3 >/dev/null 2>&1 && exec python3 -I serve.py --open "$@"
exec python -I serve.py --open "$@"
