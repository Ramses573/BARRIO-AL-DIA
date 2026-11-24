@echo off
title BARRIO_AL_DIA
setlocal enabledelayedexpansion

echo ========================================================
echo        BARRIO AL DIA - SISTEMA INTEGRAL (WEB + API)
echo ========================================================
echo.

cd /d "%~dp0"

echo [1/4] Verificando base de datos SQL Server (LocalDB)...
sqllocaldb start MSSQLLocalDB >nul 2>&1

if not exist "frontend\node_modules\" (
    echo [INFO] Instalando dependencias del Frontend...
    call npm install
    echo.
)

echo [2/4] Liberando puertos 3000 y 5000 si estuvieran ocupados...
powershell -NoProfile -Command "Get-NetTCPConnection -LocalPort 3000, 5000 -State Listen -ErrorAction SilentlyContinue | ForEach-Object { if ($_.OwningProcess -gt 0) { taskkill /F /T /PID $_.OwningProcess >$null 2>&1 } }" >nul 2>&1

echo.
echo ========================================================
echo  SELECCIONA EL MODO DE EJECUCION:
echo ========================================================
echo  [1] Modo Local (Backend + Frontend en esta misma ventana)
echo  [2] Modo Compartido (Backend + Frontend + Tunel Publico)
echo ========================================================
echo.
set /p MODO="Elige una opcion [1 o 2, por defecto 1]: "

if "%MODO%"=="2" goto MODO_COMPARTIDO
goto MODO_LOCAL

:MODO_LOCAL
echo.
echo [3/4] Iniciando Backend .NET 9 Web API en segundo plano...
start /b dotnet run --project backend\BarrioAlDia.Api --launch-profile http
ping 127.0.0.1 -n 3 >nul

echo [4/4] Abriendo Frontend React en el navegador...
start http://localhost:3000

echo.
echo ========================================================
echo  [SISTEMA EN EJECUCION - VENTANA UNIFICADA]
echo  - Backend API:    http://localhost:5000/swagger
echo  - Frontend Web:   http://localhost:3000
echo  - Para detener:   Presiona Ctrl+C o ejecuta detener.bat
echo ========================================================
echo.

call npm run dev
goto FIN

:MODO_COMPARTIDO
echo.
echo [3/4] Obteniendo clave de acceso para invitados...
set TUNNEL_PASS=
for /f "tokens=*" %%i in ('powershell -NoProfile -Command "(Invoke-WebRequest -Uri https://loca.lt/mytunnelpassword -UseBasicParsing).Content.Trim()"') do set TUNNEL_PASS=%%i

echo.
echo [INFO] Iniciando Backend .NET 9 en segundo plano...
start /b dotnet run --project backend\BarrioAlDia.Api --launch-profile http

echo [INFO] Iniciando Frontend React en segundo plano...
start /b npm run dev
ping 127.0.0.1 -n 4 >nul

echo.
echo =========================================================================
echo  BARRIO AL DIA - MODO COMPARTIDO (ENLACE PUBLICO)
echo =========================================================================
echo  CLAVE DE ACCESO (Tunnel Password): %TUNNEL_PASS%
echo =========================================================================
echo  Cuando abras o compartas el link, si solicita "Tunnel Password",
echo  ingresa la clave mostrada arriba: %TUNNEL_PASS%
echo  Para detener todo: ejecuta detener.bat o presiona Ctrl+C
echo =========================================================================
echo.
echo [4/4] Conectando tunel publico seguro HTTPS...
echo.

call npx --yes localtunnel --port 3000
goto FIN

:FIN
exit /b