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
    echo [INFO] Instalando modulos de la App Movil...
    cd mobile
    call npm install
    cd ..
    echo.
)

echo [2/3] Verificando Backend .NET 9 API...
sqllocaldb start MSSQLLocalDB >nul 2>&1
netstat -aon | findstr :5000 | findstr LISTENING >nul
if errorlevel 1 (
    echo [INFO] Backend no estaba corriendo. Iniciando en segundo plano en esta ventana...
    start /b dotnet run --project backend\BarrioAlDia.Api --launch-profile http
    ping 127.0.0.1 -n 3 >nul
) else (
    echo [OK] Backend API ya esta activo en el puerto 5000.
)

:: Liberar puerto 8081 si estuviera retenido
powershell -NoProfile -Command "Get-NetTCPConnection -LocalPort 8081 -State Listen -ErrorAction SilentlyContinue | ForEach-Object { if ($_.OwningProcess -gt 0) { taskkill /F /T /PID $_.OwningProcess >$null 2>&1 } }" >nul 2>&1

:: Obtener IP local de la computadora para informacion del usuario
set LAN_IP=192.168.0.4
for /f "tokens=*" %%a in ('powershell -NoProfile -Command "(Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.IPAddress -like '192.168*' -or $_.IPAddress -like '10.*' } | Select-Object -First 1).IPAddress"') do (
    set LAN_IP=%%a
)

cd mobile

echo.
echo ========================================================
echo  SELECCIONA EL MODO DE CONEXION:
echo ========================================================
echo  IP de tu PC en la red local: %LAN_IP%
echo.
echo  [1] Red Local / Wi-Fi (Recomendado - Misma red que la PC)
echo  [2] Modo Tunel (Si usas datos moviles o Wi-Fi con restricciones)
echo  [3] Modo Web (Probar en el navegador de la PC)
echo ========================================================
echo.
set /p OPCION="Elige una opcion [1, 2 o 3, por defecto 1]: "

if "%OPCION%"=="2" goto MODO_TUNEL
if "%OPCION%"=="3" goto MODO_WEB
goto MODO_LAN

:MODO_TUNEL
echo.
echo [3/3] Iniciando Expo en MODO TUNEL...
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
echo [3/3] Iniciando Expo en MODO LAN (Wi-Fi)...
echo [INFO] Celular y PC deben estar conectados a la misma red Wi-Fi.
echo [INFO] Abre Expo Go en tu celular y escanea el codigo QR que aparecera abajo.
echo.
call npx expo start --lan -c
goto FIN

:FIN
echo.
echo Presiona cualquier tecla para salir...
pause >nul
exit /b