@echo off
title SwarmOps Docker
echo ==========================================
echo   SwarmOps - Docker Deployment
echo ==========================================
echo.

if not exist .env (
    echo Creating .env from template...
    copy .env.example .env
    echo.
    echo Edit .env and add API keys, then run this script again.
    pause
    exit /b 1
)

echo Building and starting containers...
docker compose up --build -d

if errorlevel 1 (
    echo.
    echo Docker failed. Is Docker Desktop running?
    pause
    exit /b 1
)

echo.
echo ==========================================
echo   App:    http://localhost
echo   API:    http://localhost:8000/docs
echo   Health: http://localhost:8000/health
echo ==========================================
echo.
echo Run: docker compose logs -f
echo Stop: docker compose down
pause
