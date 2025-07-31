@echo off
echo Starting TerraFlow Frontend Server...
cd /d "%~dp0frontend"
npm run dev
pause
