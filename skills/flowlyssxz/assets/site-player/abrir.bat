@echo off
rem Abre a copia local no navegador. O que vier depois do nome vai para o serve.py (ex.: abrir.bat --offline).
cd /d "%~dp0"
where py >nul 2>nul
if errorlevel 1 (python serve.py --open %*) else (py -3 serve.py --open %*)
pause
