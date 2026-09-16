import React from 'react';
import { X, Settings, Sliders, Server, ShieldCheck, HelpCircle } from 'lucide-react';
import { AppSettings } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onUpdateSettings: (newSettings: Partial<AppSettings>) => void;
  onResetSettings: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  onResetSettings,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-850">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 flex items-center justify-center">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Studio Configuration</h2>
              <p className="text-xs text-slate-400">Local endpoints, parameters, and network routing</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 text-sm">
          {/* Service URLs */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Server className="w-3.5 h-3.5 text-cyan-400" />
              Local Service Endpoints
            </h3>

            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1">
                Ollama Endpoint URL
              </label>
              <input
                type="text"
                value={settings.ollamaUrl}
                onChange={(e) => onUpdateSettings({ ollamaUrl: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white font-mono focus:outline-none focus:border-cyan-500"
                placeholder="http://127.0.0.1:11434"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Default: <code className="text-slate-400">http://127.0.0.1:11434</code> (Ollama standard Windows port)
              </p>
            </div>

            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1">
                Local Video Generation Service (SVD / Wan / AnimateDiff)
              </label>
              <input
                type="text"
                value={settings.videoUrl}
                onChange={(e) => onUpdateSettings({ videoUrl: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white font-mono focus:outline-none focus:border-cyan-500"
                placeholder="http://127.0.0.1:8000"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Started via <code className="text-slate-400">start_video_backend.bat</code> (FastAPI / Diffusers)
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">ComfyUI Endpoint</label>
                <input
                  type="text"
                  value={settings.comfyUrl}
                  onChange={(e) => onUpdateSettings({ comfyUrl: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white font-mono focus:outline-none focus:border-cyan-500"
                  placeholder="http://127.0.0.1:8188"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">SD WebUI / Forge</label>
                <input
                  type="text"
                  value={settings.sdWebUiUrl}
                  onChange={(e) => onUpdateSettings({ sdWebUiUrl: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white font-mono focus:outline-none focus:border-cyan-500"
                  placeholder="http://127.0.0.1:7860"
                />
              </div>
            </div>
          </div>

          {/* Network & Simulation */}
          <div className="space-y-3 pt-3 border-t border-slate-800">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
              Network & Simulation
            </h3>

            <div className="flex items-center justify-between p-3 bg-slate-950 border border-slate-800 rounded-xl">
              <div>
                <span className="text-xs font-medium text-white block">Use Server Proxy</span>
                <span className="text-[11px] text-slate-400">
                  Proxies Ollama calls through Express server to eliminate CORS restrictions
                </span>
              </div>
              <input
                type="checkbox"
                checked={settings.useProxy}
                onChange={(e) => onUpdateSettings({ useProxy: e.target.checked })}
                className="w-4 h-4 accent-cyan-500 rounded cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between p-3 bg-slate-950 border border-slate-800 rounded-xl">
              <div>
                <span className="text-xs font-medium text-white block">Simulation / Preview Mode</span>
                <span className="text-[11px] text-slate-400">
                  Provides simulated model responses when testing in cloud preview without local Ollama daemon
                </span>
              </div>
              <input
                type="checkbox"
                checked={settings.demoMode}
                onChange={(e) => onUpdateSettings({ demoMode: e.target.checked })}
                className="w-4 h-4 accent-cyan-500 rounded cursor-pointer"
              />
            </div>
          </div>

          {/* Generation Parameters */}
          <div className="space-y-3 pt-3 border-t border-slate-800">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-cyan-400" />
              Model Parameters
            </h3>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-300">Temperature</span>
                <span className="font-mono text-cyan-400">{settings.temperature}</span>
              </div>
              <input
                type="range"
                min="0"
                max="1.5"
                step="0.05"
                value={settings.temperature}
                onChange={(e) => onUpdateSettings({ temperature: parseFloat(e.target.value) })}
                className="w-full accent-cyan-500 cursor-pointer"
              />
              <span className="text-[10px] text-slate-500">Lower = focused and factual, Higher = creative</span>
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-300">Context Window (Tokens)</span>
                <span className="font-mono text-cyan-400">{settings.contextLength}</span>
              </div>
              <input
                type="range"
                min="2048"
                max="32768"
                step="1024"
                value={settings.contextLength}
                onChange={(e) => onUpdateSettings({ contextLength: parseInt(e.target.value) })}
                className="w-full accent-cyan-500 cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950 flex items-center justify-between">
          <button
            onClick={onResetSettings}
            className="text-xs text-slate-500 hover:text-slate-300 transition"
          >
            Reset Defaults
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-medium rounded-lg transition"
          >
            Save & Close
          </button>
        </div>
      </div>
    </div>
  );
};
