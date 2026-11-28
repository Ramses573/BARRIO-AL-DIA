@echo off
title BARRIO_AL_DIA - DETENER TODO

echo ========================================================
echo        BARRIO AL DIA - DETENIENDO TODOS LOS SERVICIOS
echo ========================================================
echo.

cd /d "%~dp0"

echo [1/3] Cerrando ventanas y procesos de Barrio al Dia...
taskkill /F /FI "WINDOWTITLE eq BARRIO_AL_DIA_TODO*" >nul 2>&1

echo [2/3] Liberando puertos 3000 (Web), 5000 (API) y 8081 (Metro)...
powershell -NoProfile -Command "Get-NetTCPConnection -LocalPort 3000, 5000, 8081 -State Listen -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique | ForEach-Object { if ($_ -gt 0) { Stop-Process -Id $_ -Force -ErrorAction SilentlyContinue } }"

echo [3/3] Cerrando procesos residuales de Backend (.NET), Vite y Expo...
powershell -NoProfile -Command "Get-CimInstance Win32_Process | Where-Object { ($_.CommandLine -like '*BarrioAlDia.Api*' -or $_.CommandLine -like '*vite*' -or $_.CommandLine -like '*expo*' -or $_.CommandLine -like '*localtunnel*' -or $_.CommandLine -like '*localhost.run*' -or $_.Name -eq 'cloudflared.exe' -or ($_.Name -eq 'cmd.exe' -and ($_.CommandLine -like '*npm run dev*' -or $_.CommandLine -like '*npm run preview*'))) -and $_.ProcessId -gt 0 } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }"

echo.
powershell -NoProfile -Command "$busy = Get-NetTCPConnection -LocalPort 3000, 5000, 8081 -State Listen -ErrorAction SilentlyContinue; if ($busy) { Write-Host '[AVISO] Algunos puertos siguen ocupados:' -ForegroundColor Yellow; $busy | Select-Object LocalPort, OwningProcess | Format-Table -AutoSize } else { Write-Host '[OK] Puertos 3000, 5000 y 8081 completamente liberados.' -ForegroundColor Green }"
echo.
timeout /t 2 >nul
exit /b
