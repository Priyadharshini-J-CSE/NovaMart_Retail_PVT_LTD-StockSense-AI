@echo off
echo Starting StockSense...
echo.

echo [1/2] Starting Backend API on port 4000...
start "StockSense Backend" cmd /k "cd /d "%~dp0backend" && node server.js"

timeout /t 2 /nobreak >nul

echo [2/2] Starting Frontend on port 5173...
start "StockSense Frontend" cmd /k "cd /d "%~dp0frontend" && npm run dev"

echo.
echo StockSense is starting up!
echo   Landing Page:  http://localhost:5173
echo   Dashboard:     http://localhost:5173/dashboard
echo   Backend API:   http://localhost:4000/api/kpis
echo.
pause
