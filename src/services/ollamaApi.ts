import { OllamaModel, ChatMessage, AppSettings } from '../types';

export const POPULAR_MODELS = [
  { name: 'llama3.2:latest', desc: 'Meta Llama 3.2 3B - Ultra fast, low RAM, great general chat', vision: false, size: '2.0 GB' },
  { name: 'llama3.2-vision:latest', desc: 'Meta Llama 3.2 11B Vision - Powerful image understanding & chat', vision: true, size: '7.9 GB' },
  { name: 'deepseek-r1:8b', desc: 'DeepSeek R1 8B - Advanced step-by-step reasoning & math', vision: false, size: '4.9 GB' },
  { name: 'mistral:latest', desc: 'Mistral 7B - High quality coding, writing, and logic', vision: false, size: '4.1 GB' },
  { name: 'llava:latest', desc: 'LLaVA 7B - Fast multimodal vision and document analysis', vision: true, size: '4.7 GB' },
  { name: 'qwen2.5-coder:7b', desc: 'Qwen 2.5 Coder - Exceptional coding and debugging', vision: false, size: '4.7 GB' },
  { name: 'gemma2:9b', desc: 'Google Gemma 2 9B - Refined responses, safe and accurate', vision: false, size: '5.4 GB' },
];

export function isModelVision(modelName: string): boolean {
  const lower = modelName.toLowerCase();
  return (
    lower.includes('vision') ||
    lower.includes('llava') ||
    lower.includes('minicpm-v') ||
    lower.includes('moondream') ||
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
    }));

    return models;
  } catch (error) {
    console.warn('Failed to fetch real Ollama models:', error);
    if (settings.demoMode) {
      return [
        {
          name: 'llama3.2:latest',
          model: 'llama3.2:latest',
          modified_at: new Date().toISOString(),
          size: 2000000000,
          digest: 'sha256:demo-llama3.2',
          details: { format: 'gguf', family: 'llama', families: ['llama'], parameter_size: '3.2B', quantization_level: 'Q4_K_M' },
          isVision: false,
        },
        {
          name: 'llama3.2-vision:latest',
          model: 'llama3.2-vision:latest',
          modified_at: new Date().toISOString(),
          size: 7900000000,
          digest: 'sha256:demo-llama3.2-vision',
          details: { format: 'gguf', family: 'llama', families: ['llama'], parameter_size: '11B', quantization_level: 'Q4_K_M' },
          isVision: true,
        },
        {
          name: 'deepseek-r1:8b',
          model: 'deepseek-r1:8b',
          modified_at: new Date().toISOString(),
          size: 4900000000,
          digest: 'sha256:demo-deepseek-r1',
          details: { format: 'gguf', family: 'deepseek', families: ['deepseek'], parameter_size: '8B', quantization_level: 'Q4_K_M' },
          isVision: false,
        },
        {
          name: 'llava:latest',
          model: 'llava:latest',
          modified_at: new Date().toISOString(),
          size: 4700000000,
          digest: 'sha256:demo-llava',
          details: { format: 'gguf', family: 'llama', families: ['llama'], parameter_size: '7B', quantization_level: 'Q4_K_M' },
          isVision: true,
        }
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

export async function streamOllamaChat(
  model: string,
  messages: ChatMessage[],
  systemPrompt: string,
  settings: AppSettings,
  signal: AbortSignal,
  onChunk: (chunk: string, fullContent: string, thinking?: string) => void,
  onComplete?: (metrics?: any) => void
): Promise<void> {
  // Check if simulated demo mode is active
  if (settings.demoMode) {
    await simulateStreamingResponse(model, messages, onChunk, onComplete, signal);
    return;
  }

  const baseUrl = getBaseUrl(settings);
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (settings.useProxy && settings.ollamaUrl) {
    headers['x-ollama-host'] = settings.ollamaUrl;
  }

  // Format messages for Ollama API
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

  const payload = {
    model,
    messages: formattedMessages,
    stream: true,
    options: {
      temperature: settings.temperature,
      top_p: settings.topP,
      num_ctx: settings.contextLength,
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

          // Check for <think> reasoning tags (e.g. DeepSeek-R1)
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
        // partial chunk or keepalive
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
    thinkingText = `Analyzing user request: "${lastMsg.content.slice(0, 40)}..."\n1. Identifying intent and model capabilities.\n2. Formulating local response steps.\n3. Verified Windows batch runner environment.`;
  }

  if (hasImage) {
    fullReply = `📸 **Vision Model Analysis (${model})**\n\nI have received and analyzed your uploaded image (${lastMsg.images?.length} attachment):\n\n- **Subject:** Image visual features processed via local vision layers.\n- **Resolution & Composition:** High detail clarity.\n- **Context:** Ready for multimodal Q&A, transcription, OCR, or object detection.\n\n*Prompt:* "${lastMsg.content}"\n\n*Tip:* Run this on Windows using \`llama3.2-vision\` or \`llava\` for instant local GPU vision inference!`;
  } else {
    fullReply = `Hello! I am running locally via **${model}**.\n\nEverything is set up for high-speed local inference on Windows:\n\n- **Text Chat:** Low latency streaming with syntax highlighting\n- **Multimodal Vision:** Attach images with the clip icon or drag-and-drop\n- **Text-to-Image:** Switch tabs to generate local images with Stable Diffusion / ComfyUI\n- **Local Video:** Create videos with local SVD or Wan 2.1 via \`start_video_backend.bat\`\n\nTo connect to your live Ollama on Windows, click **run_ollama_studio.bat** in your project folder!`;
  }

  // Simulate token by token typing
  const words = fullReply.split(' ');
  let current = '';

  for (let i = 0; i < words.length; i++) {
    if (signal?.aborted) return;
    const word = (i === 0 ? '' : ' ') + words[i];
    current += word;
    onChunk(word, current, thinkingText || undefined);
    await new Promise((r) => setTimeout(r, 25));
  }

  if (onComplete) {
    onComplete({
      totalDuration: 1.2,
      evalCount: words.length * 1.3,
      tokensPerSecond: 42.5,
    });
  }
}
