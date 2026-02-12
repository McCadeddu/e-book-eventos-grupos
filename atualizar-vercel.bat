@echo off
title ATUALIZAR VERCEL
cd /d %~dp0

echo ===============================
echo Atualizando Vercel...
echo ===============================
echo.

set /p mensagem=Mensagem da atualizacao: 

git add .
git commit -m "%mensagem%"
git push

echo.
echo Atualizacao enviada.
echo Aguarde 30-60 segundos e recarregue o site.
echo.

pause