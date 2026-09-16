import React, { useState, useEffect, useRef } from 'react';
import {
  OllamaModel,
  ChatMessage,
  Conversation,
  AppSettings,
  EndpointStatus,
  ActiveTab,
  ChatAttachment,
} from './types';
import {
  fetchOllamaModels,
  streamOllamaChat,
  isModelVision,
  POPULAR_MODELS,
} from './services/ollamaApi';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { ChatView } from './components/ChatView';
import { ChatInput } from './components/ChatInput';
import { ImageGenView } from './components/ImageGenView';
import { VideoGenView } from './components/VideoGenView';
import { WindowsLauncherModal } from './components/WindowsLauncherModal';
import { ModelManagerModal } from './components/ModelManagerModal';
import { SettingsModal } from './components/SettingsModal';

const DEFAULT_SETTINGS: AppSettings = {
  ollamaUrl: 'http://127.0.0.1:11434',
  videoUrl: 'http://127.0.0.1:8000',
  comfyUrl: 'http://127.0.0.1:8188',
  sdWebUiUrl: 'http://127.0.0.1:7860',
  useProxy: true,
  temperature: 0.7,
  topP: 0.9,
  contextLength: 4096,
  systemPrompt: '',
  demoMode: true,
  // AMD Ryzen 5 7520U + 16GB RAM + 486MB Radeon Graphics Optimization
  cpuThreads: 4,
  lowVramMode: true,
  dataSaverUnder1Gb: true,
  localImageModelPath: 'C:\\models\\v1-5-pruned-emaonly.safetensors',
  tts: {
    enabled: true,
    engine: 'native_windows',
    voice: '',
    rate: 1.0,
    pitch: 1.0,
    volume: 1.0,
    autoPlay: false,
  },
};

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('chat');

  // App Settings
  const [settings, setSettings] = useState<AppSettings>(() => {
    const saved = localStorage.getItem('ollama_studio_settings');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return {
          ...DEFAULT_SETTINGS,
          ...parsed,
          tts: { ...DEFAULT_SETTINGS.tts, ...(parsed.tts || {}) },
        };
      } catch {}
    }
    return DEFAULT_SETTINGS;
  });

  // Endpoints status
  const [endpointStatus, setEndpointStatus] = useState<EndpointStatus>({
    ollama: { online: false, status: 0, url: settings.ollamaUrl },
    video: { online: false, status: 0, url: settings.videoUrl },
    comfy: { online: false, status: 0, url: settings.comfyUrl },
    sd: { online: false, status: 0, url: settings.sdWebUiUrl },
  });

  // Models
  const [models, setModels] = useState<OllamaModel[]>([]);
  const [selectedModel, setSelectedModel] = useState<string>('llama3.2:latest');

  // Conversations
  const [conversations, setConversations] = useState<Conversation[]>(() => {
    const saved = localStorage.getItem('ollama_studio_convos');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {}
    }
    const initialConvo: Conversation = {
      id: `c-${Date.now()}`,
      title: 'New Chat',
      model: 'llama3.2:latest',
      messages: [],
      updatedAt: Date.now(),
    };
    return [initialConvo];
  });

  const [currentConvoId, setCurrentConvoId] = useState<string>(() => {
    return conversations[0]?.id || `c-${Date.now()}`;
  });

  // Streaming State
  const [isStreaming, setIsStreaming] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Modals
  const [isWindowsModalOpen, setIsWindowsModalOpen] = useState(false);
  const [isModelManagerOpen, setIsModelManagerOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

  // Inter-tab handoff for video generation
  const [videoHandoffImage, setVideoHandoffImage] = useState<string | undefined>();
  const [videoHandoffPrompt, setVideoHandoffPrompt] = useState<string | undefined>();

  // Persist Settings
  useEffect(() => {
    localStorage.setItem('ollama_studio_settings', JSON.stringify(settings));
  }, [settings]);

  // Persist Conversations
  useEffect(() => {
    localStorage.setItem('ollama_studio_convos', JSON.stringify(conversations));
  }, [conversations]);

  // Check Endpoints and Auto-Detect Models
  const checkStatusAndLoadModels = async () => {
    try {
      const res = await fetch('/api/check-endpoints', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ollamaUrl: settings.ollamaUrl,
          videoUrl: settings.videoUrl,
          comfyUrl: settings.comfyUrl,
          sdUrl: settings.sdWebUiUrl,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setEndpointStatus(data);
        if (data.ollama.online && settings.demoMode) {
          setSettings((prev) => ({ ...prev, demoMode: false }));
        }
      }
    } catch {}

    // Auto-detect pre-installed Ollama models directly from Windows daemon
    try {
      const fetchedModels = await fetchOllamaModels(settings);
      setModels(fetchedModels);
      if (fetchedModels.length > 0 && !fetchedModels.some((m) => m.name === selectedModel)) {
        setSelectedModel(fetchedModels[0].name);
      }
    } catch (err) {
      console.warn('Auto-detect pre-installed models:', err);
    }
  };

  useEffect(() => {
    checkStatusAndLoadModels();
    const interval = setInterval(checkStatusAndLoadModels, 15000);
    return () => clearInterval(interval);
  }, [settings.ollamaUrl, settings.videoUrl, settings.useProxy]);

  // Current conversation
  const currentConversation =
    conversations.find((c) => c.id === currentConvoId) || conversations[0];

  const handleNewConversation = () => {
    const newConvo: Conversation = {
      id: `c-${Date.now()}`,
      title: 'New Chat',
      model: selectedModel,
      messages: [],
      updatedAt: Date.now(),
    };
    setConversations((prev) => [newConvo, ...prev]);
    setCurrentConvoId(newConvo.id);
  };

  const handleDeleteConversation = (id: string) => {
    setConversations((prev) => {
      const filtered = prev.filter((c) => c.id !== id);
      if (filtered.length === 0) {
        const fresh: Conversation = {
          id: `c-${Date.now()}`,
          title: 'New Chat',
          model: selectedModel,
          messages: [],
          updatedAt: Date.now(),
        };
        setCurrentConvoId(fresh.id);
        return [fresh];
      }
      if (currentConvoId === id) {
        setCurrentConvoId(filtered[0].id);
      }
      return filtered;
    });
  };

  // Send message
  const handleSendMessage = async (text: string, attachments: ChatAttachment[] = []) => {
    if (isStreaming) return;

    const rawImages = attachments.map((att) => att.base64.split(',')[1] || att.base64);

    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: text,
      images: rawImages.length > 0 ? rawImages : undefined,
      attachments: attachments.length > 0 ? attachments : undefined,
      timestamp: Date.now(),
    };

    const assistantMsgId = `asst-${Date.now() + 1}`;
    const initialAssistantMsg: ChatMessage = {
      id: assistantMsgId,
      role: 'assistant',
      content: '',
      model: selectedModel,
      timestamp: Date.now(),
    };

    setConversations((prev) =>
      prev.map((c) => {
        if (c.id === currentConvoId) {
          const newMessages = [...c.messages, userMessage, initialAssistantMsg];
          const title =
            c.messages.length === 0 && text.trim()
              ? text.trim().slice(0, 32)
              : c.title;
          return {
            ...c,
            title,
            messages: newMessages,
            updatedAt: Date.now(),
          };
        }
        return c;
      })
    );

    setIsStreaming(true);
    abortControllerRef.current = new AbortController();

    const convoMessages = [...currentConversation.messages, userMessage];

    try {
      await streamOllamaChat(
        selectedModel,
        convoMessages,
        currentConversation.systemPrompt || settings.systemPrompt,
        settings,
        abortControllerRef.current.signal,
        (_chunk, fullContent, thinking) => {
          setConversations((prev) =>
            prev.map((c) => {
              if (c.id === currentConvoId) {
                return {
                  ...c,
                  messages: c.messages.map((m) =>
                    m.id === assistantMsgId
                      ? { ...m, content: fullContent, thinking }
                      : m
                  ),
                };
              }
              return c;
            })
          );
        },
        (metrics) => {
          setConversations((prev) =>
            prev.map((c) => {
              if (c.id === currentConvoId) {
                return {
                  ...c,
                  messages: c.messages.map((m) =>
                    m.id === assistantMsgId ? { ...m, metrics } : m
                  ),
                };
              }
              return c;
            })
          );
        }
      );
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        setConversations((prev) =>
          prev.map((c) => {
            if (c.id === currentConvoId) {
              return {
                ...c,
                messages: c.messages.map((m) =>
                  m.id === assistantMsgId
                    ? {
                        ...m,
                        content: `⚠️ **Connection Error**: ${err.message}\n\n*Make sure Ollama is running on your Windows machine by clicking \`run_ollama_studio.bat\` or turning on Simulation Mode in Settings.*`,
                      }
                    : m
                ),
              };
            }
            return c;
          })
        );
      }
    } finally {
      setIsStreaming(false);
      abortControllerRef.current = null;
    }
  };

  const handleAbortStreaming = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setIsStreaming(false);
    }
  };

  const handleRegenerate = () => {
    const msgs = currentConversation.messages;
    if (msgs.length === 0) return;

    let lastUserMsg: ChatMessage | null = null;
    for (let i = msgs.length - 1; i >= 0; i--) {
      if (msgs[i].role === 'user') {
        lastUserMsg = msgs[i];
        break;
      }
    }

    if (lastUserMsg) {
      setConversations((prev) =>
        prev.map((c) =>
          c.id === currentConvoId
            ? {
                ...c,
                messages: c.messages.filter(
                  (m) => !(m.role === 'assistant' && m.timestamp > lastUserMsg!.timestamp)
                ),
              }
            : c
        )
      );
      handleSendMessage(lastUserMsg.content, lastUserMsg.attachments || []);
    }
  };

  const handleSwitchToVisionModel = () => {
    const visionModel = models.find((m) => m.isVision);
    if (visionModel) {
      setSelectedModel(visionModel.name);
    } else {
      setSelectedModel('llama3.2-vision:latest');
      setIsModelManagerOpen(true);
    }
  };

  const handleSendToVideo = (imageUrl: string, prompt: string) => {
    setVideoHandoffImage(imageUrl);
    setVideoHandoffPrompt(prompt);
    setActiveTab('video');
  };

  const currentIsVision = isModelVision(selectedModel);

  return (
    <div className="flex flex-col h-screen w-full bg-slate-950 text-slate-100 font-sans overflow-hidden antialiased selection:bg-cyan-500 selection:text-white">
      {/* Navigation Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        endpointStatus={endpointStatus}
        selectedModel={selectedModel}
        onOpenSettings={() => setIsSettingsModalOpen(true)}
        onOpenModelManager={() => setIsModelManagerOpen(true)}
        onOpenWindowsModal={() => setIsWindowsModalOpen(true)}
        onRefreshStatus={checkStatusAndLoadModels}
        demoMode={settings.demoMode}
      />

      {/* Main Workspace Body */}
      <div className="flex-1 flex overflow-hidden">
        {activeTab === 'chat' && (
          <>
            {/* Sidebar with conversation history and models */}
            <Sidebar
              conversations={conversations}
              currentConversationId={currentConvoId}
              onSelectConversation={setCurrentConvoId}
              onNewConversation={handleNewConversation}
              onDeleteConversation={handleDeleteConversation}
              models={models}
              selectedModel={selectedModel}
              onSelectModel={setSelectedModel}
              onOpenModelManager={() => setIsModelManagerOpen(true)}
              onOpenWindowsModal={() => setIsWindowsModalOpen(true)}
              systemPrompt={currentConversation?.systemPrompt || settings.systemPrompt}
              onUpdateSystemPrompt={(prompt) => {
                setConversations((prev) =>
                  prev.map((c) => (c.id === currentConvoId ? { ...c, systemPrompt: prompt } : c))
                );
              }}
              isModelVision={currentIsVision}
            />

            {/* Central Chat, Vision & Speech Canvas */}
            <main className="flex-1 flex flex-col h-full bg-slate-950 min-w-0">
              <ChatView
                messages={currentConversation.messages}
                isStreaming={isStreaming}
                onRegenerate={handleRegenerate}
                onSelectPrompt={(p) => handleSendMessage(p)}
                selectedModel={selectedModel}
                isModelVision={currentIsVision}
                onOpenWindowsModal={() => setIsWindowsModalOpen(true)}
                ttsConfig={settings.tts}
              />

              <ChatInput
                onSendMessage={handleSendMessage}
                isStreaming={isStreaming}
                onAbort={handleAbortStreaming}
                isModelVision={currentIsVision}
                onSwitchToVisionModel={handleSwitchToVisionModel}
                selectedModel={selectedModel}
              />
            </main>
          </>
        )}

        {activeTab === 'image' && (
          <ImageGenView
            settings={settings}
            selectedModel={selectedModel}
            onSendToVideo={handleSendToVideo}
            onOpenWindowsModal={() => setIsWindowsModalOpen(true)}
          />
        )}

        {activeTab === 'video' && (
          <VideoGenView
            settings={settings}
            endpointStatus={endpointStatus}
            initialImageUrl={videoHandoffImage}
            initialPrompt={videoHandoffPrompt}
            onOpenWindowsModal={() => setIsWindowsModalOpen(true)}
          />
        )}
      </div>

      {/* Windows .bat Launcher Modal */}
      <WindowsLauncherModal
        isOpen={isWindowsModalOpen}
        onClose={() => setIsWindowsModalOpen(false)}
      />

      {/* Model Manager Modal */}
      <ModelManagerModal
        isOpen={isModelManagerOpen}
        onClose={() => setIsModelManagerOpen(false)}
        models={models}
        selectedModel={selectedModel}
        onSelectModel={setSelectedModel}
        onRefreshModels={checkStatusAndLoadModels}
        settings={settings}
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        settings={settings}
        onUpdateSettings={(newSettings) => setSettings((prev) => ({ ...prev, ...newSettings }))}
        onResetSettings={() => setSettings(DEFAULT_SETTINGS)}
      />
    </div>
  );
}
