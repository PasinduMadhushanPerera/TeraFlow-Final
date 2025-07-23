# 🔧 TerraFlow Complete System Test

Write-Host "🧪 TerraFlow System Status Check" -ForegroundColor Cyan
Write-Host "=================================" -ForegroundColor Cyan

# Test 1: Backend Health
Write-Host "1. Testing Backend Health..." -ForegroundColor Yellow
try {
    $health = Invoke-RestMethod -Uri "http://localhost:5000/health"
    if ($health.status -eq "healthy") {
        Write-Host "   ✅ Backend is healthy" -ForegroundColor Green
    } else {
        Write-Host "   ❌ Backend unhealthy: $($health.status)" -ForegroundColor Red
    }
} catch {
    Write-Host "   ❌ Backend not responding: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 2: Frontend Response
Write-Host "`n2. Testing Frontend Response..." -ForegroundColor Yellow
try {
    $frontend = Invoke-WebRequest -Uri "http://localhost:5173" -TimeoutSec 5
    if ($frontend.StatusCode -eq 200) {
        Write-Host "   ✅ Frontend is responding (Status: $($frontend.StatusCode))" -ForegroundColor Green
    } else {
        Write-Host "   ⚠️  Frontend response: $($frontend.StatusCode)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "   ❌ Frontend not responding: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 3: Admin Login
Write-Host "`n3. Testing Admin Login..." -ForegroundColor Yellow
try {
    $loginData = @{
        email = "admin@terraflow.com"
        password = "admin123"
    } | ConvertTo-Json

    $loginResponse = Invoke-RestMethod -Uri "http://localhost:5000/api/auth/login" -Method POST -ContentType "application/json" -Body $loginData
    
    if ($loginResponse.success) {
        Write-Host "   ✅ Admin login successful" -ForegroundColor Green
        $token = $loginResponse.token
        
        # Test 4: Products API
        Write-Host "`n4. Testing Products API..." -ForegroundColor Yellow
        $headers = @{ "Authorization" = "Bearer $token" }
        
        try {
            $products = Invoke-RestMethod -Uri "http://localhost:5000/api/admin/products" -Method GET -Headers $headers
            if ($products.success) {
                Write-Host "   ✅ Products API working (Count: $($products.data.Count))" -ForegroundColor Green
                
                # Check for image columns in first product
                if ($products.data.Count -gt 0) {
                    $firstProduct = $products.data[0]
                    Write-Host "   📦 Sample product has image_url: $($firstProduct.PSObject.Properties.Name -contains 'image_url')" -ForegroundColor Blue
                    Write-Host "   📦 Sample product has gallery_images: $($firstProduct.PSObject.Properties.Name -contains 'gallery_images')" -ForegroundColor Blue
                }
            } else {
                Write-Host "   ❌ Products API failed: $($products.message)" -ForegroundColor Red
            }
        } catch {
            Write-Host "   ❌ Products API error: $($_.Exception.Message)" -ForegroundColor Red
        }
        
    } else {
        Write-Host "   ❌ Login failed: $($loginResponse.message)" -ForegroundColor Red
    }
} catch {
    Write-Host "   ❌ Login error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n📋 System Status Summary:" -ForegroundColor Cyan
Write-Host "=================================" -ForegroundColor Cyan
Write-Host "Backend Server: http://localhost:5000" -ForegroundColor White
Write-Host "Frontend App: http://localhost:5173" -ForegroundColor White
Write-Host "Admin Login: admin@terraflow.com / admin123" -ForegroundColor White

Write-Host "`n🎯 To test image upload:" -ForegroundColor Cyan
Write-Host "1. Open: http://localhost:5173/auth/login" -ForegroundColor White
Write-Host "2. Login with admin credentials" -ForegroundColor White
Write-Host "3. Go to: Admin Dashboard → Inventory Management" -ForegroundColor White
Write-Host "4. Click 'Add Product' and test image upload" -ForegroundColor White

Write-Host "`n🚀 If all tests above passed, the system is working!" -ForegroundColor Green
