@echo off
echo Starting ShadowNet AI Frontend...
cd %~dp0frontend

:: Install dependencies if node_modules is missing
if not exist "node_modules\" (
    echo Installing dependencies...
    npm install
)

echo Starting Vite development server...
npm run dev
pause
