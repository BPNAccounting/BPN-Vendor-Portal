# BPN Vendor Portal — One-time setup script
# Run from PowerShell as an administrator: .\setup.ps1

Write-Host "BPN Vendor Portal Setup" -ForegroundColor Cyan
Write-Host "=======================" -ForegroundColor Cyan

# Check if Node.js is installed
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "`nNode.js not found. Downloading installer..." -ForegroundColor Yellow
    $nodeUrl = "https://nodejs.org/dist/v20.12.2/node-v20.12.2-x64.msi"
    $installer = "$env:TEMP\node-installer.msi"
    Invoke-WebRequest -Uri $nodeUrl -OutFile $installer
    Write-Host "Installing Node.js v20 LTS..." -ForegroundColor Yellow
    Start-Process msiexec.exe -ArgumentList "/i `"$installer`" /quiet /norestart" -Wait
    $env:PATH = [System.Environment]::GetEnvironmentVariable("PATH", "Machine") + ";" + [System.Environment]::GetEnvironmentVariable("PATH", "User")
    Write-Host "Node.js installed." -ForegroundColor Green
} else {
    Write-Host "Node.js $(node --version) found." -ForegroundColor Green
}

# Install dependencies (pure JS — no native compilation required)
Write-Host "`nInstalling dependencies..." -ForegroundColor Yellow
npm install

if ($LASTEXITCODE -ne 0) {
    Write-Host "npm install failed. Please check the error above." -ForegroundColor Red
    exit 1
}

Write-Host "`nDependencies installed successfully." -ForegroundColor Green
Write-Host "`nReview .env.local and change the following before going to production:" -ForegroundColor Yellow
Write-Host "  ADMIN_PASSWORD  - change from the default value" -ForegroundColor Yellow
Write-Host "  ADMIN_JWT_SECRET - change to a random 64-char string" -ForegroundColor Yellow
Write-Host "  ENCRYPTION_KEY  - change to a random 64-char hex string" -ForegroundColor Yellow

Write-Host "`nStarting development server..." -ForegroundColor Cyan
Write-Host "Form:      http://localhost:3000/form" -ForegroundColor White
Write-Host "Admin:     http://localhost:3000/admin" -ForegroundColor White
Write-Host "Password:  BPN-Admin-2024!  (change this in .env.local)" -ForegroundColor White
Write-Host ""
npm run dev
