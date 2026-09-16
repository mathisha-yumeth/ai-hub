import { OllamaModel, ChatMessage, AppSettings } from '../types';

export const POPULAR_MODELS = [
  // Ultra-Lightweight (< 1GB) models for limited internet connections
  {
    name: 'qwen2.5:0.5b',
    desc: 'Qwen 2.5 0.5B - Ultra-compact, fast, fits easily under 1GB internet',
    vision: false,
    size: '398 MB',
    dataUnder1Gb: true,
  },
  {
    name: 'moondream:1.8b',
    desc: 'Moondream 1.8B - Smallest offline multimodal Vision model, under 1GB',
    vision: true,
    size: '820 MB',
    dataUnder1Gb: true,
  },
  {
    name: 'smollm2:1.7b',
    desc: 'SmolLM2 1.7B - High quality text generation under 1GB footprint',
    vision: false,
    size: '900 MB',
    dataUnder1Gb: true,
  },
  // Standard models for users who already have them pre-installed (0 MB new internet!)
  {
    name: 'llama3.2:latest',
    desc: 'Meta Llama 3.2 3B - Ultra fast on AMD Ryzen 5 CPU, 0 MB if pre-installed',
    vision: false,
    size: '2.0 GB',
    dataUnder1Gb: false,
  },
  {
    name: 'llama3.2-vision:latest',
    desc: 'Meta Llama 3.2 11B Vision - Powerful image understanding, 0 MB if pre-installed',
    vision: true,
    size: '7.9 GB',
    dataUnder1Gb: false,
  },
  {
    name: 'deepseek-r1:8b',
    desc: 'DeepSeek R1 8B - Step-by-step thinking & math, 0 MB if pre-installed',
    vision: false,
    size: '4.9 GB',
    dataUnder1Gb: false,
  },
  {
    name: 'mistral:latest',
    desc: 'Mistral 7B - Fast coding and reasoning, 0 MB if pre-installed',
    vision: false,
    size: '4.1 GB',
    dataUnder1Gb: false,
  },
  {
    name: 'llava:latest',
    desc: 'LLaVA 7B - Multimodal vision model, 0 MB if pre-installed',
    vision: true,
    size: '4.7 GB',
    dataUnder1Gb: false,
  },
];

export function isModelVision(modelName: string): boolean {
  const lower = modelName.toLowerCase();
  return (
    lower.includes('vision') ||
    lower.includes('llava') ||
    lower.includes('moondream') ||
    lower.includes('minicpm-v') ||
    lower.includes('qwen-vl') ||
    lower.includes('qwen2-vl') ||
    lower.includes('bakllava')
  );
}

function getBaseUrl(settings: AppSettings): string {
  if (settings.useProxy) {
    return '/api/ollama';
  }
  return settings.ollamaUrl.replace(/\/$/, '');
}

/**
 * Auto-detects all pre-installed Ollama models directly from local disk/daemon
 */
export async function fetchOllamaModels(settings: AppSettings): Promise<OllamaModel[]> {
  try {
    const baseUrl = getBaseUrl(settings);
    const headers: Record<string, string> = {};
    if (settings.useProxy && settings.ollamaUrl) {
      headers['x-ollama-host'] = settings.ollamaUrl;
    }

    const res = await fetch(`${baseUrl}/api/tags`, {
      method: 'GET',
      headers,
    });

    if (!res.ok) {
      throw new Error(`Ollama returned status ${res.status}`);
    }

    const data = await res.json();
    const models: OllamaModel[] = (data.models || []).map((m: any) => ({
      ...m,
      isVision: isModelVision(m.name),
      isPreinstalled: true, // Detected on user's machine, 0 MB download!
    }));

    return models;
  } catch (error) {
    console.warn('Auto-detection: Live Ollama not reachable in preview:', error);
    if (settings.demoMode) {
      return [
        {
          name: 'llama3.2:latest',
          model: 'llama3.2:latest',
          modified_at: new Date().toISOString(),
          size: 2000000000,
          digest: 'sha256:preinstalled-llama3.2',
          details: { format: 'gguf', family: 'llama', families: ['llama'], parameter_size: '3.2B', quantization_level: 'Q4_K_M' },
          isVision: false,
          isPreinstalled: true,
        },
        {
          name: 'llama3.2-vision:latest',
          model: 'llama3.2-vision:latest',
          modified_at: new Date().toISOString(),
          size: 7900000000,
          digest: 'sha256:preinstalled-llama3.2-vision',
          details: { format: 'gguf', family: 'llama', families: ['llama'], parameter_size: '11B', quantization_level: 'Q4_K_M' },
          isVision: true,
          isPreinstalled: true,
        },
        {
          name: 'qwen2.5:0.5b',
          model: 'qwen2.5:0.5b',
          modified_at: new Date().toISOString(),
          size: 398000000,
          digest: 'sha256:preinstalled-qwen-0.5b',
          details: { format: 'gguf', family: 'qwen2', families: ['qwen2'], parameter_size: '0.5B', quantization_level: 'Q4_K_M' },
          isVision: false,
          isPreinstalled: true,
        },
        {
          name: 'moondream:1.8b',
          model: 'moondream:1.8b',
          modified_at: new Date().toISOString(),
          size: 820000000,
          digest: 'sha256:preinstalled-moondream',
          details: { format: 'gguf', family: 'moondream', families: ['moondream'], parameter_size: '1.8B', quantization_level: 'Q4_K_M' },
          isVision: true,
          isPreinstalled: true,
        },
      ];
    }
    throw error;
  }
}

export async function pullOllamaModel(
  modelName: string,
  settings: AppSettings,
  onProgress?: (status: string, completed?: number, total?: number) => void
): Promise<void> {
  const baseUrl = getBaseUrl(settings);
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (settings.useProxy && settings.ollamaUrl) {
    headers['x-ollama-host'] = settings.ollamaUrl;
  }

  const res = await fetch(`${baseUrl}/api/pull`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ name: modelName, stream: true }),
  });

  if (!res.ok) {
    throw new Error(`Failed to pull model (${res.status})`);
  }

  if (!res.body) return;

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      if (!line.trim()) continue;
      try {
        const json = JSON.parse(line);
        if (onProgress) {
          onProgress(json.status || '', json.completed, json.total);
        }
      } catch {
        // ignore parse error
      }
    }
  }
}

/**
 * Streams chat responses, optimized for AMD Ryzen 5 CPU execution
 */
export async function streamOllamaChat(
  model: string,
  messages: ChatMessage[],
  systemPrompt: string,
  settings: AppSettings,
  signal: AbortSignal,
  onChunk: (chunk: string, fullContent: string, thinking?: string) => void,
  onComplete?: (metrics?: any) => void
): Promise<void> {
  if (settings.demoMode) {
    await simulateStreamingResponse(model, messages, onChunk, onComplete, signal);
    return;
  }

  const baseUrl = getBaseUrl(settings);
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (settings.useProxy && settings.ollamaUrl) {
    headers['x-ollama-host'] = settings.ollamaUrl;
  }

  const formattedMessages: any[] = [];
  if (systemPrompt.trim()) {
    formattedMessages.push({ role: 'system', content: systemPrompt.trim() });
  }

  for (const msg of messages) {
    const m: any = { role: msg.role, content: msg.content };
    if (msg.images && msg.images.length > 0) {
      m.images = msg.images;
    }
    formattedMessages.push(m);
  }

  // CPU-optimized options for AMD Ryzen 5 7520U & 16GB RAM
  const payload = {
    model,
    messages: formattedMessages,
    stream: true,
    options: {
      temperature: settings.temperature,
      top_p: settings.topP,
      num_ctx: settings.contextLength,
      num_thread: settings.cpuThreads || 4, // Tuned for 4 Zen 2 cores
      low_vram: settings.lowVramMode ?? true, // Crucial for 486MB Radeon Graphics
    },
  };

  const res = await fetch(`${baseUrl}/api/chat`, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
    signal,
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Ollama Error (${res.status}): ${errText || res.statusText}`);
  }

  if (!res.body) throw new Error('Response body empty');

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let accumulated = '';
  let thinkingAccumulated = '';
  let inThinkingBlock = false;
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      if (!line.trim()) continue;
      try {
        const parsed = JSON.parse(line);
        if (parsed.message?.content) {
          const piece: string = parsed.message.content;

          if (piece.includes('<think>')) {
            inThinkingBlock = true;
          }
          if (piece.includes('</think>')) {
            inThinkingBlock = false;
          }

          if (inThinkingBlock) {
            thinkingAccumulated += piece.replace('<think>', '');
          } else {
            const cleanPiece = piece.replace('</think>', '');
            accumulated += cleanPiece;
          }

          onChunk(piece, accumulated, thinkingAccumulated || undefined);
        }

        if (parsed.done && onComplete) {
          const totalDuration = parsed.total_duration ? parsed.total_duration / 1e9 : undefined;
          const evalCount = parsed.eval_count;
          const evalDuration = parsed.eval_duration ? parsed.eval_duration / 1e9 : undefined;
          const tokensPerSecond = evalCount && evalDuration ? +(evalCount / evalDuration).toFixed(1) : undefined;

          onComplete({
            totalDuration,
            evalCount,
            evalDuration,
            tokensPerSecond,
          });
        }
      } catch {
        // partial chunk
      }
    }
  }
}

async function simulateStreamingResponse(
  model: string,
  messages: ChatMessage[],
  onChunk: (chunk: string, fullContent: string, thinking?: string) => void,
  onComplete?: (metrics?: any) => void,
  signal?: AbortSignal
): Promise<void> {
  const lastMsg = messages[messages.length - 1];
  const hasImage = lastMsg.images && lastMsg.images.length > 0;
  const isReasoning = model.includes('deepseek-r1');

  let fullReply = '';
  let thinkingText = '';

  if (isReasoning) {
    thinkingText = `Device: Mathisha | AMD Ryzen 5 7520U (4 Cores / 8 Threads) | 16 GB RAM\n1. Running CPU-optimized step-by-step deduction.\n2. Keeping memory footprint within 15.2 GB usable system RAM.\n3. Formulating response for user query: "${lastMsg.content.slice(0, 35)}..."`;
  }

  if (hasImage) {
    fullReply = `📸 **Vision Multimodal Detection (${model})**\n\nI have processed your uploaded image frame locally:\n\n- **Device Hardware:** AMD Ryzen 5 7520U (CPU execution with 16GB RAM)\n- **VRAM Utilization:** 0 MB external VRAM used (runs safely within 486MB iGPU limits)\n- **Internet Data Used:** **0 MB** (Using local model & system components)\n\n*Analysis:* Visual contents detected and parsed with local weights. You can also click the **Speaker** icon below to hear this response read aloud with Text-to-Speech!`;
  } else {
    fullReply = `Hello Mathisha! I am running locally on your **AMD Ryzen 5 7520U** with **${model}**.\n\nHere is your setup status:\n\n- ⚡ **Auto-Detected Models:** Active and using existing local weights (**0 MB internet**)\n- 🖼️ **Local Storage Image Generator:** Ready to load \`.safetensors\` from your disk (**0 MB internet**)\n- 🔊 **Text-to-Speech:** Click the speaker icon to listen to any response using Windows SAPI or Hugging Face small TTS (**under 1GB**)\n- 💻 **RAM Allocation:** 15.2 GB system memory utilized smoothly via CPU multithreading (4 threads)`;
  }

  const words = fullReply.split(' ');
  let current = '';

  for (let i = 0; i < words.length; i++) {
    if (signal?.aborted) return;
    const word = (i === 0 ? '' : ' ') + words[i];
    current += word;
    onChunk(word, current, thinkingText || undefined);
    await new Promise((r) => setTimeout(r, 20));
  }

  if (onComplete) {
    onComplete({
      totalDuration: 0.9,
      evalCount: words.length * 1.2,
      tokensPerSecond: 38.4,
    });
  }
}
