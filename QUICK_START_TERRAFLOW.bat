@echo off
echo 🚀 Starting TerraFlow Application...

echo ⏹️  Stopping existing processes...
taskkill /f /im node.exe >nul 2>&1

echo 🔧 Starting Backend Server...
start "TerraFlow Backend" cmd /k "cd /d C:\Users\ASUS\Desktop\TeraFlow-FInal-Final\TeraFlow-Final\TerraflowBackend && node server.js"

timeout /t 3 >nul

echo 🌐 Starting Frontend Server...
start "TerraFlow Frontend" cmd /k "cd /d C:\Users\ASUS\Desktop\TeraFlow-FInal-Final\TeraFlow-Final\frontend && npx vite --host localhost"

timeout /t 5 >nul

echo 🌍 Opening TerraFlow in browser...
start http://localhost:5173

echo ✅ TerraFlow is now running!
echo 📊 Frontend: http://localhost:5173
echo 🔧 Backend: http://localhost:5000  
echo 👤 Admin Login: admin@terraflow.com / admin123
echo 🛒 Customer Products: Real database images now loaded!
echo 💾 Database: XAMPP MySQL on localhost:3306
pause
