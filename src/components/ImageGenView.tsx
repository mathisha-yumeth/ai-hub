import React, { useState } from 'react';
import {
  Image as ImageIcon,
  Sparkles,
  Download,
  Video,
  Wand2,
  RefreshCw,
  Sliders,
  Check,
  Copy,
  Layers,
  ArrowRight,
  Loader2,
} from 'lucide-react';
import { AppSettings, GeneratedImage } from '../types';
import { enhancePromptWithOllama, generateLocalImage } from '../services/imageApi';

interface ImageGenViewProps {
  settings: AppSettings;
  selectedModel: string;
  onSendToVideo: (imageUrl: string, prompt: string) => void;
  onOpenWindowsModal: () => void;
}

export const ImageGenView: React.FC<ImageGenViewProps> = ({
  settings,
  selectedModel,
  onSendToVideo,
  onOpenWindowsModal,
}) => {
  const [prompt, setPrompt] = useState('Cyberpunk street in the rain with glowing neon signs, reflective puddles, 8k resolution');
  const [negativePrompt, setNegativePrompt] = useState('blurry, deformed, bad anatomy, low quality');
  const [aspectRatio, setAspectRatio] = useState<'1:1' | '16:9' | '9:16' | '4:3'>('16:9');
  const [steps, setSteps] = useState(25);
  const [cfgScale, setCfgScale] = useState(7.0);
  const [seed, setSeed] = useState<number | ''>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [progressMsg, setProgressMsg] = useState('');
  const [gallery, setGallery] = useState<GeneratedImage[]>([]);
  const [selectedImage, setSelectedImage] = useState<GeneratedImage | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const getDimensions = () => {
    switch (aspectRatio) {
      case '16:9':
        return { width: 960, height: 540 };
      case '9:16':
        return { width: 540, height: 960 };
      case '4:3':
        return { width: 800, height: 600 };
      case '1:1':
      default:
        return { width: 768, height: 768 };
    }
  };

  const handleEnhance = async () => {
    if (!prompt.trim() || isEnhancing) return;
    setIsEnhancing(true);
    try {
      const enriched = await enhancePromptWithOllama(prompt, selectedModel, settings);
      setPrompt(enriched);
    } catch (err) {
      console.error(err);
    } finally {
      setIsEnhancing(false);
    }
  };

  const handleGenerate = async () => {
    if (!prompt.trim() || isGenerating) return;
    setIsGenerating(true);
    setProgressMsg('Preparing diffusion model...');

    const dims = getDimensions();
    const activeSeed = seed !== '' ? Number(seed) : Math.floor(Math.random() * 9999999);

    try {
      const result = await generateLocalImage(
        {
          prompt,
          negativePrompt,
          width: dims.width,
          height: dims.height,
          steps,
          cfgScale,
          seed: activeSeed,
        },
        settings,
        (msg) => setProgressMsg(msg)
      );

      setGallery((prev) => [result, ...prev]);
      setSelectedImage(result);
    } catch (err: any) {
      alert(`Generation failed: ${err.message}`);
    } finally {
      setIsGenerating(false);
      setProgressMsg('');
    }
  };

  const downloadImage = (img: GeneratedImage) => {
    const link = document.createElement('a');
    link.href = img.imageUrl;
    link.download = `local_render_${img.seed}.png`;
    link.click();
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Title & Local Engine Info */}
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <ImageIcon className="w-5 h-5 text-cyan-400" />
              Local Text-to-Image Studio
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Render local diffusion images. Compatible with local ComfyUI, Automatic1111, or built-in engine.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-mono px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-700 text-slate-300 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              Prompt Enhancer: {selectedModel}
            </span>
          </div>
        </div>

        {/* Studio Grid: Controls on left, Preview on right */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Controls Column */}
          <div className="lg:col-span-5 space-y-4">
            {/* Prompt Card */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-white uppercase tracking-wider">
                  Text Prompt
                </label>
                <button
                  onClick={handleEnhance}
                  disabled={isEnhancing || !prompt.trim()}
                  className="text-xs text-cyan-400 hover:text-cyan-300 disabled:opacity-50 flex items-center gap-1 font-medium transition"
                  title="Use local Ollama to write a rich photorealistic prompt"
                >
                  {isEnhancing ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Sparkles className="w-3.5 h-3.5" />
                  )}
                  <span>Enhance with Ollama</span>
                </button>
              </div>

              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                rows={4}
                className="w-full bg-slate-950 text-xs text-slate-200 border border-slate-800 rounded-xl p-3 focus:outline-none focus:border-cyan-500 leading-relaxed resize-none font-sans"
                placeholder="Describe what you want to create in detail..."
              />

              <div>
                <label className="text-xs font-medium text-slate-400 block mb-1">
                  Negative Prompt
                </label>
                <input
                  type="text"
                  value={negativePrompt}
                  onChange={(e) => setNegativePrompt(e.target.value)}
                  className="w-full bg-slate-950 text-xs text-slate-300 border border-slate-800 rounded-xl px-3 py-2 focus:outline-none focus:border-cyan-500 font-sans"
                  placeholder="What to avoid (e.g. blurry, deformed)"
                />
              </div>
            </div>

            {/* Parameters Card */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-4">
              <h3 className="text-xs font-semibold text-white uppercase tracking-wider flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-cyan-400" />
                Parameters
              </h3>

              {/* Aspect Ratio */}
              <div>
                <span className="text-xs font-medium text-slate-300 block mb-2">Aspect Ratio</span>
                <div className="grid grid-cols-4 gap-2">
                  {(['1:1', '16:9', '9:16', '4:3'] as const).map((ratio) => (
                    <button
                      key={ratio}
                      type="button"
                      onClick={() => setAspectRatio(ratio)}
                      className={`py-2 text-xs rounded-xl font-mono border transition ${
                        aspectRatio === ratio
                          ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      {ratio}
                    </button>
                  ))}
                </div>
              </div>

              {/* Steps & CFG */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-400">Steps</span>
                    <span className="font-mono text-cyan-400">{steps}</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="50"
                    value={steps}
                    onChange={(e) => setSteps(parseInt(e.target.value))}
                    className="w-full accent-cyan-500 cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-400">CFG Scale</span>
                    <span className="font-mono text-cyan-400">{cfgScale}</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="15"
                    step="0.5"
                    value={cfgScale}
                    onChange={(e) => setCfgScale(parseFloat(e.target.value))}
                    className="w-full accent-cyan-500 cursor-pointer"
                  />
                </div>
              </div>

              {/* Seed */}
              <div>
                <label className="text-xs font-medium text-slate-400 block mb-1">
                  Seed (Optional)
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={seed}
                    onChange={(e) => setSeed(e.target.value === '' ? '' : parseInt(e.target.value))}
                    placeholder="Random seed (-1)"
                    className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-cyan-500"
                  />
                  <button
                    onClick={() => setSeed(Math.floor(Math.random() * 9999999))}
                    className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition"
                    title="Generate random seed"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Generate Button */}
              <button
                disabled={isGenerating || !prompt.trim()}
                onClick={handleGenerate}
                className="w-full py-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 disabled:opacity-40 text-white font-semibold text-xs rounded-xl shadow-lg shadow-cyan-600/20 flex items-center justify-center gap-2 transition"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>{progressMsg || 'Rendering image...'}</span>
                  </>
                ) : (
                  <>
                    <Wand2 className="w-4 h-4" />
                    <span>Generate Local Image</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Preview & Active Image Column */}
          <div className="lg:col-span-7 space-y-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 min-h-[420px] flex flex-col justify-between">
              {selectedImage ? (
                <div className="space-y-3">
                  <div className="relative rounded-xl overflow-hidden bg-black/40 border border-slate-800 flex items-center justify-center">
                    <img
                      src={selectedImage.imageUrl}
                      alt={selectedImage.prompt}
                      className="w-full h-auto max-h-[460px] object-contain rounded-xl"
                    />
                  </div>

                  <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                    <p className="text-xs text-slate-200 leading-relaxed font-sans">
                      "{selectedImage.prompt}"
                    </p>
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800/80">
                      <span className="text-[11px] font-mono text-slate-500">
                        {selectedImage.width}x{selectedImage.height} • Seed: {selectedImage.seed}
                      </span>

                      <div className="flex items-center gap-2">
                        {/* Send to Video Generator Button */}
                        <button
                          onClick={() => onSendToVideo(selectedImage.imageUrl, selectedImage.prompt)}
                          className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-medium rounded-lg flex items-center gap-1.5 shadow-sm transition"
                          title="Send this frame to Local Video Studio to animate"
                        >
                          <Video className="w-3.5 h-3.5" />
                          <span>Animate in Video Studio</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>

                        <button
                          onClick={() => downloadImage(selectedImage)}
                          className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition"
                          title="Download PNG"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center py-16 text-center text-slate-500 space-y-3">
                  <div className="w-14 h-14 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400">
                    <ImageIcon className="w-7 h-7" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-300">No Image Rendered Yet</p>
                    <p className="text-xs text-slate-500 max-w-sm mt-1">
                      Type your prompt or click 'Enhance with Ollama' and click Generate to produce high-res local diffusion art.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Gallery Strip */}
            {gallery.length > 0 && (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-2.5">
                <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-cyan-400" />
                  Recent Creations ({gallery.length})
                </h4>
                <div className="flex gap-3 overflow-x-auto pb-2">
                  {gallery.map((img) => (
                    <div
                      key={img.id}
                      onClick={() => setSelectedImage(img)}
                      className={`relative shrink-0 w-24 h-24 rounded-xl overflow-hidden border cursor-pointer transition ${
                        selectedImage?.id === img.id
                          ? 'border-cyan-400 ring-2 ring-cyan-500/40'
                          : 'border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <img
                        src={img.imageUrl}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
