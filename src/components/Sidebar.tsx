import React, { useState } from 'react';
import {
  Plus,
  MessageSquare,
  Trash2,
  Database,
  ChevronDown,
  Eye,
  SlidersHorizontal,
  Terminal,
  FileCode,
} from 'lucide-react';
import { Conversation, OllamaModel } from '../types';

interface SidebarProps {
  conversations: Conversation[];
  currentConversationId: string;
  onSelectConversation: (id: string) => void;
  onNewConversation: () => void;
  onDeleteConversation: (id: string) => void;
  models: OllamaModel[];
  selectedModel: string;
  onSelectModel: (modelName: string) => void;
  onOpenModelManager: () => void;
  onOpenWindowsModal: () => void;
  systemPrompt: string;
  onUpdateSystemPrompt: (prompt: string) => void;
  isModelVision: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  conversations,
  currentConversationId,
  onSelectConversation,
  onNewConversation,
  onDeleteConversation,
  models,
  selectedModel,
  onSelectModel,
  onOpenModelManager,
  onOpenWindowsModal,
  systemPrompt,
  onUpdateSystemPrompt,
  isModelVision,
}) => {
  const [showSystemPrompt, setShowSystemPrompt] = useState(false);

  return (
    <aside className="w-72 bg-slate-920 border-r border-slate-800 flex flex-col h-full shrink-0 select-none">
      {/* Top Action: New Chat */}
      <div className="p-3 border-b border-slate-800/80 space-y-2.5">
        <button
          id="btn-new-chat"
          onClick={onNewConversation}
          className="w-full py-2.5 px-3 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-2 shadow-sm transition"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>New Chat</span>
        </button>

        {/* Model Picker Selector */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-2">
          <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1 px-1">
            <span className="flex items-center gap-1 font-medium">
              <Database className="w-3 h-3 text-cyan-400" />
              Active Model
            </span>
            <button
              onClick={onOpenModelManager}
              className="text-[10px] text-cyan-400 hover:underline"
            >
              Manage
            </button>
          </div>

          <div className="relative">
            <select
              value={selectedModel}
              onChange={(e) => onSelectModel(e.target.value)}
              className="w-full bg-slate-950 text-white text-xs font-mono py-1.5 px-2.5 pr-7 rounded-lg border border-slate-700/80 focus:outline-none focus:border-cyan-500 appearance-none cursor-pointer truncate"
            >
              {models.map((m) => (
                <option key={m.name} value={m.name}>
                  {m.name} {m.isVision ? '(Vision)' : ''}
                </option>
              ))}
              {models.length === 0 && (
                <option value="llama3.2:latest">llama3.2:latest (Default)</option>
              )}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2 top-2.5 pointer-events-none" />
          </div>

          {/* Model feature tag */}
          <div className="mt-1.5 px-1 flex items-center justify-between">
            {isModelVision ? (
              <span className="inline-flex items-center gap-1 text-[10px] font-mono text-purple-300 bg-purple-950/70 border border-purple-800/60 px-1.5 py-0.5 rounded">
                <Eye className="w-2.5 h-2.5" /> Vision Multimodal Ready
              </span>
            ) : (
              <span className="text-[10px] font-mono text-slate-400">
                Text / Code Model
              </span>
            )}
            <button
              onClick={() => setShowSystemPrompt(!showSystemPrompt)}
              className={`text-[10px] flex items-center gap-1 ${
                showSystemPrompt || systemPrompt
                  ? 'text-cyan-400 font-medium'
                  : 'text-slate-400 hover:text-slate-300'
              }`}
            >
              <SlidersHorizontal className="w-2.5 h-2.5" />
              Prompt
            </button>
          </div>
        </div>

        {/* Expandable System Prompt */}
        {showSystemPrompt && (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-2.5 space-y-1.5 animate-fade-in">
            <div className="flex items-center justify-between text-[11px] text-slate-300">
              <span className="font-semibold">System Instructions</span>
              {systemPrompt && (
                <button
                  onClick={() => onUpdateSystemPrompt('')}
                  className="text-[10px] text-slate-500 hover:text-rose-400"
                >
                  Clear
                </button>
              )}
            </div>
            <textarea
              value={systemPrompt}
              onChange={(e) => onUpdateSystemPrompt(e.target.value)}
              placeholder="e.g. You are an expert TypeScript developer..."
              rows={3}
              className="w-full bg-slate-950 text-xs text-slate-200 border border-slate-800 rounded-lg p-2 focus:outline-none focus:border-cyan-500 resize-none font-sans"
            />
          </div>
        )}
      </div>

      {/* Conversation History List */}
      <div className="flex-1 overflow-y-auto px-2 py-2 space-y-1">
        <div className="px-2 py-1 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
          Conversations ({conversations.length})
        </div>

        {conversations.length === 0 ? (
          <div className="p-4 text-center text-xs text-slate-600">
            No chats yet. Start a new conversation!
          </div>
        ) : (
          conversations.map((conv) => {
            const isActive = conv.id === currentConversationId;
            return (
              <div
                key={conv.id}
                onClick={() => onSelectConversation(conv.id)}
                className={`group flex items-center justify-between px-2.5 py-2 rounded-xl text-xs cursor-pointer transition-all ${
                  isActive
                    ? 'bg-slate-800 text-white font-medium border border-slate-700/80 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0 pr-1">
                  <MessageSquare
                    className={`w-3.5 h-3.5 shrink-0 ${
                      isActive ? 'text-cyan-400' : 'text-slate-600'
                    }`}
                  />
                  <span className="truncate">{conv.title || 'New Chat'}</span>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteConversation(conv.id);
                  }}
                  className="opacity-0 group-hover:opacity-100 p-1 text-slate-500 hover:text-rose-400 rounded transition"
                  title="Delete chat"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            );
          })
        )}
      </div>

      {/* Bottom Launcher Quick-Banner */}
      <div className="p-3 border-t border-slate-800 bg-slate-950/60">
        <button
          onClick={onOpenWindowsModal}
          className="w-full p-2.5 rounded-xl bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-emerald-500/40 text-left flex items-center gap-2.5 transition group"
        >
          <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center shrink-0">
            <Terminal className="w-3.5 h-3.5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-xs font-semibold text-slate-200 group-hover:text-emerald-300 flex items-center gap-1">
              <span>Windows .bat</span>
            </div>
            <p className="text-[10px] text-slate-500 truncate">Run natively on Windows</p>
          </div>
        </button>
      </div>
    </aside>
  );
};
