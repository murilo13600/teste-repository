@echo off
title Aurum Financas
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo Node.js nao encontrado. Instale em https://nodejs.org e rode de novo.
  echo Enquanto isso, abrindo o app direto no navegador ^(dados ficam no navegador^).
  start "" "%~dp0index.html"
  pause
  exit /b
)
start "" /b cmd /c "ping -n 2 127.0.0.1 >nul & start "" http://localhost:3000"
node server.js
