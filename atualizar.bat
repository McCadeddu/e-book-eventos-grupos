@echo off
title E-BOOK - ATUALIZAR PROJETO
cd /d %~dp0

echo ===============================
echo Atualizando projeto do GitHub...
echo ===============================
echo.

git pull origin main

pause
