import React from 'react';
import {
  MessageSquare,
  Image as ImageIcon,
  Video,
  Terminal,
  Settings,
  Database,
  Cpu,
  RefreshCw,
  HardDrive,
  ShieldCheck,
} from 'lucide-react';
import { ActiveTab, EndpointStatus } from '../types';

interface HeaderProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  endpointStatus: EndpointStatus;
  selectedModel: string;
  onOpenSettings: () => void;
  onOpenModelManager: () => void;
  onOpenWindowsModal: () => void;
  onRefreshStatus: () => void;
  demoMode: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  endpointStatus,
  selectedModel,
  onOpenSettings,
  onOpenModelManager,
  onOpenWindowsModal,
  onRefreshStatus,
  demoMode,
}) => {
  return (
    <header className="bg-slate-900/90 backdrop-blur border-b border-slate-800 text-white px-4 py-2.5 sticky top-0 z-30 flex flex-wrap items-center justify-between gap-3">
      {/* Brand & Status */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
          <Cpu className="w-5 h-5 text-white" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-bold text-sm tracking-tight text-white flex items-center gap-1.5">
              Local Ollama Studio
            </h1>
            <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-slate-800 text-cyan-400 border border-slate-700">
              Mathisha's PC
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-400">
            {/* Ollama Status Pill */}
            <button
              onClick={onRefreshStatus}
              title="Click to auto-detect pre-installed models"
              className="inline-flex items-center gap-1.5 hover:text-slate-200 transition-colors"
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  endpointStatus.ollama.online
                    ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]'
                    : demoMode
                    ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]'
                    : 'bg-rose-400'
                }`}
              />
              <span className="font-mono text-[11px] text-emerald-400">
                {endpointStatus.ollama.online
                  ? 'Auto-Detected: Local'
                  : 'Auto-Detect Ready'}
              </span>
              <RefreshCw className="w-2.5 h-2.5 opacity-60 hover:opacity-100" />
            </button>

            <span className="text-slate-600">•</span>

            {/* Model Name */}
            <button
              onClick={onOpenModelManager}
              className="text-cyan-400 hover:text-cyan-300 font-mono text-[11px] truncate max-w-[140px] flex items-center gap-1 hover:underline"
              title="Click to manage or switch models"
            >
              <Database className="w-3 h-3" />
              {selectedModel || 'Select Model'}
            </button>
          </div>
        </div>
      </div>

      {/* Main Tab Navigation */}
      <nav className="flex items-center bg-slate-800/80 p-1 rounded-xl border border-slate-700/60">
        <button
          id="tab-chat"
          onClick={() => setActiveTab('chat')}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
            activeTab === 'chat'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
              : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          <span>Chat, Vision & Speech</span>
        </button>

        <button
          id="tab-image"
          onClick={() => setActiveTab('image')}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
            activeTab === 'image'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
              : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
          }`}
        >
          <ImageIcon className="w-4 h-4" />
          <span>Local Image Studio</span>
        </button>

        <button
          id="tab-video"
          onClick={() => setActiveTab('video')}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
            activeTab === 'video'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
              : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
          }`}
        >
          <Video className="w-4 h-4" />
          <span>Local Video Studio</span>
        </button>

        <button
          id="tab-setup"
          onClick={onOpenWindowsModal}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 border border-emerald-500/30 ml-1 transition-all"
        >
          <Terminal className="w-4 h-4" />
          <span>Windows .bat Launcher</span>
        </button>
      </nav>

      {/* Action Buttons & Hardware Badge */}
      <div className="flex items-center gap-2">
        <span className="hidden xl:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-[11px] font-mono text-slate-400">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Under 1GB Data Cap</span>
        </span>

        <button
          id="btn-models"
          onClick={onOpenModelManager}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs rounded-lg border border-slate-700 transition"
          title="Auto-detected models"
        >
          <Database className="w-3.5 h-3.5 text-cyan-400" />
          <span>Models</span>
        </button>

        <button
          id="btn-settings"
          onClick={onOpenSettings}
          className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg border border-slate-700 transition"
          title="Settings, TTS & Ryzen 5 Tuning"
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
