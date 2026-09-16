@echo off
title Local Video Generation Backend (SVD / Wan / AnimateDiff)
color 0a
cls

echo =====================================================================
echo         LOCAL VIDEO GENERATION SERVICE (WINDOWS DIRECT RUNNER)
echo =====================================================================
echo.
echo  This script starts a local Python video generation service on port 8000
echo  compatible with Local Ollama Studio (Stable Video Diffusion / Diffusers).
echo.

where python >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Python 3.10+ is required for local video generation.
    echo Please install Python from https://python.org or Microsoft Store.
    pause
    exit /b 1
)

echo Checking required Python packages (torch, diffusers, fastapi, uvicorn)...
python -c "import torch, diffusers, fastapi, uvicorn" 2>nul
if %errorlevel% neq 0 (
    echo Installing required packages for local video generation...
    pip install torch torchvision --index-url https://download.pytorch.org/whl/cu121
    pip install diffusers transformers accelerate imageio[ffmpeg] fastapi uvicorn pillow
)

echo.
echo Starting local video service on http://127.0.0.1:8000 ...
python local_video_backend.py
pause
