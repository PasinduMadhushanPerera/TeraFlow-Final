# TerraFlow Server Startup Script
Write-Host "Starting TerraFlow Servers..." -ForegroundColor Green

# Start Backend Server
Write-Host "`nStarting Backend Server on port 5000..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'C:\Users\ASUS\Desktop\TeraFlow-FInal-Final\TeraFlow-Final\TerraflowBackend'; Write-Host 'Backend Server Starting...' -ForegroundColor Green; node server.js"

# Wait a moment for backend to start
Start-Sleep -Seconds 3

# Start Frontend Server
Write-Host "Starting Frontend Server on port 5173..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'C:\Users\ASUS\Desktop\TeraFlow-FInal-Final\TeraFlow-Final\frontend'; Write-Host 'Frontend Server Starting...' -ForegroundColor Green; npm run dev -- --host 0.0.0.0"

# Wait for servers to start
Start-Sleep -Seconds 5

# Check if servers are running
Write-Host "`nChecking server status..." -ForegroundColor Cyan
$backendCheck = netstat -ano | Select-String ":5000"
$frontendCheck = netstat -ano | Select-String ":5173"

if ($backendCheck) {
    Write-Host "✓ Backend server is running on port 5000" -ForegroundColor Green
} else {
    Write-Host "✗ Backend server is not responding on port 5000" -ForegroundColor Red
}

if ($frontendCheck) {
    Write-Host "✓ Frontend server is running on port 5173" -ForegroundColor Green
} else {
    Write-Host "✗ Frontend server is not responding on port 5173" -ForegroundColor Red
}

Write-Host "`nServers should be starting up..." -ForegroundColor Green
Write-Host "Backend: http://localhost:5000" -ForegroundColor Cyan
Write-Host "Frontend: http://localhost:5173" -ForegroundColor Cyan

# Open the application in browser after a delay
Start-Sleep -Seconds 10
Write-Host "`nOpening TerraFlow in browser..." -ForegroundColor Yellow
Start-Process "http://localhost:5173"

Write-Host "`nPress any key to exit..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
