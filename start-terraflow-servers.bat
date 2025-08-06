@echo off
echo Starting TerraFlow Backend Server...
cd /d "c:\Users\ASUS\Desktop\TeraFlow-FInal-Final\TeraFlow-Final\TerraflowBackend"
start "Backend Server" cmd /k "npm start"

echo Waiting 5 seconds before starting frontend...
timeout /t 5 /nobreak > nul

echo Starting TerraFlow Frontend Server...
cd /d "c:\Users\ASUS\Desktop\TeraFlow-FInal-Final\TeraFlow-Final\frontend"
start "Frontend Server" cmd /k "npx vite --port 3000"

echo Both servers starting...
echo Backend: http://localhost:5000
echo Frontend: http://localhost:3000
echo Admin Orders: http://localhost:3000/admin/orders

pause
