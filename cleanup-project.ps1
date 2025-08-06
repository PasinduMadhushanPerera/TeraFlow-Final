# TerraFlow Project Cleanup Script
# This script removes unnecessary test files, debug files, and documentation files

Write-Host "🧹 Cleaning up TerraFlow project..." -ForegroundColor Cyan

# Define categories of files to remove
$testFiles = @(
    "test-*.js", "test-*.html", "test-*.ps1", "test-*.bat"
)

$debugFiles = @(
    "debug-*.js", "debug-*.html", "*-debug*.html", "*-debug*.js"
)

$documentationFiles = @(
    "*_COMPLETE*.md", "*_IMPLEMENTATION*.md", "*_FIX*.md", "*_STATUS*.md",
    "*_GUIDE*.md", "*_REPORT*.md", "*COMPLETE*.md", "*TROUBLESHOOTING*.md"
)

$temporaryFiles = @(
    "fix-*.js", "final-*.js", "system-status-check.js", "*-diagnostic*.html",
    "quick-*.html", "*-access.html", "setup-*.html", "setup-*.js"
)

$batchAndScriptFiles = @(
    "start-*.bat", "start-*.ps1", "LAUNCH_*.bat", "QUICK_*.bat", "START_*.bat",
    "system-status-check.ps1", "*-servers.bat", "*-terraflow*.bat"
)

$htmlTestFiles = @(
    "*-complete.html", "*-implementation*.html", "*-fixed*.html", 
    "console-errors-fixed.html", "customer-*.html", "*-panel.html"
)

$javaScriptTestFiles = @(
    "check-*.js", "create-test-*.js", "enhance-*.js", "migrate-*.js", 
    "update-*.js", "clear-*.js", "add-*.js"
)

# Function to remove files by pattern
function Remove-FilesByPattern {
    param($patterns, $description)
    
    Write-Host "`n📁 Removing $description..." -ForegroundColor Yellow
    $removedCount = 0
    
    foreach ($pattern in $patterns) {
        $files = Get-ChildItem -Path "." -Name $pattern -ErrorAction SilentlyContinue
        foreach ($file in $files) {
            if (Test-Path $file) {
                Remove-Item $file -Force
                Write-Host "   ❌ $file" -ForegroundColor Red
                $removedCount++
            }
        }
    }
    
    if ($removedCount -eq 0) {
        Write-Host "   ✅ No files found to remove" -ForegroundColor Green
    } else {
        Write-Host "   📊 Removed $removedCount files" -ForegroundColor Magenta
    }
}

# Execute cleanup
Remove-FilesByPattern $testFiles "Test Files"
Remove-FilesByPattern $debugFiles "Debug Files"
Remove-FilesByPattern $documentationFiles "Documentation Files"
Remove-FilesByPattern $temporaryFiles "Temporary Files"
Remove-FilesByPattern $batchAndScriptFiles "Batch and Script Files"
Remove-FilesByPattern $htmlTestFiles "HTML Test Files"
Remove-FilesByPattern $javaScriptTestFiles "JavaScript Test Files"

# Remove specific files that don't fit patterns
$specificFiles = @(
    "404-debug-test.html",
    "BUY_BUTTON_IMPLEMENTATION_DEMO.html",
    "console-errors-fixed.html",
    "customer-debug-panel.html",
    "customer-orders-fixed-complete.html",
    "customer-orders-implementation-complete.html",
    "frontend-debug.html",
    "image-debug-test.html",
    "image-display-fixed.html",
    "login-diagnostic-test.html",
    "system-test.html",
    "terraflow-access.html",
    "TERRAFLOW_QUICK_ACCESS.html"
)

Write-Host "`n📁 Removing Specific Files..." -ForegroundColor Yellow
$removedSpecific = 0
foreach ($file in $specificFiles) {
    if (Test-Path $file) {
        Remove-Item $file -Force
        Write-Host "   ❌ $file" -ForegroundColor Red
        $removedSpecific++
    }
}

if ($removedSpecific -eq 0) {
    Write-Host "   ✅ No specific files found to remove" -ForegroundColor Green
} else {
    Write-Host "   📊 Removed $removedSpecific specific files" -ForegroundColor Magenta
}

# Clean up backend test files
if (Test-Path "TerraflowBackend") {
    Write-Host "`n📁 Cleaning Backend Test Files..." -ForegroundColor Yellow
    $backendTestFiles = Get-ChildItem -Path "TerraflowBackend" -Name "test-*.js", "debug-*.js", "check-*.js", "create-*.js", "fix-*.js", "enhance-*.js", "migrate-*.js", "update-*.js", "clear-*.js", "add-*.js" -ErrorAction SilentlyContinue
    $backendRemoved = 0
    
    foreach ($file in $backendTestFiles) {
        $fullPath = "TerraflowBackend\$file"
        if (Test-Path $fullPath) {
            Remove-Item $fullPath -Force
            Write-Host "   ❌ $fullPath" -ForegroundColor Red
            $backendRemoved++
        }
    }
    
    if ($backendRemoved -eq 0) {
        Write-Host "   ✅ No backend test files found to remove" -ForegroundColor Green
    } else {
        Write-Host "   📊 Removed $backendRemoved backend test files" -ForegroundColor Magenta
    }
}

# Show remaining essential files
Write-Host "`n📋 Essential Files Remaining:" -ForegroundColor Green
Write-Host "   ✅ README.md" -ForegroundColor Green
Write-Host "   ✅ frontend/ (React application)" -ForegroundColor Green
Write-Host "   ✅ TerraflowBackend/ (Node.js API)" -ForegroundColor Green

# Show current directory size
$currentSize = (Get-ChildItem -Recurse | Measure-Object -Property Length -Sum).Sum / 1MB
Write-Host "`n📊 Project cleaned! Current size: $([math]::Round($currentSize, 2)) MB" -ForegroundColor Cyan

Write-Host "`n🎯 Cleanup Complete! Your project is now clean and organized." -ForegroundColor Green
