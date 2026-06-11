@echo off
REM SwarmOps Backend Setup Script for Windows
REM Run this to set up and start the backend

echo ==========================================
echo SwarmOps Backend Setup
echo ==========================================
echo.

REM Check if .env exists
if not exist .env (
    echo ⚠️  .env file not found!
    echo Creating from template...
    copy .env.example .env
    echo.
    echo ⚠️  IMPORTANT: Edit .env and add your credentials:
    echo    - GITHUB_TOKEN
    echo    - AZURE_OPENAI_ENDPOINT
    echo    - AZURE_OPENAI_KEY
    echo.
    pause
    exit /b 1
)

REM Check if virtual environment exists
if not exist venv (
    echo Creating virtual environment...
    python -m venv venv
    if errorlevel 1 (
        echo ❌ Failed to create virtual environment
        echo Make sure Python 3.11+ is installed
        pause
        exit /b 1
    )
)

REM Activate virtual environment
echo Activating virtual environment...
call venv\Scripts\activate

REM Install dependencies
echo Installing dependencies...
pip install -r requirements.txt
if errorlevel 1 (
    echo ❌ Failed to install dependencies
    pause
    exit /b 1
)

REM Initialize database
echo Initializing database...
python -c "from database import init_db; init_db(); print('✅ Database initialized')"

REM Start the server
echo.
echo ==========================================
echo ✅ Setup complete! Starting server...
echo ==========================================
echo.
echo Backend will run on: http://localhost:8000
echo API docs: http://localhost:8000/docs
echo.

python -m uvicorn main:app --reload --port 8000

REM Deactivate on exit
call deactivate
