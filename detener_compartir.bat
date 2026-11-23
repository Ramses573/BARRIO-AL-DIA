@echo off
title Barrio al Dia - Detener Enlace Publico

echo ========================================================
echo        BARRIO AL DIA - DETENIENDO TUNEL PUBLICO
echo ========================================================
echo.

REM 1. Cerrar la ventana del tunel por su titulo exacto
taskkill /F /T /FI "WINDOWTITLE eq BARRIO_AL_DIA_TUNNEL*" >nul 2>&1

REM 2. Matar cualquier proceso localtunnel en segundo plano
powershell -NoProfile -Command "Get-CimInstance Win32_Process | Where-Object { $_.CommandLine -like '*localtunnel*' -and $_.ProcessId -gt 0 } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }" >nul 2>&1

echo.
echo ========================================================
echo  [EXITO] El tunel publico ha sido cerrado por completo.
echo  Tu servidor local sigue funcionando si lo tenias activo.
echo ========================================================
echo.
ping 127.0.0.1 -n 2 >nul
