@echo off
echo.
echo ========================================
echo TerraFlow SCM - Backend Startup Script
echo ========================================
echo.

cd /d "%~dp0"

echo [1/4] Checking if MySQL is running...
sc query mysql >nul 2>&1
if %errorlevel% neq 0 (
    echo WARNING: MySQL service might not be running
    echo Please ensure MySQL is started before continuing
    echo.
)

echo [2/4] Checking dependencies...
if not exist "node_modules" (
    echo Installing dependencies...
    npm install
) else (
    echo Dependencies already installed
)

echo [3/4] Setting up database...
npm run setup

echo [4/4] Starting backend server...
echo.
echo Backend will be available at: http://localhost:5000
echo Admin credentials: admin@terraflow.com / admin123
echo API Documentation: http://localhost:5000/api
echo.
echo Press Ctrl+C to stop the server
echo.

npm run dev
