import React, { useState } from 'react';
import {
  X,
  Download,
  Terminal,
  CheckCircle,
  Copy,
  ExternalLink,
  Play,
  Video,
  Layers,
  Sparkles,
  HelpCircle,
} from 'lucide-react';

interface WindowsLauncherModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const WindowsLauncherModal: React.FC<WindowsLauncherModalProps> = ({ isOpen, onClose }) => {
  const [activeSubTab, setActiveSubTab] = useState<'launcher' | 'video' | 'commands'>('launcher');
  const [copiedScript, setCopiedScript] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedScript(id);
    setTimeout(() => setCopiedScript(null), 2000);
  };

  const batchContent = `@echo off
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
    pause
    exit /b 1
)

echo  [2/4] Checking Ollama status...
curl -s -m 2 http://127.0.0.1:11434/api/tags >nul 2>nul
if %errorlevel% equ 0 (
    echo  -- Ollama service is running on http://127.0.0.1:11434!
) else (
    echo  Attempting to launch Ollama in background...
    start "" /b ollama serve
)

echo  [3/4] Checking project dependencies...
if not exist "node_modules\\" (
    call npm install
)

echo  [4/4] Starting Local Web Studio on port 3000...
start "" cmd /c "timeout /t 2 /nobreak >nul && start http://localhost:3000"
npm run dev
pause`;

  const videoBatchContent = `@echo off
title Local Video Generation Backend
color 0a
cls
echo Starting local video service on http://127.0.0.1:8000 ...
python local_video_backend.py
pause`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-850">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
              <Terminal className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Windows .bat Launcher Setup</h2>
              <p className="text-xs text-slate-400">
                Click-to-run directly on Windows: starts Ollama, Node, and opens your default browser
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sub Navigation */}
        <div className="flex border-b border-slate-800 px-6 bg-slate-900/50">
          <button
            onClick={() => setActiveSubTab('launcher')}
            className={`py-3 px-4 text-xs font-medium border-b-2 transition-colors ${
              activeSubTab === 'launcher'
                ? 'border-emerald-400 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            1. Master .bat Launcher
          </button>
          <button
            onClick={() => setActiveSubTab('video')}
            className={`py-3 px-4 text-xs font-medium border-b-2 transition-colors ${
              activeSubTab === 'video'
                ? 'border-emerald-400 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            2. Local Video Service .bat
          </button>
          <button
            onClick={() => setActiveSubTab('commands')}
            className={`py-3 px-4 text-xs font-medium border-b-2 transition-colors ${
              activeSubTab === 'commands'
                ? 'border-emerald-400 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            3. Ollama & Vision Commands
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-slate-300 text-sm">
          {activeSubTab === 'launcher' && (
            <div className="space-y-4">
              <div className="bg-emerald-950/30 border border-emerald-500/30 p-4 rounded-xl flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <div className="text-xs text-emerald-200/90 leading-relaxed">
                  <p className="font-semibold text-emerald-300 text-sm mb-1">
                    How the Windows .bat Launcher works:
                  </p>
                  <ol className="list-decimal list-inside space-y-1">
                    <li>Verifies Node.js is installed on your Windows machine.</li>
                    <li>Pings local Ollama service (`http://127.0.0.1:11434`), auto-launching `ollama serve` if closed.</li>
                    <li>Installs dependencies automatically if run for the first time.</li>
                    <li>Executes `start http://localhost:3000`, automatically opening your default web browser!</li>
                  </ol>
                </div>
              </div>

              {/* Action Downloads */}
              <div className="flex flex-wrap items-center gap-3">
                <a
                  href="/api/download-launcher"
                  download="run_ollama_studio.bat"
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold text-xs rounded-xl shadow-lg shadow-emerald-500/20 transition"
                >
                  <Download className="w-4 h-4" />
                  <span>Download run_ollama_studio.bat</span>
                </a>

                <button
                  onClick={() => handleCopy(batchContent, 'bat')}
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs rounded-xl border border-slate-700 transition"
                >
                  {copiedScript === 'bat' ? <CheckCircle className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedScript === 'bat' ? 'Copied to Clipboard' : 'Copy Script Code'}</span>
                </button>
              </div>

              {/* Code viewer */}
              <div className="relative rounded-xl overflow-hidden border border-slate-800 bg-slate-950">
                <div className="bg-slate-900 px-4 py-2 text-xs font-mono text-slate-400 border-b border-slate-800 flex justify-between items-center">
                  <span>run_ollama_studio.bat</span>
                  <span className="text-[10px] text-slate-500">Windows Batch Script</span>
                </div>
                <pre className="p-4 text-xs font-mono text-cyan-300 overflow-x-auto leading-relaxed max-h-56">
                  {batchContent}
                </pre>
              </div>
            </div>
          )}

          {activeSubTab === 'video' && (
            <div className="space-y-4">
              <div className="bg-purple-950/30 border border-purple-500/30 p-4 rounded-xl flex items-start gap-3">
                <Video className="w-5 h-5 text-purple-400 shrink-0 mt-0.5" />
                <div className="text-xs text-purple-200/90 leading-relaxed">
                  <p className="font-semibold text-purple-300 text-sm mb-1">
                    Fully Local Video Generation Engine (Windows):
                  </p>
                  <p>
                    For offline AI video synthesis (Stable Video Diffusion / Wan 2.1 / AnimateDiff), run{' '}
                    <code className="bg-purple-900/50 px-1.5 py-0.5 rounded text-purple-300 font-mono">start_video_backend.bat</code>.
                    It hosts a high-speed Python FastAPI service on port 8000 with CUDA hardware acceleration.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <a
                  href="/api/download-video-launcher"
                  download="start_video_backend.bat"
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-purple-600/20 transition"
                >
                  <Download className="w-4 h-4" />
                  <span>Download start_video_backend.bat</span>
                </a>

                <a
                  href="/api/download-video-python"
                  download="local_video_backend.py"
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs rounded-xl border border-slate-700 transition"
                >
                  <Download className="w-4 h-4" />
                  <span>Download local_video_backend.py</span>
                </a>
              </div>

              <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-2">
                <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider font-mono">
                  Requirements for Local Video on Windows
                </h4>
                <ul className="text-xs space-y-1.5 text-slate-400">
                  <li>• Python 3.10 or 3.11 installed (`winget install Python.Python.3.11`)</li>
                  <li>• NVIDIA GPU with 6GB+ VRAM recommended for SVD (RTX 3060 / 4060 or higher)</li>
                  <li>• Also fully compatible with ComfyUI running at <code className="text-cyan-400 font-mono">http://127.0.0.1:8188</code></li>
                </ul>
              </div>
            </div>
          )}

          {activeSubTab === 'commands' && (
            <div className="space-y-4">
              <p className="text-xs text-slate-400">
                Quick copy-paste commands to set up Ollama and recommended models in PowerShell or Command Prompt:
              </p>

              <div className="space-y-3">
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-3">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-semibold text-white">1. Install Ollama via Winget (Windows)</span>
                    <button
                      onClick={() => handleCopy('winget install Ollama.Ollama', 'w1')}
                      className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
                    >
                      {copiedScript === 'w1' ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                  <code className="text-xs font-mono text-cyan-300 bg-slate-900 px-2 py-1 rounded block">
                    winget install Ollama.Ollama
                  </code>
                </div>

                <div className="bg-slate-950 border border-slate-800 rounded-xl p-3">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-semibold text-white">2. Pull Llama 3.2 Vision (For Image-to-Text)</span>
                    <button
                      onClick={() => handleCopy('ollama pull llama3.2-vision', 'w2')}
                      className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
                    >
                      {copiedScript === 'w2' ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                  <code className="text-xs font-mono text-cyan-300 bg-slate-900 px-2 py-1 rounded block">
                    ollama pull llama3.2-vision
                  </code>
                </div>

                <div className="bg-slate-950 border border-slate-800 rounded-xl p-3">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-semibold text-white">3. Pull DeepSeek-R1 (For Step-by-Step Reasoning)</span>
                    <button
                      onClick={() => handleCopy('ollama pull deepseek-r1:8b', 'w3')}
                      className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
                    >
                      {copiedScript === 'w3' ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                  <code className="text-xs font-mono text-cyan-300 bg-slate-900 px-2 py-1 rounded block">
                    ollama pull deepseek-r1:8b
                  </code>
                </div>

                <div className="bg-slate-950 border border-slate-800 rounded-xl p-3">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-semibold text-white">4. Fast 3B Chat Model (Low RAM)</span>
                    <button
                      onClick={() => handleCopy('ollama pull llama3.2', 'w4')}
                      className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
                    >
                      {copiedScript === 'w4' ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                  <code className="text-xs font-mono text-cyan-300 bg-slate-900 px-2 py-1 rounded block">
                    ollama pull llama3.2
                  </code>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 border-t border-slate-800 bg-slate-950 flex items-center justify-between">
          <span className="text-xs text-slate-500">
            Files stored in root directory: <code className="text-slate-400 font-mono">./run_ollama_studio.bat</code>
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-medium rounded-lg transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
