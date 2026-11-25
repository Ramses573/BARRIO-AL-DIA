@echo off
title BARRIO_AL_DIA - DETENER TODO

echo ========================================================
echo        BARRIO AL DIA - DETENIENDO TODOS LOS SERVICIOS
echo ========================================================
echo.

cd /d "%~dp0"

echo [1/2] Liberando puertos 3000 (Web), 5000 (API) y 8081 (Metro)...
powershell -NoProfile -Command "Get-NetTCPConnection -LocalPort 3000, 5000, 8081 -State Listen -ErrorAction SilentlyContinue | ForEach-Object { if ($_.OwningProcess -gt 0) { taskkill /F /T /PID $_.OwningProcess >$null 2>&1 } }" >nul 2>&1

echo [2/2] Cerrando procesos residuales de Backend, Vite y Expo...
powershell -NoProfile -Command "Get-CimInstance Win32_Process | Where-Object { ($_.CommandLine -like '*vite*' -or $_.CommandLine -like '*BarrioAlDia.Api*' -or $_.CommandLine -like '*expo*' -or $_.CommandLine -like '*localtunnel*') -and $_.ProcessId -gt 0 } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }" >nul 2>&1

echo.
echo ========================================================
echo  [OK] Todos los servicios han sido detenidos:
echo   - Backend .NET 9 API (Puerto 5000 liberado)
echo   - Frontend React Web (Puerto 3000 liberado)
echo   - Expo Metro Movil   (Puerto 8081 liberado)
echo ========================================================
echo.
timeout /t 2 >nul
exit /b
