@echo off
title E-BOOK - PUBLICAR ONLINE
cd /d %~dp0

echo ===============================
echo Publicando alteracoes...
echo ===============================
echo.

set /p mensagem=Digite a mensagem da publicacao: 

git add .
git commit -m "%mensagem%"
git push

echo.
echo Publicacao enviada. A Vercel ira atualizar automaticamente.
echo.

pause