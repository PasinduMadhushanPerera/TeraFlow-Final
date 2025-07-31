@echo off
echo Starting TerraFlow Backend Server...
cd /d "%~dp0TerraflowBackend"
node server.js
pause
