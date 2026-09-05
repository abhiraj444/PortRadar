@echo off
cd /d "%~dp0"
title PortRadar - Local Network Port Visualizer & AI Explainer
echo ===================================================================
echo   ⚡ PortRadar - Local Network Port Visualizer & AI Explainer
echo ===================================================================
echo.
echo Starting PortRadar server on 0.0.0.0:8989...
echo.

:: Launch the browser after a short delay in the background
start "" cmd /c "timeout /t 2 /nobreak >nul && start http://localhost:8989"

:: Run with local portable node if bundled, otherwise fallback to system node
if exist "bin\node.exe" (
    "bin\node.exe" server/index.js
) else (
    node server/index.js
)

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo Server stopped with error code %ERRORLEVEL%.
    pause
)
