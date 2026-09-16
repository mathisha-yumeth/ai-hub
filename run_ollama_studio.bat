@echo off
title Local Ollama Studio Launcher
color 0b
cls

echo =====================================================================
echo                LOCAL OLLAMA STUDIO - WINDOWS LAUNCHER
echo =====================================================================
echo.
echo  [1/4] Checking Node.js environment...
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed or not found in PATH!
    echo Please install Node.js from https://nodejs.org/ (LTS version)
    echo or run: winget install OpenJS.NodeJS.LTS
    echo.
    pause
    exit /b 1
)
node -v
echo  -- Node.js is ready.
echo.

echo  [2/4] Checking Ollama status...
curl -s -m 2 http://127.0.0.1:11434/api/tags >nul 2>nul
if %errorlevel% equ 0 (
    echo  -- Ollama service is running on http://127.0.0.1:11434!
) else (
    echo  [!] Ollama was not detected on port 11434.
    echo  Attempting to launch Ollama in background...
    where ollama >nul 2>nul
    if %errorlevel% equ 0 (
        start "" /b ollama serve
        timeout /t 3 /nobreak >nul
        echo  -- Ollama serve launched.
    ) else (
        echo  [NOTE] Ollama CLI not detected in PATH.
        echo  If you haven't installed Ollama yet, get it at https://ollama.com
        echo  The studio will still open and provide guided setup!
    )
)
echo.

echo  [3/4] Checking project dependencies...
if not exist "node_modules\" (
    echo  Dependencies not found. Running npm install (first time only)...
    call npm install
    if %errorlevel% neq 0 (
        echo [ERROR] npm install failed. Check your internet connection.
        pause
        exit /b 1
    )
) else (
    echo  -- Dependencies already installed.
)
echo.

echo  [4/4] Starting Local Web Studio on port 3000...
echo.
echo =====================================================================
echo  Opening Local Ollama Studio in your default browser...
echo  URL: http://localhost:3000
echo  Press Ctrl+C in this terminal window to stop the server anytime.
echo =====================================================================
echo.

:: Launch browser after 2 seconds to give Vite/Express time to bind
start "" cmd /c "timeout /t 2 /nobreak >nul && start http://localhost:3000"

:: Start the application server
npm run dev

pause
