@echo off
title BARRIO_AL_DIA_MOVIL

echo ========================================================
echo        BARRIO AL DIA - INICIANDO APLICATIVO MOVIL
echo ========================================================
echo.

cd /d "%~dp0"

if not exist "mobile\node_modules\" (
    echo [INFO] Instalando dependencias de la App Movil...
    cd mobile
    call npm install
    cd ..
    echo.
)

:: Liberar puerto 8081 de Metro si estuviera tomado
powershell -NoProfile -Command "Get-NetTCPConnection -LocalPort 8081 -State Listen -ErrorAction SilentlyContinue | ForEach-Object { if ($_.OwningProcess -gt 0) { taskkill /F /T /PID $_.OwningProcess >$null 2>&1 } }" >nul 2>&1

cd mobile

echo [OPCIONES DE CONEXION]:
echo  1. Mismo Wi-Fi o Red Local (Recomendado - Mas rapido y estable)
echo  2. Modo Tunel (Si el Wi-Fi bloquea conexiones o usas datos moviles)
echo  3. Abrir en Navegador Web de la PC (Sin usar celular)
echo.
set /p OPCION="Elige una opcion [1, 2 o 3, por defecto 1]: "

if "%OPCION%"=="2" goto MODO_TUNEL
if "%OPCION%"=="3" goto MODO_WEB
goto MODO_LAN

:MODO_TUNEL
echo.
echo [INFO] Iniciando en Modo TUNEL con Expo...
echo [INFO] Abre Expo Go en tu celular y escanea el codigo QR.
echo.
call npx expo start --tunnel -c
goto FIN

:MODO_WEB
echo.
echo [INFO] Iniciando en Modo Web en tu computadora...
echo.
call npx expo start --web
goto FIN

:MODO_LAN
echo.
echo [INFO] Iniciando en Modo Wi-Fi LAN local...
echo [INFO] Tu celular y la PC deben estar en la misma red Wi-Fi.
echo [INFO] Abre Expo Go en tu celular y escanea el codigo QR.
echo.
call npx expo start --lan -c
goto FIN

:FIN
pause
