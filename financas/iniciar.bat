@echo off
title Aurum Financas
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo.
  echo   Node.js nao encontrado. Instale a versao LTS em https://nodejs.org
  echo   Enquanto isso, abrindo o app direto no navegador - os dados ficam so no navegador.
  echo.
  start "" "%~dp0index.html"
  pause
  exit /b
)
node server.js --abrir
if errorlevel 1 pause
