@echo off
cd /d %~dp0

set /p mensagem=Digite a mensagem do commit: 

git add .
git commit -m "%mensagem%"
git push

pause