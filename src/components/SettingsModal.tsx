import React, { useState, useEffect } from 'react';
import {
  X,
  Settings,
  Sliders,
  Server,
  ShieldCheck,
  Volume2,
  Cpu,
  HardDrive,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';
import { AppSettings, TTSConfig } from '../types';
import { getAvailableVoices, speakText, stopSpeaking, TTSVoiceOption } from '../services/ttsService';

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
  const [voices, setVoices] = useState<TTSVoiceOption[]>([]);
  const [isTestingVoice, setIsTestingVoice] = useState(false);

  useEffect(() => {
    if (isOpen) {
      getAvailableVoices().then(setVoices);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const tts = settings.tts || {
    enabled: true,
    engine: 'native_windows',
    voice: '',
    rate: 1.0,
    pitch: 1.0,
    volume: 1.0,
    autoPlay: false,
  };

  const handleUpdateTTS = (updates: Partial<TTSConfig>) => {
    onUpdateSettings({
      tts: { ...tts, ...updates },
    });
  };

  const handleTestVoice = () => {
    if (isTestingVoice) {
      stopSpeaking();
      setIsTestingVoice(false);
      return;
    }
    setIsTestingVoice(true);
    speakText(
      'Hello Mathisha! Your local text to speech synthesizer is working smoothly with zero internet required.',
      tts,
      () => setIsTestingVoice(true),
      () => setIsTestingVoice(false),
      () => setIsTestingVoice(false)
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-850">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 flex items-center justify-center">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Studio & Hardware Configuration</h2>
              <p className="text-xs text-slate-400">AMD Ryzen 5 7520U • 16GB RAM • Under 1GB Data Saver</p>
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
          {/* Hardware & Data Saver Card */}
          <div className="p-4 bg-slate-950 border border-emerald-500/30 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5 font-mono">
                <ShieldCheck className="w-4 h-4" />
                Under 1GB Internet Cap Guarantee
              </span>
              <span className="px-2 py-0.5 bg-emerald-950 border border-emerald-500/40 text-emerald-300 rounded text-[11px] font-mono">
                Used: ~0 MB to 45 MB Total
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <div className="p-2 bg-slate-900/90 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-500 block">Pre-installed Ollama</span>
                <span className="font-semibold text-white">0 MB (Local Disk)</span>
              </div>
              <div className="p-2 bg-slate-900/90 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-500 block">Image Checkpoint</span>
                <span className="font-semibold text-white">0 MB (.safetensors)</span>
              </div>
              <div className="p-2 bg-slate-900/90 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-500 block">Windows TTS</span>
                <span className="font-semibold text-white">0 MB (Built-in)</span>
              </div>
              <div className="p-2 bg-slate-900/90 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-500 block">HuggingFace TTS</span>
                <span className="font-semibold text-purple-400">~45 MB (Small)</span>
              </div>
            </div>
          </div>

          {/* Text to Speech Section */}
          <div className="space-y-3 pt-2">
            <h3 className="text-xs font-semibold text-purple-300 uppercase tracking-wider flex items-center gap-1.5">
              <Volume2 className="w-3.5 h-3.5 text-purple-400" />
              Text-to-Speech (Small Hugging Face / Windows SAPI)
            </h3>

            {/* Engine Picker */}
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handleUpdateTTS({ engine: 'native_windows' })}
                className={`p-3 rounded-xl border text-left transition ${
                  tts.engine === 'native_windows'
                    ? 'bg-purple-950/40 border-purple-500/60 text-white'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <div className="font-semibold text-xs text-purple-300 mb-0.5">
                  Windows Native SAPI
                </div>
                <div className="text-[11px] text-slate-400">
                  Built into Windows 11/10 (0 MB internet, zero lag)
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleUpdateTTS({ engine: 'huggingface_small' })}
                className={`p-3 rounded-xl border text-left transition ${
                  tts.engine === 'huggingface_small'
                    ? 'bg-purple-950/40 border-purple-500/60 text-white'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <div className="font-semibold text-xs text-purple-300 mb-0.5">
                  Hugging Face Small TTS
                </div>
                <div className="text-[11px] text-slate-400">
                  Kokoro-82M miniature neural voice (~45 MB)
                </div>
              </button>
            </div>

            {/* Voice Dropdown */}
            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1">
                Select Voice Model
              </label>
              <div className="flex gap-2">
                <select
                  value={tts.voice}
                  onChange={(e) => handleUpdateTTS({ voice: e.target.value })}
                  className="flex-1 bg-slate-950 text-xs font-mono text-slate-200 border border-slate-700 rounded-xl px-3 py-2 focus:outline-none focus:border-purple-500"
                >
                  <option value="">Default Windows System Voice (Auto)</option>
                  {voices.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.name} - [{v.downloadSize}]
                    </option>
                  ))}
                </select>

                <button
                  type="button"
                  onClick={handleTestVoice}
                  className="px-3.5 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-medium rounded-xl flex items-center gap-1.5 transition shrink-0"
                >
                  <Volume2 className="w-3.5 h-3.5" />
                  <span>{isTestingVoice ? 'Stop' : 'Test Speech'}</span>
                </button>
              </div>
            </div>

            {/* Speech Sliders */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-400">Speech Rate (Speed)</span>
                  <span className="font-mono text-purple-400">{tts.rate}x</span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="2.0"
                  step="0.1"
                  value={tts.rate}
                  onChange={(e) => handleUpdateTTS({ rate: parseFloat(e.target.value) })}
                  className="w-full accent-purple-500 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-400">Speech Pitch</span>
                  <span className="font-mono text-purple-400">{tts.pitch}</span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="1.5"
                  step="0.1"
                  value={tts.pitch}
                  onChange={(e) => handleUpdateTTS({ pitch: parseFloat(e.target.value) })}
                  className="w-full accent-purple-500 cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* AMD Ryzen 5 & Memory Optimization */}
          <div className="space-y-3 pt-3 border-t border-slate-800">
            <h3 className="text-xs font-semibold text-cyan-300 uppercase tracking-wider flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-cyan-400" />
              AMD Ryzen 5 7520U & 16GB RAM Tuning
            </h3>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-300">CPU Execution Threads</span>
                <span className="font-mono text-cyan-400">{settings.cpuThreads || 4} Threads</span>
              </div>
              <input
                type="range"
                min="1"
                max="8"
                step="1"
                value={settings.cpuThreads || 4}
                onChange={(e) => onUpdateSettings({ cpuThreads: parseInt(e.target.value) })}
                className="w-full accent-cyan-500 cursor-pointer"
              />
              <span className="text-[10px] text-slate-500">
                Tuned for AMD Ryzen 5 7520U (4 Zen 2 cores / 8 threads). 4 threads provides optimal response time.
              </span>
            </div>

            <div className="flex items-center justify-between p-3 bg-slate-950 border border-slate-800 rounded-xl">
              <div>
                <span className="text-xs font-medium text-white block">Low VRAM Protection Mode</span>
                <span className="text-[11px] text-slate-400">
                  Offloads weights to 15.2 GB system RAM to avoid VRAM overflow on AMD Radeon Graphics (486 MB)
                </span>
              </div>
              <input
                type="checkbox"
                checked={settings.lowVramMode ?? true}
                onChange={(e) => onUpdateSettings({ lowVramMode: e.target.checked })}
                className="w-4 h-4 accent-cyan-500 rounded cursor-pointer"
              />
            </div>
          </div>

          {/* Service Endpoints */}
          <div className="space-y-3 pt-3 border-t border-slate-800">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Server className="w-3.5 h-3.5 text-cyan-400" />
              Local Service Endpoints
            </h3>

            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1">
                Ollama Daemon URL
              </label>
              <input
                type="text"
                value={settings.ollamaUrl}
                onChange={(e) => onUpdateSettings({ ollamaUrl: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white font-mono focus:outline-none focus:border-cyan-500"
                placeholder="http://127.0.0.1:11434"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1">
                Default Local Image Model Path (.safetensors)
              </label>
              <input
                type="text"
                value={settings.localImageModelPath || 'C:\\models\\v1-5-pruned-emaonly.safetensors'}
                onChange={(e) => onUpdateSettings({ localImageModelPath: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-cyan-300 font-mono focus:outline-none focus:border-cyan-500"
                placeholder="C:\models\v1-5-pruned-emaonly.safetensors"
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
