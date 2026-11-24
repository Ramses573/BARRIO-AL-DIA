@echo off
title BARRIO_AL_DIA_MOVIL
setlocal enabledelayedexpansion

echo ========================================================
echo        BARRIO AL DIA - APLICATIVO MOVIL (EXPO)
echo ========================================================
echo.

cd /d "%~dp0"

echo [1/3] Verificando dependencias moviles...
if not exist "mobile\node_modules\" (
    echo [INFO] Instalando dependencias de la App Movil...
    cd mobile
    call npm install
    cd ..
    echo.
)

echo [2/3] Verificando Backend .NET 9 API...
sqllocaldb start MSSQLLocalDB >nul 2>&1
netstat -aon | findstr :5000 | findstr LISTENING >nul
if errorlevel 1 (
    echo [INFO] Backend no estaba activo. Iniciando en segundo plano...
    start /b dotnet run --project backend\BarrioAlDia.Api --launch-profile http > backend_mobile.log 2>&1
    ping 127.0.0.1 -n 4 >nul
) else (
    echo [OK] Backend API ya esta activo y escuchando en el puerto 5000.
)

:: Liberar puerto 8081 de Metro si estuviera retenido
powershell -NoProfile -Command "Get-NetTCPConnection -LocalPort 8081 -State Listen -ErrorAction SilentlyContinue | ForEach-Object { if ($_.OwningProcess -gt 0) { taskkill /F /T /PID $_.OwningProcess >$null 2>&1 } }" >nul 2>&1

:: Detectar IP de red local limpia (sin errores de sintaxis)
set LAN_IP=192.168.0.4
for /f "tokens=*" %%a in ('powershell -NoProfile -Command "(Get-NetIPAddress -AddressFamily IPv4 | Select -Expand IPAddress) -match '^(192\.168\.|10\.)' | Select -First 1"') do (
    if not "%%a"=="" set LAN_IP=%%a
)

:: Forzar a Metro Bundler a enlazar la IP correcta en el codigo QR
set REACT_NATIVE_PACKAGER_HOSTNAME=%LAN_IP%
set EXPO_DEVTOOLS_LISTEN_ADDRESS=0.0.0.0

:: Asegurar que config.js tenga la IP detectada
powershell -NoProfile -Command "$cfgPath = 'mobile\src\config.js'; if (Test-Path $cfgPath) { $c = Get-Content $cfgPath -Raw; $c = $c -replace 'export const DEV_PC_IP = ''.*?''', ('export const DEV_PC_IP = ''' + '%LAN_IP%' + ''''); Set-Content $cfgPath $c -NoNewline }" >nul 2>&1

cd mobile

echo.
echo ========================================================
echo  SELECCIONA EL MODO DE CONEXION:
echo ========================================================
echo  IP asignada de tu PC: %LAN_IP%
echo.
echo  [1] Wi-Fi / Red Local (Misma red - Escanear QR en Expo Go)
echo  [2] Modo Tunel Publico (Datos moviles o routers restringidos)
echo  [3] Modo Web (Navegador en la PC sin celular)
echo ========================================================
echo.
set /p OPCION="Elige una opcion [1, 2 o 3, por defecto 1]: "

if "%OPCION%"=="2" goto MODO_TUNEL
if "%OPCION%"=="3" goto MODO_WEB
goto MODO_LAN

:MODO_TUNEL
echo.
echo [3/3] Iniciando Expo en MODO TUNEL con cache limpia...
echo [INFO] Abre Expo Go en tu celular y escanea el codigo QR que aparecera abajo.
echo.
call npx expo start --tunnel -c
goto FIN

:MODO_WEB
echo.
echo [3/3] Iniciando Expo en MODO WEB...
echo.
call npx expo start --web
goto FIN

:MODO_LAN
echo.
echo [3/3] Iniciando Expo en MODO LAN (Wi-Fi) con cache limpia...
echo [INFO] Abre Expo Go en tu celular y escanea el codigo QR que aparecera abajo.
echo [INFO] El celular y la PC deben estar conectados a la misma red Wi-Fi.
echo.
call npx expo start --lan -c
goto FIN

:FIN
echo.
echo Presiona cualquier tecla para salir...
pause >nul
exit /b