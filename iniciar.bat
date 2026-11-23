@echo off
title BARRIO_AL_DIA_SERVER

echo ========================================================
echo        BARRIO AL DIA - INICIANDO SISTEMA INTEGRAL
echo ========================================================
echo.

cd /d "%~dp0"

echo [1/3] Verificando base de datos SQL Server (LocalDB)...
sqllocaldb start MSSQLLocalDB >nul 2>&1

if not exist "frontend\node_modules\" (
    echo [INFO] Instalando dependencias del Frontend...
    call npm install
    echo.
)

powershell -NoProfile -Command "Get-NetTCPConnection -LocalPort 3000, 5000 -State Listen -ErrorAction SilentlyContinue | ForEach-Object { if ($_.OwningProcess -gt 0) { taskkill /F /T /PID $_.OwningProcess >$null 2>&1 } }" >nul 2>&1

echo [2/3] Iniciando Backend .NET 9 Web API en http://localhost:5000 ...
start "BARRIO_AL_DIA_BACKEND" cmd /k "cd /d %~dp0backend\BarrioAlDia.Api && title BARRIO_AL_DIA_BACKEND && dotnet run --launch-profile http"

start "" cmd /c "ping 127.0.0.1 -n 4 >nul && start http://localhost:3000"

echo [3/3] Iniciando Frontend React en http://localhost:3000 ...
echo [INFO] Swagger API disponible en: http://localhost:5000/swagger
echo [INFO] Para detener todo ejecuta detener.bat o presiona Ctrl+C.
echo.

call npm run dev
