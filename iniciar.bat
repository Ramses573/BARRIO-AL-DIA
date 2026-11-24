@echo off
title BARRIO_AL_DIA
setlocal enabledelayedexpansion

echo ========================================================
echo        BARRIO AL DIA - SISTEMA INTEGRAL (WEB + API)
echo ========================================================
echo.

cd /d "%~dp0"

echo [1/3] Verificando base de datos SQL Server (LocalDB)...
sqllocaldb start MSSQLLocalDB >nul 2>&1

if not exist "frontend\node_modules\" (
    echo [INFO] Instalando dependencias del Frontend...
    cd frontend
    call npm install
    cd ..
    echo.
)

echo [2/3] Liberando puertos 3000 y 5000 si estuvieran ocupados...
powershell -NoProfile -Command "Get-NetTCPConnection -LocalPort 3000, 5000 -State Listen -ErrorAction SilentlyContinue | ForEach-Object { if ($_.OwningProcess -gt 0) { taskkill /F /T /PID $_.OwningProcess >$null 2>&1 } }" >nul 2>&1

echo [3/3] Iniciando Backend .NET 9 API (Puerto 5000)...
start /b dotnet run --project backend\BarrioAlDia.Api --launch-profile http > backend.log 2>&1
ping 127.0.0.1 -n 4 >nul

start http://localhost:3000

echo.
echo ========================================================
echo  [SISTEMA EN EJECUCION]
echo  - Frontend Web:   http://localhost:3000
echo  - Backend API:    http://localhost:5000/swagger
echo  -------------------------------------------------------
echo  Para detener todo: presiona Ctrl+C en esta ventana.
echo ========================================================
echo.

call npm run dev

:: Limpieza automatica al cerrar Vite con Ctrl+C
echo.
echo [INFO] Deteniendo servicios y liberando puertos...
powershell -NoProfile -Command "Get-NetTCPConnection -LocalPort 3000, 5000 -State Listen -ErrorAction SilentlyContinue | ForEach-Object { if ($_.OwningProcess -gt 0) { taskkill /F /T /PID $_.OwningProcess >$null 2>&1 } }" >nul 2>&1
powershell -NoProfile -Command "Get-CimInstance Win32_Process | Where-Object { ($_.CommandLine -like '*vite*' -or $_.CommandLine -like '*BarrioAlDia.Api*') -and $_.ProcessId -gt 0 } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }" >nul 2>&1
echo [OK] Todos los servicios detenidos correctamente.
exit /b