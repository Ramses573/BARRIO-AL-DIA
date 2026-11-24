@echo off
title BARRIO_AL_DIA_MOVIL

echo ========================================================
echo        BARRIO AL DIA - INICIANDO APLICATIVO MOVIL
echo ========================================================
echo.

cd /d "%~dp0"

echo [1/1] Iniciando servidor Expo en Modo TUNEL...
echo [INFO] El modo tunel conecta directamente saltando bloqueos de Wi-Fi o Firewall.
echo [INFO] Abre la app Expo Go en tu celular y escanea el codigo QR.
echo.

cd mobile
call npx expo start --tunnel -c
pause
