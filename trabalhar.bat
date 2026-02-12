@echo off
title E-BOOK - MODO DESENVOLVIMENTO
cd /d %~dp0

echo ===============================
echo Iniciando servidor DEV...
echo ===============================
echo.

start cmd /k "cd web && npm run dev"

echo Aguardando servidor iniciar...
timeout /t 5 > nul

start http://localhost:3000