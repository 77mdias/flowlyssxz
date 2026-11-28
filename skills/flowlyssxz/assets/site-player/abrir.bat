@echo off
rem Abre a copia local no navegador. O que vier depois do nome vai para o serve.py (ex.: abrir.bat --offline).
rem -I: o Python nao carrega modulos da pasta da captura (arquivos dela vieram de um site de terceiros).
cd /d "%~dp0"
where py >nul 2>nul
if errorlevel 1 (python -I serve.py --open %*) else (py -3 -I serve.py --open %*)
pause
