import React, { useState } from 'react';
import {
  X,
  Database,
  Download,
  Check,
  Eye,
  Sparkles,
  Search,
  Loader2,
  HardDrive,
  Info,
  AlertCircle,
} from 'lucide-react';
import { OllamaModel, AppSettings } from '../types';
import { POPULAR_MODELS, pullOllamaModel } from '../services/ollamaApi';

interface ModelManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  models: OllamaModel[];
  selectedModel: string;
  onSelectModel: (modelName: string) => void;
  onRefreshModels: () => void;
  settings: AppSettings;
}

export const ModelManagerModal: React.FC<ModelManagerModalProps> = ({
  isOpen,
  onClose,
  models,
  selectedModel,
  onSelectModel,
  onRefreshModels,
  settings,
}) => {
  const [customModelInput, setCustomModelInput] = useState('');
  const [pullingModel, setPullingModel] = useState<string | null>(null);
  const [pullStatus, setPullStatus] = useState<string>('');
  const [pullProgress, setPullProgress] = useState<number | null>(null);
  const [pullError, setPullError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handlePull = async (modelName: string) => {
    setPullingModel(modelName);
    setPullStatus('Starting pull...');
    setPullProgress(0);
    setPullError(null);

    try {
      await pullOllamaModel(modelName, settings, (status, completed, total) => {
        setPullStatus(status);
        if (completed && total && total > 0) {
          setPullProgress(Math.round((completed / total) * 100));
        }
      });
      setPullStatus('Pull completed successfully!');
      setTimeout(() => {
        setPullingModel(null);
        setPullProgress(null);
        onRefreshModels();
        onSelectModel(modelName);
      }, 1200);
    } catch (err: any) {
      setPullError(err.message || 'Failed to pull model');
      setPullingModel(null);
    }
  };

  const isModelInstalled = (name: string) => {
    const base = name.split(':')[0].toLowerCase();
    return models.some(
      (m) => m.name.toLowerCase() === name.toLowerCase() || m.name.split(':')[0].toLowerCase() === base
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-850">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 flex items-center justify-center">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Local Ollama Models</h2>
              <p className="text-xs text-slate-400">
                {models.length} model{models.length !== 1 ? 's' : ''} available locally in Ollama
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

        {/* Pull Status Banner if active */}
        {pullingModel && (
          <div className="bg-cyan-950/70 border-b border-cyan-500/30 px-6 py-3">
            <div className="flex items-center justify-between text-xs text-cyan-300 mb-1.5 font-medium">
              <span className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
                Pulling <span className="font-mono font-bold text-white">{pullingModel}</span>: {pullStatus}
              </span>
              <span>{pullProgress !== null ? `${pullProgress}%` : ''}</span>
            </div>
            {pullProgress !== null && (
              <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-cyan-500 to-blue-500 h-full transition-all duration-300"
                  style={{ width: `${pullProgress}%` }}
                />
              </div>
            )}
          </div>
        )}

        {pullError && (
          <div className="bg-rose-950/70 border-b border-rose-500/30 px-6 py-2.5 flex items-center gap-2 text-xs text-rose-300">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{pullError}</span>
          </div>
        )}

        {/* Body Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Custom pull input */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
              <input
                type="text"
                placeholder="Enter model tag to pull (e.g. gemma2:9b, phi4, codellama)..."
                value={customModelInput}
                onChange={(e) => setCustomModelInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && customModelInput.trim() && handlePull(customModelInput.trim())}
                className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
            </div>
            <button
              disabled={!customModelInput.trim() || !!pullingModel}
              onClick={() => handlePull(customModelInput.trim())}
              className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white font-medium text-xs rounded-xl flex items-center gap-1.5 transition shrink-0"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Pull Model</span>
            </button>
          </div>

          {/* Installed Models */}
          <div>
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
              <HardDrive className="w-3.5 h-3.5 text-cyan-400" />
              Installed on your machine
            </h3>

            {models.length === 0 ? (
              <div className="p-6 border border-dashed border-slate-800 rounded-xl text-center">
                <Info className="w-6 h-6 text-slate-600 mx-auto mb-2" />
                <p className="text-xs text-slate-400">No local models detected yet.</p>
                <p className="text-[11px] text-slate-500 mt-1">
                  Click one of the recommended models below to install with one click!
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {models.map((m) => {
                  const isSelected = selectedModel === m.name;
                  return (
                    <div
                      key={m.name}
                      onClick={() => onSelectModel(m.name)}
                      className={`p-3 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${
                        isSelected
                          ? 'bg-cyan-950/30 border-cyan-500/50 shadow-md shadow-cyan-950/40'
                          : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 hover:bg-slate-800/40'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-mono text-xs font-semibold text-white truncate">
                              {m.name}
                            </span>
                            {m.isVision && (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-purple-900/60 text-purple-300 border border-purple-700/50 flex items-center gap-1">
                                <Eye className="w-2.5 h-2.5" /> Vision
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-400 mt-1">
                            {m.details?.parameter_size ? `${m.details.parameter_size} • ` : ''}
                            {(m.size / (1024 * 1024 * 1024)).toFixed(1)} GB
                            {m.details?.quantization_level ? ` • ${m.details.quantization_level}` : ''}
                          </p>
                        </div>

                        {isSelected ? (
                          <div className="w-6 h-6 rounded-full bg-cyan-500 text-slate-950 flex items-center justify-center shrink-0">
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                          </div>
                        ) : (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelectModel(m.name);
                            }}
                            className="text-xs text-slate-400 hover:text-white px-2 py-1 rounded bg-slate-800 text-[11px]"
                          >
                            Use
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Recommended Models */}
          <div>
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              Recommended for Windows Local Inference
            </h3>

            <div className="space-y-2">
              {POPULAR_MODELS.map((pm) => {
                const installed = isModelInstalled(pm.name);
                const isCurrentlyPulling = pullingModel === pm.name;

                return (
                  <div
                    key={pm.name}
                    className="p-3 bg-slate-950/40 border border-slate-800 rounded-xl flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-semibold text-slate-200">
                          {pm.name}
                        </span>
                        {pm.vision && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-purple-900/60 text-purple-300 border border-purple-700/50 flex items-center gap-1">
                            <Eye className="w-2.5 h-2.5" /> Vision Multimodal
                          </span>
                        )}
                        <span className="text-[10px] text-slate-500 font-mono">({pm.size})</span>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5 truncate">{pm.desc}</p>
                    </div>

                    <div className="shrink-0">
                      {installed ? (
                        <button
                          onClick={() => onSelectModel(pm.name)}
                          className="px-3 py-1.5 bg-slate-800 text-emerald-400 text-xs rounded-lg flex items-center gap-1 font-medium hover:bg-slate-700 transition"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Installed</span>
                        </button>
                      ) : (
                        <button
                          disabled={!!pullingModel}
                          onClick={() => handlePull(pm.name)}
                          className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white text-xs rounded-lg flex items-center gap-1 font-medium shadow-sm transition"
                        >
                          {isCurrentlyPulling ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Download className="w-3.5 h-3.5" />
                          )}
                          <span>{isCurrentlyPulling ? 'Pulling...' : 'Pull'}</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950 flex items-center justify-between">
          <button
            onClick={onRefreshModels}
            className="text-xs text-slate-400 hover:text-white flex items-center gap-1.5"
          >
            Refresh Local List
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-medium rounded-lg transition"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
