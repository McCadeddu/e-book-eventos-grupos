@echo off
echo ======================================
echo EXPORTADOR PROJETO PASCOM
echo ======================================

set PROJECT_DIR=%cd%
set EXPORT_DIR=%PROJECT_DIR%\_snapshot_pascom

echo.
echo Limpando snapshot antigo...
rmdir /s /q "%EXPORT_DIR%" 2>nul

echo Criando pasta snapshot...
mkdir "%EXPORT_DIR%"

echo.
echo Copiando arquivos principais...

xcopy pages "%EXPORT_DIR%\pages" /E /I /Y
xcopy lib "%EXPORT_DIR%\lib" /E /I /Y
xcopy scripts "%EXPORT_DIR%\scripts" /E /I /Y

copy package.json "%EXPORT_DIR%"
copy tsconfig.json "%EXPORT_DIR%"
copy next.config.js "%EXPORT_DIR%" 2>nul
copy ebook.json "%EXPORT_DIR%" 2>nul
copy eventos-2026.json "%EXPORT_DIR%" 2>nul
copy grupos.json "%EXPORT_DIR%" 2>nul

echo.
echo Gerando estrutura do projeto...
tree /F /A > "%EXPORT_DIR%\estrutura_projeto.txt"

echo.
echo Compactando snapshot...
powershell Compress-Archive -Path "%EXPORT_DIR%\*" -DestinationPath "%PROJECT_DIR%\snapshot_pascom.zip" -Force

echo.
echo ======================================
echo Snapshot gerado: snapshot_pascom.zip
echo ======================================
pause