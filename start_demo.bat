@echo off
title ShadowNet AI & SecureBank — Grand Finale Demonstration
color 0b

echo =======================================================================
echo          SHADOWNET AI — Real-Time Adaptive Login Defense
echo          Grand Finale Demonstration Launcher
echo =======================================================================
echo.

:: 1. Launch ShadowNet AI Backend (Port 8000)
echo [1/4] Starting ShadowNet AI Backend on port 8000...
start "ShadowNet AI Backend (Port 8000)" cmd /k "cd backend && python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload"

:: 2. Launch ShadowNet AI Frontend (Port 5173)
echo [2/4] Starting ShadowNet AI Security Dashboard on port 5173...
start "ShadowNet AI Frontend (Port 5173)" cmd /k "cd frontend && npm.cmd run dev"

:: 3. Launch SecureBank Backend (Port 8001)
echo [3/4] Starting SecureBank Backend on port 8001...
start "SecureBank Backend (Port 8001)" cmd /k "cd SecureBank\backend && python -m uvicorn main:app --host 127.0.0.1 --port 8001 --reload"

:: 4. Launch SecureBank Frontend (Port 5174)
echo [4/4] Starting SecureBank Customer Portal on port 5174...
start "SecureBank Frontend (Port 5174)" cmd /k "cd SecureBank\frontend && npm.cmd run dev -- --port 5174"

echo.
echo =======================================================================
echo All services are launching!
echo.
echo ShadowNet AI SOC Dashboard : http://localhost:5173
echo ShadowNet AI API Docs      : http://127.0.0.1:8000/docs
echo SecureBank Portal Demo     : http://localhost:5174
echo SecureBank API Docs        : http://127.0.0.1:8001/docs
echo.
echo Credentials:
echo   - SOC Dashboard : USR001 / Demo@123
echo   - SecureBank    : demo_user / password123
echo =======================================================================
echo.
pause
