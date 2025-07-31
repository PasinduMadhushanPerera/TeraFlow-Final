#!/usr/bin/env powershell

# TerraFlow Complete Startup Script
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "        TerraFlow Startup Script        " -ForegroundColor Cyan  
Write-Host "========================================" -ForegroundColor Cyan

$projectRoot = "C:\Users\ASUS\Desktop\TeraFlow-FInal-Final\TeraFlow-Final"
$backendPath = "$projectRoot\TerraflowBackend"
$frontendPath = "$projectRoot\frontend"

Write-Host "`nStep 1: Killing any existing Node processes..." -ForegroundColor Yellow
Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force
Start-Sleep -Seconds 2

Write-Host "`nStep 2: Starting Backend Server..." -ForegroundColor Yellow
Write-Host "Backend Path: $backendPath" -ForegroundColor Gray

# Start backend in a new window
$backendProcess = Start-Process powershell -ArgumentList @(
    "-NoExit",
    "-Command",
    "cd '$backendPath'; Write-Host 'Starting TerraFlow Backend...' -ForegroundColor Green; node server.js"
) -PassThru

Start-Sleep -Seconds 5

Write-Host "`nStep 3: Starting Frontend Server..." -ForegroundColor Yellow
Write-Host "Frontend Path: $frontendPath" -ForegroundColor Gray

# Start frontend in a new window  
$frontendProcess = Start-Process powershell -ArgumentList @(
    "-NoExit", 
    "-Command",
    "cd '$frontendPath'; Write-Host 'Starting TerraFlow Frontend...' -ForegroundColor Green; npx vite --host 0.0.0.0 --port 5173"
) -PassThru

Write-Host "`nStep 4: Waiting for servers to start..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

Write-Host "`nStep 5: Testing server connectivity..." -ForegroundColor Yellow

# Test backend
try {
    $backend = Invoke-WebRequest -Uri "http://localhost:5000" -Method GET -TimeoutSec 5 -ErrorAction Stop
    Write-Host "✓ Backend server is responding!" -ForegroundColor Green
} catch {
    Write-Host "✗ Backend server is not responding" -ForegroundColor Red
}

# Test frontend  
try {
    $frontend = Invoke-WebRequest -Uri "http://localhost:5173" -Method GET -TimeoutSec 5 -ErrorAction Stop
    Write-Host "✓ Frontend server is responding!" -ForegroundColor Green
} catch {
    Write-Host "✗ Frontend server is not responding" -ForegroundColor Red
}

Write-Host "`nStep 6: Opening TerraFlow in browser..." -ForegroundColor Yellow
Start-Sleep -Seconds 3
Start-Process "http://localhost:5173"

Write-Host "`n========================================" -ForegroundColor Green
Write-Host "       TerraFlow Started Successfully!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host "`nAccess URLs:" -ForegroundColor Cyan
Write-Host "Frontend: http://localhost:5173" -ForegroundColor White
Write-Host "Backend:  http://localhost:5000" -ForegroundColor White
Write-Host "`nBoth servers are running in separate windows." -ForegroundColor Gray
Write-Host "Close those windows to stop the servers." -ForegroundColor Gray

Write-Host "`nPress any key to close this startup script..." -ForegroundColor DarkGray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
