@echo off
echo ========================================
echo    TerraFlow SCM - Quick Start
echo ========================================
echo.

echo Starting TerraFlow Backend Server...
echo.
cd /d "c:\Users\ASUS\Desktop\TerraFlow_SCM_Final\TerraFlow_SCM_Final\TerraflowBackend"
start "TerraFlow Backend" cmd /c "node server.js & pause"

timeout /t 3 /nobreak > nul

echo Starting TerraFlow Frontend Server...
echo.
cd /d "c:\Users\ASUS\Desktop\TerraFlow_SCM_Final\TerraFlow_SCM_Final\frontend"
start "TerraFlow Frontend" cmd /c "npx vite & pause"

echo.
echo ========================================
echo Both servers are starting...
echo.
echo Backend:  http://localhost:5000
echo Frontend: http://localhost:5174
echo.
echo Default Admin Login:
echo Email:    admin@terraflow.com
echo Password: admin123
echo ========================================
echo.
pause
