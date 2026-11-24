@echo off
title BARRIO_AL_DIA_MOVIL

echo ========================================================
echo        BARRIO AL DIA - INICIANDO APLICATIVO MOVIL
echo ========================================================
echo.

cd /d "%~dp0"

echo [1/1] Iniciando servidor de Expo...
echo [INFO] Abre la app Expo Go en tu celular y escanea el codigo QR.
echo [INFO] Para salir presiona Ctrl+C.
echo.

call npm run mobile:start
pause
