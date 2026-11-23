@echo off
title Barrio al Dia - Detener Servidor

echo ========================================================
echo        BARRIO AL DIA - DETENIENDO SERVICIOS
echo ========================================================
echo.

cd /d "%~dp0"

taskkill /F /T /FI "WINDOWTITLE eq BARRIO_AL_DIA_SERVER*" >nul 2>&1
taskkill /F /T /FI "WINDOWTITLE eq BARRIO_AL_DIA_BACKEND*" >nul 2>&1
taskkill /F /T /FI "WINDOWTITLE eq BARRIO_AL_DIA_TUNNEL*" >nul 2>&1

powershell -NoProfile -Command "Get-NetTCPConnection -LocalPort 3000, 5000 -State Listen -ErrorAction SilentlyContinue | ForEach-Object { if ($_.OwningProcess -gt 0) { taskkill /F /T /PID $_.OwningProcess >$null 2>&1 } }" >nul 2>&1

powershell -NoProfile -Command "Get-CimInstance Win32_Process | Where-Object { ($_.CommandLine -like '*vite*' -or $_.CommandLine -like '*localtunnel*' -or $_.CommandLine -like '*BarrioAlDia.Api*') -and $_.ProcessId -gt 0 } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }" >nul 2>&1

echo.
echo ========================================================
echo  [EXITO] Todos los servicios han sido detenidos:
echo   - Backend .NET 9 API (Puerto 5000 cerrado)
echo   - Frontend Vite (Puerto 3000 cerrado)
echo   - Ventanas de consola finalizadas
echo ========================================================
echo.
ping 127.0.0.1 -n 2 >nul
