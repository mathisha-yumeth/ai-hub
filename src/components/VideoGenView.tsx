import React, { useState } from 'react';
import {
  Video,
  Play,
  Pause,
  Download,
  Upload,
  Sparkles,
  Sliders,
  Terminal,
  RefreshCw,
  Layers,
  CheckCircle,
  AlertCircle,
  Loader2,
  Film,
} from 'lucide-react';
import { AppSettings, GeneratedVideo, EndpointStatus } from '../types';
import { generateLocalVideo } from '../services/videoApi';

interface VideoGenViewProps {
  settings: AppSettings;
  endpointStatus: EndpointStatus;
  initialImageUrl?: string;
  initialPrompt?: string;
  onOpenWindowsModal: () => void;
}

export const VideoGenView: React.FC<VideoGenViewProps> = ({
  settings,
  endpointStatus,
  initialImageUrl,
  initialPrompt,
  onOpenWindowsModal,
}) => {
  const [prompt, setPrompt] = useState(
    initialPrompt || 'Cinematic slow motion camera panning over futuristic cybernetic landscape'
  );
  const [sourceImage, setSourceImage] = useState<string | null>(initialImageUrl || null);
  const [fps, setFps] = useState(7);
  const [frames, setFrames] = useState(14);
  const [motionBucket, setMotionBucket] = useState(127);
  const [seed, setSeed] = useState<number | ''>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [progressMsg, setProgressMsg] = useState('');
  const [currentVideo, setCurrentVideo] = useState<GeneratedVideo | null>(null);
  const [videoGallery, setVideoGallery] = useState<GeneratedVideo[]>([]);
  const [isPlaying, setIsPlaying] = useState(true);

  // File upload for source image (Image-to-Video)
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setSourceImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleGenerate = async () => {
    if (isGenerating) return;
    setIsGenerating(true);
    setProgressMsg('Initializing video synthesis pipeline...');

    const activeSeed = seed !== '' ? Number(seed) : Math.floor(Math.random() * 9999999);

    try {
      const vid = await generateLocalVideo(
        {
          prompt: prompt.trim() || 'Cinematic camera pan',
          sourceImageBase64: sourceImage || undefined,
          fps,
          frames,
          motionBucket,
          seed: activeSeed,
        },
        settings,
        (msg) => setProgressMsg(msg)
      );

      setCurrentVideo(vid);
      setVideoGallery((prev) => [vid, ...prev]);
    } catch (err: any) {
      alert(`Video generation error: ${err.message}`);
    } finally {
      setIsGenerating(false);
      setProgressMsg('');
    }
  };

  const downloadVideo = (vid: GeneratedVideo) => {
    const a = document.createElement('a');
    a.href = vid.videoUrl;
    a.download = `local_video_${vid.id}.webm`;
    a.click();
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header Title */}
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Video className="w-5 h-5 text-purple-400" />
              Local Video Studio (Fully Locally)
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Generate AI videos directly on your PC using Stable Video Diffusion (SVD), Wan 2.1, or local neural synthesizers.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`text-xs font-mono px-2.5 py-1 rounded-lg border flex items-center gap-1.5 ${
                endpointStatus.video.online
                  ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300'
                  : 'bg-purple-950/40 border-purple-800/40 text-purple-300'
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  endpointStatus.video.online ? 'bg-emerald-400' : 'bg-purple-400 animate-pulse'
                }`}
              />
              {endpointStatus.video.online
                ? 'Local SVD Service: Online (Port 8000)'
                : 'Local SVD Engine: Ready (start_video_backend.bat)'}
            </span>
          </div>
        </div>

        {/* Windows Video Backend Guide Alert */}
        <div className="p-3.5 bg-slate-900 border border-purple-500/30 rounded-2xl flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5 text-purple-200">
            <Terminal className="w-4 h-4 text-purple-400 shrink-0" />
            <span>
              To run full Stable Video Diffusion XT / Wan on your local GPU, run{' '}
              <code className="text-purple-300 bg-purple-950/80 px-1.5 py-0.5 rounded font-mono">
                start_video_backend.bat
              </code>{' '}
              on your Windows PC.
            </span>
          </div>
          <div className="flex items-center gap-2">
            <a
              href="/api/download-video-launcher"
              download="start_video_backend.bat"
              className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white font-medium rounded-lg transition shrink-0"
            >
              Download Video .bat
            </a>
            <button
              onClick={onOpenWindowsModal}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition shrink-0"
            >
              Setup Guide
            </button>
          </div>
        </div>

        {/* Studio Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Controls Column */}
          <div className="lg:col-span-5 space-y-4">
            {/* Prompt & Mode */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
              <label className="text-xs font-semibold text-white uppercase tracking-wider block">
                Video Motion Prompt
              </label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                rows={3}
                className="w-full bg-slate-950 text-xs text-slate-200 border border-slate-800 rounded-xl p-3 focus:outline-none focus:border-purple-500 leading-relaxed resize-none font-sans"
                placeholder="e.g. Slow motion cinematic zoom, atmospheric lighting, rotating camera..."
              />

              {/* Image-to-Video Source Upload */}
              <div className="pt-2 border-t border-slate-800/80">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-slate-300">
                    Source Initial Frame (Image-to-Video)
                  </span>
                  {sourceImage && (
                    <button
                      onClick={() => setSourceImage(null)}
                      className="text-[11px] text-rose-400 hover:underline"
                    >
                      Remove
                    </button>
                  )}
                </div>

                {sourceImage ? (
                  <div className="relative rounded-xl overflow-hidden border border-purple-500/40 bg-black/40 max-h-36">
                    <img
                      src={sourceImage}
                      alt="Source Frame"
                      className="w-full h-36 object-cover"
                    />
                    <div className="absolute bottom-2 left-2 bg-slate-900/80 backdrop-blur px-2 py-0.5 rounded text-[10px] text-purple-300 font-mono">
                      First Frame Loaded
                    </div>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center p-4 border border-dashed border-slate-700 hover:border-purple-500 rounded-xl cursor-pointer bg-slate-950/60 hover:bg-slate-950 transition text-center">
                    <Upload className="w-5 h-5 text-slate-400 mb-1" />
                    <span className="text-xs text-slate-300 font-medium">
                      Upload base image to animate
                    </span>
                    <span className="text-[10px] text-slate-500 mt-0.5">
                      or send an image directly from Text-to-Image tab
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
            </div>

            {/* Video Parameters */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-4">
              <h3 className="text-xs font-semibold text-white uppercase tracking-wider flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-purple-400" />
                Video Dynamics
              </h3>

              {/* Motion Bucket ID */}
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-300">Motion Intensity (Bucket ID)</span>
                  <span className="font-mono text-purple-400">{motionBucket}</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="255"
                  value={motionBucket}
                  onChange={(e) => setMotionBucket(parseInt(e.target.value))}
                  className="w-full accent-purple-500 cursor-pointer"
                />
                <span className="text-[10px] text-slate-500">
                  Lower = subtle camera shift, Higher = vigorous dynamic action
                </span>
              </div>

              {/* FPS & Frames Count */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-400 block mb-1">FPS (Framerate)</label>
                  <select
                    value={fps}
                    onChange={(e) => setFps(parseInt(e.target.value))}
                    className="w-full bg-slate-950 text-xs font-mono text-white border border-slate-800 rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-purple-500"
                  >
                    <option value={7}>7 FPS (SVD Default)</option>
                    <option value={8}>8 FPS (Standard)</option>
                    <option value={14}>14 FPS (Smooth)</option>
                    <option value={24}>24 FPS (Cinematic)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-400 block mb-1">Frames Length</label>
                  <select
                    value={frames}
                    onChange={(e) => setFrames(parseInt(e.target.value))}
                    className="w-full bg-slate-950 text-xs font-mono text-white border border-slate-800 rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-purple-500"
                  >
                    <option value={14}>14 Frames (~2 sec)</option>
                    <option value={25}>25 Frames (~3.5 sec)</option>
                    <option value={48}>48 Frames (~6 sec)</option>
                  </select>
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
                    className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-purple-500"
                  />
                  <button
                    onClick={() => setSeed(Math.floor(Math.random() * 9999999))}
                    className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition"
                    title="Random seed"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Generate Button */}
              <button
                disabled={isGenerating}
                onClick={handleGenerate}
                className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-40 text-white font-semibold text-xs rounded-xl shadow-lg shadow-purple-600/20 flex items-center justify-center gap-2 transition"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>{progressMsg || 'Rendering video frames...'}</span>
                  </>
                ) : (
                  <>
                    <Film className="w-4 h-4" />
                    <span>Generate Local Video</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Video Player Column */}
          <div className="lg:col-span-7 space-y-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 min-h-[420px] flex flex-col justify-between">
              {currentVideo ? (
                <div className="space-y-3">
                  <div className="relative rounded-xl overflow-hidden bg-black border border-slate-800 aspect-video flex items-center justify-center">
                    <video
                      src={currentVideo.videoUrl}
                      controls
                      autoPlay
                      loop
                      className="w-full h-full object-contain rounded-xl"
                    />
                  </div>

                  <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                    <p className="text-xs text-slate-200 leading-relaxed font-sans">
                      "{currentVideo.prompt}"
                    </p>

                    <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800/80">
                      <span className="text-[11px] font-mono text-slate-500">
                        {currentVideo.frames} Frames • {currentVideo.fps} FPS • Motion: {currentVideo.motionBucket}
                      </span>

                      <button
                        onClick={() => downloadVideo(currentVideo)}
                        className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-medium rounded-lg flex items-center gap-1.5 shadow-sm transition"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download Video</span>
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center py-16 text-center text-slate-500 space-y-3">
                  <div className="w-14 h-14 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400">
                    <Video className="w-7 h-7" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-300">No Video Rendered Yet</p>
                    <p className="text-xs text-slate-500 max-w-sm mt-1">
                      Upload an initial frame or enter a motion prompt and click 'Generate Local Video' to synthesize video clips.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Gallery Strip */}
            {videoGallery.length > 0 && (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-2.5">
                <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-purple-400" />
                  Generated Video Clips ({videoGallery.length})
                </h4>
                <div className="flex gap-3 overflow-x-auto pb-2">
                  {videoGallery.map((vid) => (
                    <div
                      key={vid.id}
                      onClick={() => setCurrentVideo(vid)}
                      className={`relative shrink-0 w-36 aspect-video rounded-xl overflow-hidden border cursor-pointer transition ${
                        currentVideo?.id === vid.id
                          ? 'border-purple-400 ring-2 ring-purple-500/40'
                          : 'border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <video
                        src={vid.videoUrl}
                        className="w-full h-full object-cover"
                        muted
                      />
                      <div className="absolute bottom-1 right-1 bg-black/70 px-1 rounded text-[9px] font-mono text-white">
                        {vid.frames}f
                      </div>
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
