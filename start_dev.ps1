# Simple development script - opens both services in separate windows
# Run this from the project root directory

Write-Host "=== FastAPI + React Development Environment ===" -ForegroundColor Green

# Check if backend directory exists
if (!(Test-Path "backend")) {
    Write-Host "❌ Backend directory not found!" -ForegroundColor Red
    exit 1
}

# Check if frontend directory exists  
if (!(Test-Path "frontend")) {
    Write-Host "❌ Frontend directory not found!" -ForegroundColor Red
    Write-Host "💡 Create it with: npx create-react-app frontend" -ForegroundColor Yellow
    exit 1
}

Write-Host "Starting services in separate windows..." -ForegroundColor Yellow

# Start backend in a new PowerShell window
Write-Host "🚀 Opening Backend (FastAPI) window..." -ForegroundColor Cyan
$backendCommand = "cd '$PWD\backend'; .\.venv\Scripts\Activate.ps1; Write-Host 'Backend starting on http://127.0.0.1:8008' -ForegroundColor Green; python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8008"
Start-Process powershell -ArgumentList "-NoExit", "-Command", $backendCommand

# Wait a moment for backend to start
Start-Sleep -Seconds 3

# Start frontend in a new PowerShell window
Write-Host "🚀 Opening Frontend (React) window..." -ForegroundColor Cyan
$frontendCommand = "cd '$PWD\frontend'; Write-Host 'Frontend starting on http://localhost:3000' -ForegroundColor Green; npm start"
Start-Process powershell -ArgumentList "-NoExit", "-Command", $frontendCommand

Write-Host ""
Write-Host "✅ Services started in separate windows:" -ForegroundColor Green
Write-Host "  🔗 Backend:  http://127.0.0.1:8008" -ForegroundColor Magenta
Write-Host "  🔗 Frontend: http://localhost:3000" -ForegroundColor Magenta
Write-Host ""
Write-Host "📝 To stop services: Close the PowerShell windows" -ForegroundColor Yellow
Write-Host "📝 To view logs: Check the individual PowerShell windows" -ForegroundColor Yellow