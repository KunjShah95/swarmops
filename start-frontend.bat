@echo off
cd /d "%~dp0frontend"
echo Installing dependencies...
call npm install >nul 2>&1
echo Starting SwarmOps Frontend...
echo Dashboard: http://localhost:5173
echo.
npx vite --host
pause
