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
    echo [INFO] Iniciando Backend en segundo plano...
    start /b dotnet run --project backend\BarrioAlDia.Api --launch-profile http > backend_mobile.log 2>&1
    ping 127.0.0.1 -n 4 >nul
) else (
    echo [OK] Backend API ya esta activo en el puerto 5000.
)

:: Liberar puerto 8081 de Metro si estuviera retenido
powershell -NoProfile -Command "Get-NetTCPConnection -LocalPort 8081 -State Listen -ErrorAction SilentlyContinue | ForEach-Object { if ($_.OwningProcess -gt 0) { taskkill /F /T /PID $_.OwningProcess >$null 2>&1 } }" >nul 2>&1

:: Detectar IP de red local limpia
set LAN_IP=192.168.0.4
for /f "tokens=*" %%a in ('powershell -NoProfile -Command "(Get-NetIPAddress -AddressFamily IPv4 | Select -Expand IPAddress) -match '^(192\.168\.|10\.)' | Select -First 1"') do (
    if not "%%a"=="" set LAN_IP=%%a
)

:: Enlazar IP en Metro Bundler
set REACT_NATIVE_PACKAGER_HOSTNAME=%LAN_IP%
set EXPO_DEVTOOLS_LISTEN_ADDRESS=0.0.0.0

:: Sincronizar IP en config.js
powershell -NoProfile -Command "$cfgPath = 'mobile\src\config.js'; if (Test-Path $cfgPath) { $c = Get-Content $cfgPath -Raw; $c = $c -replace 'export const DEV_PC_IP = ''.*?''', ('export const DEV_PC_IP = ''' + '%LAN_IP%' + ''''); Set-Content $cfgPath $c -NoNewline }" >nul 2>&1

cd mobile

echo.
echo ========================================================
echo  [INICIANDO METRO BUNDLER]
echo  - IP del Servidor: %LAN_IP%
echo  - Abre Expo Go en tu celular y escanea el codigo QR.
echo  - Para detener: presiona Ctrl+C en esta consola.
echo ========================================================
echo.

call npx expo start --lan -c

:: Limpieza automatica al salir
echo.
echo [INFO] Cerrando Metro y liberando puerto 8081...
powershell -NoProfile -Command "Get-NetTCPConnection -LocalPort 8081 -State Listen -ErrorAction SilentlyContinue | ForEach-Object { if ($_.OwningProcess -gt 0) { taskkill /F /T /PID $_.OwningProcess >$null 2>&1 } }" >nul 2>&1
exit /b