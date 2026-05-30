@echo off
cd /d "%~dp0backend"
echo Installing dependencies...
pip install -r requirements.txt >nul 2>&1
echo Starting SwarmOps Backend...
echo API docs: http://localhost:8000/docs
echo Health: http://localhost:8000/health
echo.
uvicorn main:app --reload --host 0.0.0.0 --port 8000
pause
