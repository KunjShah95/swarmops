@echo off
cd /d "%~dp0frontend"
echo Installing dependencies...
call npm install
echo Starting SwarmOps Frontend (Next.js)...
echo Dashboard: http://localhost:3000
echo.
set BACKEND_URL=http://127.0.0.1:8000
call npm run dev
pause
