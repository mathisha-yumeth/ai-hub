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
  ExternalLink,
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
    <header className="bg-slate-900/90 backdrop-blur border-b border-slate-800 text-white px-4 py-3 sticky top-0 z-30 flex flex-wrap items-center justify-between gap-3">
      {/* Brand & Status */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
          <Cpu className="w-6 h-6 text-white" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-bold text-base tracking-tight text-white flex items-center gap-1.5">
              Local Ollama Studio
            </h1>
            <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-slate-800 text-cyan-400 border border-slate-700">
              Windows Native
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-400">
            {/* Ollama Status Pill */}
            <button
              onClick={onRefreshStatus}
              title="Click to re-check connection"
              className="inline-flex items-center gap-1.5 hover:text-slate-200 transition-colors"
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  endpointStatus.ollama.online
                    ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]'
                    : demoMode
                    ? 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)]'
                    : 'bg-rose-400'
                }`}
              />
              <span className="font-mono text-[11px]">
                {endpointStatus.ollama.online
                  ? 'Ollama: Connected'
                  : demoMode
                  ? 'Ollama: Demo Mode'
                  : 'Ollama: Offline'}
              </span>
              <RefreshCw className="w-2.5 h-2.5 opacity-60 hover:opacity-100" />
            </button>

            <span className="text-slate-600">•</span>

            {/* Model Name */}
            <button
              onClick={onOpenModelManager}
              className="text-cyan-400 hover:text-cyan-300 font-mono text-[11px] truncate max-w-[140px] flex items-center gap-1 hover:underline"
              title="Click to manage or pull models"
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
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
            activeTab === 'chat'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
              : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          <span>Chat & Vision</span>
        </button>

        <button
          id="tab-image"
          onClick={() => setActiveTab('image')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
            activeTab === 'image'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
              : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
          }`}
        >
          <ImageIcon className="w-4 h-4" />
          <span>Text-to-Image</span>
        </button>

        <button
          id="tab-video"
          onClick={() => setActiveTab('video')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
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
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 border border-emerald-500/30 ml-1 transition-all"
        >
          <Terminal className="w-4 h-4" />
          <span>Windows .bat Launcher</span>
        </button>
      </nav>

      {/* Action Buttons */}
      <div className="flex items-center gap-2">
        <button
          id="btn-models"
          onClick={onOpenModelManager}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs rounded-lg border border-slate-700 transition"
          title="Pull or switch local Ollama models"
        >
          <Database className="w-3.5 h-3.5 text-cyan-400" />
          <span>Models</span>
        </button>

        <button
          id="btn-settings"
          onClick={onOpenSettings}
          className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg border border-slate-700 transition"
          title="App & API Settings"
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
