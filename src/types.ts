export interface OllamaModel {
  name: string;
  model: string;
  modified_at: string;
  size: number;
  digest: string;
  details?: {
    format: string;
    family: string;
    families: string[] | null;
    parameter_size: string;
    quantization_level: string;
  };
  isVision?: boolean;
}

export interface ChatAttachment {
  id: string;
  base64: string; // raw base64 or dataURL
  name: string;
  mimeType: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  images?: string[]; // base64 strings without data prefix for Ollama
  attachments?: ChatAttachment[];
  timestamp: number;
  thinking?: string;
  model?: string;
  metrics?: {
    totalDuration?: number;
    evalCount?: number;
    evalDuration?: number;
    tokensPerSecond?: number;
  };
}

export interface Conversation {
  id: string;
  title: string;
  model: string;
  messages: ChatMessage[];
  updatedAt: number;
  systemPrompt?: string;
}

export interface AppSettings {
  ollamaUrl: string;
  videoUrl: string;
  comfyUrl: string;
  sdWebUiUrl: string;
  useProxy: boolean;
  temperature: number;
  topP: number;
  contextLength: number;
  systemPrompt: string;
  demoMode: boolean;
}

export interface EndpointStatus {
  ollama: { online: boolean; status: number; url: string; version?: string };
  video: { online: boolean; status: number; url: string };
  comfy: { online: boolean; status: number; url: string };
  sd: { online: boolean; status: number; url: string };
}

export interface GeneratedImage {
  id: string;
  prompt: string;
  negativePrompt?: string;
  imageUrl: string;
  width: number;
  height: number;
  seed: number;
  model: string;
  createdAt: number;
}

export interface GeneratedVideo {
  id: string;
  prompt: string;
  sourceImageUrl?: string;
  videoUrl: string;
  fps: number;
  frames: number;
  motionBucket: number;
  createdAt: number;
}

export type ActiveTab = 'chat' | 'image' | 'video' | 'setup';
