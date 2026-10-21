@echo off
chcp 65001 >nul
title SV Multimarcas - Servidor local
echo.
echo ========================================
echo  SV MULTIMARCAS - SERVIDOR LOCAL
echo ========================================
echo.
echo O site sera servido em http://localhost:3000
echo A pasta admin fica em http://localhost:3000/admin/
echo.
echo Pressione Ctrl+C para encerrar.
echo.

where node >nul 2>&1
if %errorlevel% neq 0 (
    echo [INFO] Node.js nao encontrado.
    echo.
    echo O site tambem funciona abrindo o arquivo index.html
    echo diretamente no navegador (sem servidor).
    echo.
    start "" "%~dp0index.html"
    pause
    exit /b 0
)

echo [INFO] Iniciando servidor local...
echo.
npx --yes serve@14 -l 3000 "%~dp0"
pause
