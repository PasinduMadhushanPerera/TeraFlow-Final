@echo off
echo.
echo ====================================
echo    TerraFlow Complete Launch
echo ====================================
echo.

echo Step 1: Starting Backend Server...
echo.
start cmd /k "cd /d TerraflowBackend && echo Starting TerraFlow Backend Server... && node server.js"

echo Waiting for backend to start...
timeout /t 5 /nobreak > nul

echo.
echo Step 2: Starting Frontend Server...
echo.
start cmd /k "cd /d frontend && echo Starting TerraFlow Frontend Server... && npx vite --host 0.0.0.0"

echo Waiting for frontend to start...
timeout /t 8 /nobreak > nul

echo.
echo Step 3: Opening TerraFlow in browser...
echo.
start "" "http://localhost:5173"

echo.
echo ====================================
echo   TerraFlow Launch Complete!
echo ====================================
echo.
echo Backend running on: http://localhost:5000
echo Frontend running on: http://localhost:5173
echo.
echo Press any key to close this window...
pause > nul
