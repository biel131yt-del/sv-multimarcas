@echo off
chcp 65001 >nul
title SV Multimarcas - Instalacao de ferramentas
echo.
echo ========================================
echo  SV MULTIMARCAS - PREPARAR DEPLOY
echo ========================================
echo.
echo Este script:
echo  1. Instala o Node.js (se nao estiver)
echo  2. Instala a CLI da Vercel
echo  3. Conecta o projeto a uma conta Vercel
echo.
echo O site JA FUNCIONA sem isso - use ABRIR SITE.bat
echo ou RODAR LOCAL.bat para Developing.
echo.

where node >nul 2>&1
if %errorlevel% neq 0 (
    echo [INFO] Node.js nao encontrado. Baixando instalador...
    powershell -Command "$ProgressPreference = 'SilentlyContinue'; Invoke-WebRequest -Uri 'https://nodejs.org/dist/v20.15.0/node-v20.15.0-x64.msi' -OutFile '%TEMP%\nodejs-installer.msi'"
    if %errorlevel% neq 0 (
        echo [ERRO] Falha ao baixar o Node.js.
        pause
        exit /b 1
    )
    echo [INFO] Instalando Node.js...
    msiexec /i "%TEMP%\nodejs-installer.msi" /quiet /norestart
    echo [OK] Node.js instalado. Feche e abra o terminal novamente.
    pause
    exit /b 0
)

echo [OK] Node.js ja esta instalado: 
node --version

echo.
echo [INFO] Instalando a CLI da Vercel...
call npm install -g vercel
if %errorlevel% neq 0 (
    echo [AVISO] Falha ao instalar a CLI. Voce pode instalar manualmente com: npm i -g vercel
) else (
    echo [OK] Vercel CLI instalada.
)

echo.
echo ========================================
echo  DEPLOY NA VERCEL
echo ========================================
echo.
echo Execute os comandos abaixo no terminal:
echo.
echo   cd /d "%~dp0"
echo   vercel login
echo   vercel
echo.
echo Na primeira vez, responda:
echo   - Framework: Other
echo   - Build command: (deixe vazio)
echo   - Output directory: . (raiz)
echo.
echo Para configurar o banco de dados, na Vercel adicione:
echo   SUPABASE_URL
echo   SUPABASE_SERVICE_ROLE_KEY
echo.
echo As variaveis podem ser definidas tambem no arquivo .env.local
echo (copie o .env.example e preencha).
echo.
pause
