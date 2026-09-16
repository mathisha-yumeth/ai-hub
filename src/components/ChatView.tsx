import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import {
  Copy,
  Check,
  RotateCcw,
  Sparkles,
  Bot,
  User,
  ChevronDown,
  ChevronRight,
  BrainCircuit,
  Zap,
  Eye,
  Terminal,
  Volume2,
  VolumeX,
  Cpu,
  HardDrive,
  ShieldCheck,
} from 'lucide-react';
import { ChatMessage, TTSConfig } from '../types';
import { speakText, stopSpeaking } from '../services/ttsService';

interface ChatViewProps {
  messages: ChatMessage[];
  isStreaming: boolean;
  onRegenerate: () => void;
  onSelectPrompt: (prompt: string) => void;
  selectedModel: string;
  isModelVision: boolean;
  onOpenWindowsModal: () => void;
  ttsConfig: TTSConfig;
}

export const ChatView: React.FC<ChatViewProps> = ({
  messages,
  isStreaming,
  onRegenerate,
  onSelectPrompt,
  selectedModel,
  isModelVision,
  onOpenWindowsModal,
  ttsConfig,
}) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [expandedThinking, setExpandedThinking] = useState<Record<string, boolean>>({});
  const [speakingMsgId, setSpeakingMsgId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isStreaming]);

  // Handle TTS Speak / Stop
  const handleToggleSpeak = (msgId: string, content: string) => {
    if (speakingMsgId === msgId) {
      stopSpeaking();
      setSpeakingMsgId(null);
    } else {
      stopSpeaking();
      setSpeakingMsgId(msgId);
      speakText(
        content,
        ttsConfig,
        () => setSpeakingMsgId(msgId),
        () => setSpeakingMsgId(null),
        () => setSpeakingMsgId(null)
      );
    }
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const toggleThinking = (id: string) => {
    setExpandedThinking((prev) => ({
      ...prev,
      [id]: prev[id] === undefined ? false : !prev[id],
    }));
  };

  // Sample prompt chips for new conversation
  const samplePrompts = [
    {
      title: 'Analyze Image with Vision',
      prompt: 'Describe everything in this image in detail, noting key subjects, colors, lighting, and any legible text.',
      vision: true,
    },
    {
      title: 'Windows PowerShell Script',
      prompt: 'Write an optimized Windows PowerShell script to clean temporary cache files and monitor RAM usage.',
      vision: false,
    },
    {
      title: 'Deep Thinking & Logic Problem',
      prompt: 'Solve this step-by-step: If 5 machines take 5 minutes to make 5 widgets, how long would it take 100 machines to make 100 widgets? Explain thoroughly.',
      vision: false,
    },
    {
      title: 'Prompt for Local Image Gen',
      prompt: 'Write an ultra-detailed, photorealistic Stable Diffusion prompt for a futuristic city with flying neon vehicles in the rain.',
      vision: false,
    },
  ];

  return (
    <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
      {/* Hardware Profile Top Ribbon */}
      <div className="max-w-4xl mx-auto flex flex-wrap items-center justify-between gap-2 px-3.5 py-2 bg-slate-900/60 border border-slate-800/80 rounded-xl text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <Cpu className="w-3.5 h-3.5 text-cyan-400" />
          <span className="font-semibold text-slate-200">Device: Mathisha</span>
          <span className="text-slate-500">•</span>
          <span className="text-slate-300">AMD Ryzen 5 7520U (4 Cores / 8 Threads)</span>
          <span className="text-slate-500">•</span>
          <span className="text-slate-300">16 GB RAM</span>
        </div>

        <div className="flex items-center gap-2">
          <span className="bg-emerald-950/60 border border-emerald-500/30 text-emerald-400 px-2 py-0.5 rounded text-[11px] font-mono flex items-center gap-1">
            <ShieldCheck className="w-3 h-3" />
            0 MB Internet (Local Pre-installed)
          </span>
          <span className="bg-purple-950/60 border border-purple-500/30 text-purple-300 px-2 py-0.5 rounded text-[11px] font-mono">
            Low VRAM Offload (486MB)
          </span>
        </div>
      </div>

      {messages.length === 0 ? (
        <div className="max-w-2xl mx-auto py-8 text-center space-y-6 animate-fade-in">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-cyan-500/20 to-blue-500/20 border border-cyan-500/30 flex items-center justify-center mx-auto text-cyan-400 shadow-xl shadow-cyan-500/10">
            <Bot className="w-8 h-8" />
          </div>

          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">
              Local Ollama & Vision Studio
            </h2>
            <p className="text-xs text-slate-400 max-w-md mx-auto mt-1.5 leading-relaxed">
              Auto-detected pre-installed models on your Windows PC. Everything executes completely offline with zero data consumption.
            </p>
          </div>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-3 gap-2.5 max-w-lg mx-auto text-left">
            <div className="p-2.5 bg-slate-900 border border-slate-800 rounded-xl">
              <span className="text-[10px] text-slate-400 block uppercase font-mono">Chat & Vision</span>
              <span className="text-xs font-semibold text-cyan-400 mt-0.5 block">0 MB Data</span>
              <span className="text-[10px] text-slate-500">Local Ollama</span>
            </div>
            <div className="p-2.5 bg-slate-900 border border-slate-800 rounded-xl">
              <span className="text-[10px] text-slate-400 block uppercase font-mono">Local Images</span>
              <span className="text-xs font-semibold text-emerald-400 mt-0.5 block">From Disk</span>
              <span className="text-[10px] text-slate-500">.safetensors / CPU</span>
            </div>
            <div className="p-2.5 bg-slate-900 border border-slate-800 rounded-xl">
              <span className="text-[10px] text-slate-400 block uppercase font-mono">Text-to-Speech</span>
              <span className="text-xs font-semibold text-purple-400 mt-0.5 block">&lt; 45 MB</span>
              <span className="text-[10px] text-slate-500">Windows SAPI / HF</span>
            </div>
          </div>

          {/* Prompt Suggestion Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
            {samplePrompts.map((p, idx) => (
              <button
                key={idx}
                onClick={() => onSelectPrompt(p.prompt)}
                className="p-3.5 bg-slate-900/80 hover:bg-slate-850 border border-slate-800 hover:border-cyan-500/40 rounded-xl text-left transition group shadow-sm"
              >
                <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-200 group-hover:text-cyan-300 mb-1">
                  {p.vision ? (
                    <Eye className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                  ) : (
                    <Sparkles className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                  )}
                  <span>{p.title}</span>
                </div>
                <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed font-sans">
                  {p.prompt}
                </p>
              </button>
            ))}
          </div>

          <div className="pt-2 border-t border-slate-800/80 flex items-center justify-center gap-2 text-xs text-slate-500">
            <Terminal className="w-3.5 h-3.5 text-emerald-400" />
            <span>Click</span>
            <button
              onClick={onOpenWindowsModal}
              className="text-emerald-400 hover:underline font-mono"
            >
              run_ollama_studio.bat
            </button>
            <span>to open on your PC</span>
          </div>
        </div>
      ) : (
        <div className="max-w-4xl mx-auto space-y-5">
          {messages.map((msg) => {
            const isUser = msg.role === 'user';
            const isThinkingExpanded = expandedThinking[msg.id] !== false;
            const isSpeaking = speakingMsgId === msg.id;

            return (
              <div
                key={msg.id}
                className={`flex gap-3 text-sm ${
                  isUser ? 'justify-end' : 'justify-start'
                }`}
              >
                {/* Assistant Avatar */}
                {!isUser && (
                  <div className="w-8 h-8 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-cyan-400 shrink-0 mt-0.5">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                {/* Message Bubble */}
                <div
                  className={`max-w-[85%] space-y-2 ${
                    isUser
                      ? 'bg-cyan-600 text-white rounded-2xl rounded-tr-sm px-4 py-3 shadow-md'
                      : 'bg-slate-900 border border-slate-800 rounded-2xl rounded-tl-sm p-4 text-slate-200 shadow-sm'
                  }`}
                >
                  {/* User Attached Images */}
                  {msg.attachments && msg.attachments.length > 0 && (
                    <div className="flex flex-wrap gap-2 pb-2">
                      {msg.attachments.map((att) => (
                        <div key={att.id} className="relative rounded-lg overflow-hidden border border-white/20">
                          <img
                            src={att.base64}
                            alt={att.name}
                            className="max-h-48 max-w-xs object-cover rounded-lg"
                          />
                        </div>
                      ))}
                    </div>
                  )}

                  {/* DeepSeek Reasoning Thinking Block */}
                  {!isUser && msg.thinking && (
                    <div className="rounded-xl border border-slate-800 bg-slate-950/70 overflow-hidden mb-3">
                      <button
                        onClick={() => toggleThinking(msg.id)}
                        className="w-full px-3 py-2 text-xs flex items-center justify-between text-slate-400 hover:text-slate-200 bg-slate-900/60 font-mono transition"
                      >
                        <span className="flex items-center gap-1.5 text-cyan-400 font-medium">
                          <BrainCircuit className="w-3.5 h-3.5" />
                          Reasoning & Deduction
                        </span>
                        {isThinkingExpanded ? (
                          <ChevronDown className="w-3.5 h-3.5" />
                        ) : (
                          <ChevronRight className="w-3.5 h-3.5" />
                        )}
                      </button>
                      {isThinkingExpanded && (
                        <div className="p-3 text-xs font-mono text-slate-400 whitespace-pre-wrap leading-relaxed border-t border-slate-800/80 bg-slate-950/40">
                          {msg.thinking}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Message Content */}
                  <div className="prose prose-invert prose-sm max-w-none text-slate-100 leading-relaxed break-words font-sans">
                    <ReactMarkdown
                      components={{
                        code({ className, children, ...props }) {
                          const codeStr = String(children).replace(/\n$/, '');
                          const isInline = !className && !codeStr.includes('\n');

                          if (isInline) {
                            return (
                              <code
                                className="bg-slate-800/80 text-cyan-300 px-1.5 py-0.5 rounded text-xs font-mono"
                                {...props}
                              >
                                {children}
                              </code>
                            );
                          }

                          return (
                            <div className="relative my-3 rounded-xl overflow-hidden border border-slate-800 bg-slate-950">
                              <div className="flex items-center justify-between px-3 py-1.5 bg-slate-900 border-b border-slate-800 text-[11px] font-mono text-slate-400">
                                <span>Code</span>
                                <button
                                  onClick={() => handleCopy(codeStr, codeStr.slice(0, 10))}
                                  className="flex items-center gap-1 text-slate-400 hover:text-white"
                                >
                                  {copiedId === codeStr.slice(0, 10) ? (
                                    <Check className="w-3 h-3 text-emerald-400" />
                                  ) : (
                                    <Copy className="w-3 h-3" />
                                  )}
                                  <span>{copiedId === codeStr.slice(0, 10) ? 'Copied' : 'Copy'}</span>
                                </button>
                              </div>
                              <pre className="p-3 text-xs font-mono text-cyan-300 overflow-x-auto">
                                <code>{children}</code>
                              </pre>
                            </div>
                          );
                        },
                      }}
                    >
                      {msg.content}
                    </ReactMarkdown>
                  </div>

                  {/* Assistant Footer Info (TTS Read Aloud, Speed, Copy) */}
                  {!isUser && (
                    <div className="flex items-center justify-between pt-2 mt-2 border-t border-slate-800 text-[11px] text-slate-500">
                      <div className="flex items-center gap-2">
                        {msg.model && (
                          <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                            {msg.model}
                          </span>
                        )}
                        {msg.metrics?.tokensPerSecond && (
                          <span className="flex items-center gap-1 font-mono text-cyan-400">
                            <Zap className="w-2.5 h-2.5" />
                            {msg.metrics.tokensPerSecond} tok/s
                          </span>
                        )}
                        {msg.metrics?.totalDuration && (
                          <span className="font-mono">
                            {msg.metrics.totalDuration.toFixed(1)}s
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5">
                        {/* Text-to-Speech Speak Button */}
                        <button
                          onClick={() => handleToggleSpeak(msg.id, msg.content)}
                          className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition ${
                            isSpeaking
                              ? 'bg-purple-600 text-white animate-pulse'
                              : 'text-slate-400 hover:text-purple-300 hover:bg-slate-800'
                          }`}
                          title={isSpeaking ? 'Stop speaking' : 'Read aloud with Text-to-Speech'}
                        >
                          {isSpeaking ? (
                            <>
                              <VolumeX className="w-3.5 h-3.5" />
                              <span className="text-[10px] font-mono">Stop</span>
                            </>
                          ) : (
                            <>
                              <Volume2 className="w-3.5 h-3.5" />
                              <span className="text-[10px] font-mono">Speak</span>
                            </>
                          )}
                        </button>

                        <button
                          onClick={() => handleCopy(msg.content, msg.id)}
                          className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition"
                          title="Copy response"
                        >
                          {copiedId === msg.id ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* User Avatar */}
                {isUser && (
                  <div className="w-8 h-8 rounded-xl bg-cyan-700 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            );
          })}

          {/* Streaming Indicator */}
          {isStreaming && (
            <div className="flex items-center gap-2 text-xs text-cyan-400 animate-pulse pl-11">
              <span className="w-2 h-2 rounded-full bg-cyan-400" />
              <span>Generating response locally on Ryzen 5 CPU...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      )}
    </div>
  );
};
