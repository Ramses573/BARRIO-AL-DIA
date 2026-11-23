@echo off
title BARRIO_AL_DIA_TUNNEL

echo ========================================================
echo        BARRIO AL DIA - ENLACE PUBLICO POR INTERNET
echo ========================================================
echo.

cd /d "%~dp0"

REM Verificar si el servidor local esta activo en el puerto 3000
netstat -aon | findstr :3000 | findstr LISTENING >nul
if errorlevel 1 (
    echo [INFO] El servidor local no esta encendido. Iniciando servidor en ventana separada...
    start "BARRIO_AL_DIA_SERVER" cmd /c "%~dp0iniciar.bat"
    echo [INFO] Esperando 5 segundos a que inicie Vite...
    ping 127.0.0.1 -n 6 >nul
)

echo [INFO] Obteniendo clave de acceso para invitados...
for /f "tokens=*" %%i in ('powershell -NoProfile -Command "(Invoke-WebRequest -Uri https://loca.lt/mytunnelpassword -UseBasicParsing).Content.Trim()"') do set TUNNEL_PASS=%%i

echo.
echo =========================================================================
echo  CLAVE DE ACCESO PARA INVITADOS: %TUNNEL_PASS%
echo =========================================================================
echo  Cuando abras o envies el link, si la pagina pide "Tunnel Password",
echo  ingresa o comparte este codigo: %TUNNEL_PASS%
echo =========================================================================
echo.
echo [INFO] Conectando y generando enlace publico HTTPS...
echo [INFO] Para detener el enlace en cualquier momento ejecuta: detener_compartir.bat
echo.

call npx --yes localtunnel --port 3000
