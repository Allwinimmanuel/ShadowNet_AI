@echo off
echo Starting ShadowNet AI Backend...
cd %~dp0backend

:: Check if virtual environment exists
if exist "venv\Scripts\activate.bat" (
    echo Activating virtual environment...
    call venv\Scripts\activate.bat
)

:: Install requirements if needed (assuming if venv doesn't exist, we just run globally or let uvicorn fail if missing)
echo Starting FastAPI server...
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
pause
