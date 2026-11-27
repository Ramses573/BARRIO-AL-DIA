@echo off
title BARRIO_AL_DIA_TODO
setlocal enabledelayedexpansion

echo ========================================================
echo   BARRIO AL DIA - INICIALIZADOR MAESTRO INTEGRAL
echo   (SQL SERVER LOCALDB + BACKEND .NET 9 + WEB + MOVIL)
echo ========================================================
echo.

cd /d "%~dp0"

echo [1/6] Verificando base de datos SQL Server (LocalDB)...
sqllocaldb start MSSQLLocalDB >nul 2>&1

echo [2/6] Verificando dependencias npm...
if not exist "frontend\node_modules\" (
    echo [INFO] Instalando dependencias de Frontend Web...
    cd frontend && call npm install && cd ..
)
if not exist "mobile\node_modules\" (
    echo [INFO] Instalando dependencias de App Movil...
    cd mobile && call npm install && cd ..
)

echo [3/6] Liberando puertos 3000 (Web), 5000 (API) y 8081 (Metro)...
powershell -NoProfile -Command "Get-NetTCPConnection -LocalPort 3000, 5000, 8081 -State Listen -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique | ForEach-Object { if ($_ -gt 0) { Stop-Process -Id $_ -Force -ErrorAction SilentlyContinue } }"
powershell -NoProfile -Command "Get-CimInstance Win32_Process | Where-Object { ($_.CommandLine -like '*BarrioAlDia.Api*' -or $_.CommandLine -like '*vite*' -or $_.CommandLine -like '*expo*') -and $_.ProcessId -gt 0 } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }"

:: Detectar IP de red local limpia
set LAN_IP=192.168.0.4
for /f "tokens=*" %%a in ('powershell -NoProfile -Command "(Get-NetIPAddress -AddressFamily IPv4 | Select -Expand IPAddress) -match '^(192\.168\.|10\.)' | Select -First 1"') do (
    if not "%%a"=="" set LAN_IP=%%a
)

set REACT_NATIVE_PACKAGER_HOSTNAME=%LAN_IP%
set EXPO_DEVTOOLS_LISTEN_ADDRESS=0.0.0.0

:: Sincronizar IP en mobile\src\config.js
powershell -NoProfile -Command "$cfgPath = 'mobile\src\config.js'; if (Test-Path $cfgPath) { $c = Get-Content $cfgPath -Raw; $c = $c -replace 'export const DEV_PC_IP = ''.*?''', ('export const DEV_PC_IP = ''' + '%LAN_IP%' + ''''); Set-Content $cfgPath $c -NoNewline }" >nul 2>&1

:: Regla de Firewall para que el celular no sufra bloqueos de Windows Defender
netsh advfirewall firewall show rule name="BarrioAlDia_Backend" >nul 2>&1
if errorlevel 1 (
    echo [INFO] Asegurando regla de Firewall en puertos 5000 y 3000 para acceso desde celular...
    powershell -NoProfile -Command "Start-Process cmd -ArgumentList '/c netsh advfirewall firewall add rule name=\"BarrioAlDia_Backend\" dir=in action=allow protocol=TCP localport=5000,3000 profile=any' -Verb RunAs -Wait" >nul 2>&1
)

echo [4/6] Iniciando Backend .NET 9 API (Puerto 5000 en 0.0.0.0)...
if not exist "backend\BarrioAlDia.Api\bin\Debug\net9.0\BarrioAlDia.Api.dll" (
    echo [INFO] Compilando Backend .NET 9...
    dotnet build backend\BarrioAlDia.Api\BarrioAlDia.Api.csproj -c Debug
)
set ASPNETCORE_ENVIRONMENT=Development
start /b cmd /c "dotnet backend\BarrioAlDia.Api\bin\Debug\net9.0\BarrioAlDia.Api.dll --urls http://0.0.0.0:5000 > backend.log 2>&1"

echo [INFO] Calentando Base de Datos y canal de chat en tiempo real...
powershell -NoProfile -Command "for ($i=0; $i -lt 30; $i++) { try { $res = Invoke-RestMethod -Uri http://localhost:5000/api/health -TimeoutSec 1 -ErrorAction Stop; if ($res.status -eq 'Healthy') { $null = Invoke-RestMethod -Uri http://localhost:5000/api/chat/ticket/GENERAL -TimeoutSec 2 -ErrorAction SilentlyContinue; exit 0 } } catch {}; Start-Sleep -Milliseconds 400 }; exit 0" >nul 2>&1

echo [5/6] Iniciando Frontend React Vite (Puerto 3000)...
start /b cmd /c "npm run dev > frontend.log 2>&1"

echo [INFO] Esperando inicio de interfaz web...
powershell -NoProfile -Command "for ($i=0; $i -lt 25; $i++) { try { $res = Invoke-WebRequest -Uri http://localhost:3000 -UseBasicParsing -TimeoutSec 1 -ErrorAction Stop; if ($res.StatusCode -eq 200) { exit 0 } } catch {}; Start-Sleep -Milliseconds 300 }; exit 0" >nul 2>&1

echo [INFO] Abriendo aplicacion Web en el navegador...
start http://localhost:3000

echo [6/6] Iniciando Metro Bundler para Aplicacion Movil...
echo.
echo ========================================================
echo   [SISTEMA EN LINEA Y CALENTADO AL 100%%]
echo   - Backend .NET 9 API: http://localhost:5000/swagger
echo   - Frontend React Web: http://localhost:3000
echo   - IP Servidor Movil:  http://%LAN_IP%:5000/api
echo   - Escanea el QR abajo con la camara de Expo Go
echo   ------------------------------------------------------
echo   Para detener todo el sistema: ejecuta detener_todo.bat
echo ========================================================
echo.

cd mobile
call npx expo start --lan -c

:: Limpieza automatica si Metro termina normalmente
echo.
echo [INFO] Deteniendo servicios y liberando puertos...
powershell -NoProfile -Command "Get-NetTCPConnection -LocalPort 3000, 5000, 8081 -State Listen -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique | ForEach-Object { if ($_ -gt 0) { Stop-Process -Id $_ -Force -ErrorAction SilentlyContinue } }"
powershell -NoProfile -Command "Get-CimInstance Win32_Process | Where-Object { ($_.CommandLine -like '*BarrioAlDia.Api*' -or $_.CommandLine -like '*vite*' -or $_.CommandLine -like '*expo*') -and $_.ProcessId -gt 0 } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }"
echo [OK] Todos los servicios detenidos correctamente.
exit /b
