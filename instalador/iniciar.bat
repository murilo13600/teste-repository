@echo off
title Financas em Dia
cd /d "%~dp0"
set PORT=47291
start "" /b cmd /c "ping -n 2 127.0.0.1 >nul & start "" http://localhost:47291"
"%~dp0runtime\node.exe" server.js
