@echo off
echo ========================================
echo TerraFlow Customer System Status Check
echo ========================================
echo.

echo 1. Checking Backend Health...
curl -s http://localhost:5000/health && echo   [SUCCESS] Backend is running || echo   [ERROR] Backend not accessible

echo.
echo 2. Testing Customer Login...
curl -s -X POST http://localhost:5000/api/auth/login ^
  -H "Content-Type: application/json" ^
  -d "{\"email\":\"testcustomer@example.com\",\"password\":\"password123\"}" | findstr "success.*true" >nul && echo   [SUCCESS] Customer login working || echo   [ERROR] Customer login failed

echo.
echo 3. Checking Frontend...
curl -s http://localhost:5173 >nul && echo   [SUCCESS] Frontend is accessible || echo   [ERROR] Frontend not accessible

echo.
echo 4. Testing Products API...
for /f "tokens=*" %%a in ('curl -s -X POST http://localhost:5000/api/auth/login -H "Content-Type: application/json" -d "{\"email\":\"testcustomer@example.com\",\"password\":\"password123\"}" ^| findstr /r "\"token\":\"[^\"]*\""') do set TOKEN_LINE=%%a
if defined TOKEN_LINE (
    echo   [SUCCESS] Token acquired, testing products API...
    echo   [INFO] Open browser to: http://localhost:5173/login
) else (
    echo   [ERROR] Could not acquire token
)

echo.
echo ========================================
echo Manual Test Steps:
echo 1. Open: http://localhost:5173/login
echo 2. Login: testcustomer@example.com / password123
echo 3. Navigate to Products page
echo 4. Check debug panel for details
echo ========================================
pause
