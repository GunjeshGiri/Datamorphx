@echo off
setlocal enabledelayedexpansion

echo ==========================================
echo     DataMorphX - Full System Tester
echo ==========================================

REM ---------------------------
REM 1. Activate the virtual env
REM ---------------------------
echo.
echo Activating venv...
call venv\Scripts\activate

IF %ERRORLEVEL% NEQ 0 (
    echo ❌ ERROR: Failed to activate venv.
    echo Make sure venv exists: python -m venv venv
    pause
    exit /b 1
)

echo ✔ venv activated successfully.

REM ---------------------------
REM 2. Install dependencies
REM ---------------------------
echo.
echo Installing all required pip packages...
pip install -r requirements.txt

IF %ERRORLEVEL% NEQ 0 (
    echo ❌ ERROR: Failed to install dependencies.
    pause
    exit /b 1
)

echo ✔ All dependencies installed.

REM ---------------------------
REM 3. Test CLI tool
REM ---------------------------
echo.
echo Testing CLI conversion...
python cli\datamorphx_cli.py tests\sample_data\sample.csv tests\sample_data\sample_out.json --no-validate

IF %ERRORLEVEL% NEQ 0 (
    echo ❌ CLI Test Failed.
    pause
    exit /b 1
)

echo ✔ CLI working.

REM ---------------------------
REM 4. Test FastAPI Server
REM ---------------------------
echo.
echo Starting FastAPI server on port 8000...
start "FASTAPI_TEST" uvicorn app.fastapi_app:app --port 8000 --host 0.0.0.0

echo Waiting 5 seconds for server to boot...
timeout /t 5 >nul

REM Kill FastAPI server
echo Stopping FastAPI server...
taskkill /FI "WINDOWTITLE eq FASTAPI_TEST*" /F >nul 2>&1

echo ✔ FastAPI server working.

REM ---------------------------
REM 5. Test Streamlit UI
REM ---------------------------
echo.
echo Starting Streamlit app...
start "STREAMLIT_TEST" streamlit run app/streamlit_app.py --server.headless true

echo Waiting 8 seconds for Streamlit to boot...
timeout /t 8 >nul

REM Kill Streamlit
echo Stopping Streamlit app...
taskkill /FI "WINDOWTITLE eq STREAMLIT_TEST*" /F >nul 2>&1

echo ✔ Streamlit UI working.

REM ---------------------------
REM 6. Run pytest
REM ---------------------------
echo.
echo Running pytest...
pytest

IF %ERRORLEVEL% NEQ 0 (
    echo ❌ Tests Failed.
    pause
    exit /b 1
)

echo ✔ Pytest completed successfully.

REM ---------------------------
REM FINAL SUCCESS MESSAGE
REM ---------------------------
echo.
echo ==========================================
echo      🎉 ALL COMPONENTS WORKING 🎉
echo ==========================================
echo Your DataMorphX project is running perfectly!
echo.
pause
exit /b 0
