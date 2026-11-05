@echo off
echo =======================================================
echo   Odisha MargDarshak Production Startup Script (Windows)
echo =======================================================
echo.

echo [1/3] Checking Backend Python Environment...
cd backend
if not exist "venv\Scripts\activate.bat" (
    echo Creating virtual environment...
    python -m venv venv
)
call venv\Scripts\activate.bat
echo Installing production backend dependencies...
pip install -r requirements.txt
start "Odisha MargDarshak Backend (Port 8000)" cmd /k "uvicorn app.main:app --host 0.0.0.0 --port 8000"
cd ..

echo.
echo [2/3] Building and Starting Frontend (Port 3000)...
cd frontend
call npm install
call npm run build
start "Odisha MargDarshak Frontend (Port 3000)" cmd /k "npm start"
cd ..

echo.
echo =======================================================
echo   Odisha MargDarshak Platform is running in PRODUCTION!
echo   Frontend : http://localhost:3000
echo   Backend  : http://localhost:8000
echo   API Docs : http://localhost:8000/docs
echo =======================================================
pause
