@echo off
chcp 65001 >nul
title SV Multimarcas - Publicar no ar
cd /d "%~dp0"

echo.
echo ========================================
echo  PUBLICAR NO AR
echo ========================================
echo.
echo 1. Commit das alteracoes
echo 2. Push para o GitHub
echo 3. Deploy na Vercel
echo.

set /p MSG=Mensagem do commit (Enter = "atualizacoes"): 
if "%MSG%"=="" set MSG=atualizacoes

git add -A
git commit -q -m "%MSG%"
if errorlevel 1 (
    echo.
    echo [INFO] Nada novo para commitar - seguindo para o deploy.
) else (
    echo [OK] Commit criado.
)

git push origin main
if errorlevel 1 (
    echo.
    echo [ERRO] Falha no push. Verifique sua conexao e o login do Git.
    pause
    exit /b 1
)
echo [OK] Enviado para o GitHub.

echo.
echo [INFO] Publicando na Vercel...
set "PATH=%APPDATA%\npm;C:\Program Files\nodejs;%PATH%"
"%APPDATA%\npm\vercel.cmd" --prod --yes

echo.
echo ========================================
echo  PRONTO - site atualizado
echo ========================================
echo.
echo  https://sv-multimarcas.vercel.app
echo.
pause
