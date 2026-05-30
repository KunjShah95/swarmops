@echo off
title SwarmOps - Microsoft Hackathon
echo ==========================================
echo   SwarmOps - Autonomous DevOps Agent Swarm
echo   Microsoft Build with AI Hackathon 2026
echo ==========================================
echo.
echo Starting Backend (port 8000)...
start "SwarmOps Backend" cmd /c "cd /d "%~dp0backend" && uvicorn main:app --reload --host 0.0.0.0 --port 8000"
echo.
echo Waiting for backend to initialize...
timeout /t 3 /nobreak >nul
echo.
echo Starting Frontend (port 5173)...
start "SwarmOps Frontend" cmd /c "cd /d "%~dp0frontend" && npx vite --host"
echo.
echo ==========================================
echo   Backend API:  http://localhost:8000/docs
echo   Frontend UI:  http://localhost:5173
echo   Health Check: http://localhost:8000/health
echo ==========================================
echo.
echo Close this window to stop all services.
pause
