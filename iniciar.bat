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
    cd frontend
    call npm install
    cd ..
    echo.
)

echo [2/4] Liberando puertos 3000 y 5000 si estuvieran ocupados...
powershell -NoProfile -Command "Get-NetTCPConnection -LocalPort 3000, 5000 -State Listen -ErrorAction SilentlyContinue | ForEach-Object { if ($_.OwningProcess -gt 0) { taskkill /F /T /PID $_.OwningProcess >$null 2>&1 } }" >nul 2>&1

echo [3/4] Iniciando Backend .NET 9 API (Puerto 5000)...
start /b dotnet backend\BarrioAlDia.Api\bin\Debug\net9.0\BarrioAlDia.Api.dll > backend.log 2>&1

echo [INFO] Esperando a que el backend inicialice la base de datos...
powershell -NoProfile -Command "for ($i=0; $i -lt 30; $i++) { try { $res = Invoke-RestMethod -Uri http://localhost:5000/api/health -TimeoutSec 1 -ErrorAction Stop; if ($res.status -eq 'Healthy') { exit 0 } } catch {}; Start-Sleep -Milliseconds 400 }; exit 0" >nul 2>&1

echo [4/4] Abriendo Frontend React en el navegador...
start http://localhost:3000

echo.
echo ========================================================
echo  [SISTEMA EN EJECUCION]
echo  - Backend API:    http://localhost:5000/swagger
echo  - Frontend Web:   http://localhost:3000
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