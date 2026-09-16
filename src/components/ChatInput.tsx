import React, { useRef, useEffect, useState } from 'react';
import {
  Send,
  Square,
  Paperclip,
  Image as ImageIcon,
  X,
  Eye,
  AlertTriangle,
  Sparkles,
} from 'lucide-react';
import { ChatAttachment } from '../types';

interface ChatInputProps {
  onSendMessage: (text: string, attachments: ChatAttachment[]) => void;
  isStreaming: boolean;
  onAbort: () => void;
  isModelVision: boolean;
  onSwitchToVisionModel: () => void;
  selectedModel: string;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  onSendMessage,
  isStreaming,
  onAbort,
  isModelVision,
  onSwitchToVisionModel,
  selectedModel,
}) => {
  const [text, setText] = useState('');
  const [attachments, setAttachments] = useState<ChatAttachment[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 180)}px`;
    }
  }, [text]);

  // Handle image files to Base64
  const processFiles = (files: FileList | File[]) => {
    const validImageFiles = Array.from(files).filter((file) =>
      file.type.startsWith('image/')
    );

    validImageFiles.forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result as string;
        setAttachments((prev) => [
          ...prev,
          {
            id: `att-${Date.now()}-${Math.random()}`,
            base64,
            name: file.name,
            mimeType: file.type,
          },
        ]);
      };
      reader.readAsDataURL(file);
    });
  };

  // Clipboard Paste (e.g. Screenshot Ctrl+V)
  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const items = e.clipboardData.items;
    const files: File[] = [];
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.startsWith('image/')) {
        const file = items[i].getAsFile();
        if (file) files.push(file);
      }
    }
    if (files.length > 0) {
      processFiles(files);
    }
  };

  // Drag & Drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  };

  const handleSend = () => {
    if ((!text.trim() && attachments.length === 0) || isStreaming) return;
    onSendMessage(text.trim(), attachments);
    setText('');
    setAttachments([]);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const removeAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`border-t border-slate-800 bg-slate-900/90 backdrop-blur p-3 transition-colors ${
        isDragging ? 'bg-cyan-950/40 border-cyan-500' : ''
      }`}
    >
      <div className="max-w-4xl mx-auto space-y-2">
        {/* Vision warning if user attached images to non-vision model */}
        {attachments.length > 0 && !isModelVision && (
          <div className="flex items-center justify-between p-2.5 bg-amber-950/40 border border-amber-600/40 rounded-xl text-xs text-amber-300 animate-fade-in">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
              <span>
                Current model <strong className="font-mono text-white">{selectedModel}</strong> might not support images.
              </span>
            </div>
            <button
              onClick={onSwitchToVisionModel}
              className="px-2.5 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold rounded-lg text-[11px] flex items-center gap-1 transition shrink-0"
            >
              <Eye className="w-3 h-3" />
              Switch to Vision Model
            </button>
          </div>
        )}

        {/* Attachment chips */}
        {attachments.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-1">
            {attachments.map((att) => (
              <div
                key={att.id}
                className="group relative flex items-center gap-2 bg-slate-800 border border-slate-700 rounded-xl p-1.5 pr-2.5 shadow-sm"
              >
                <img
                  src={att.base64}
                  alt={att.name}
                  className="w-10 h-10 object-cover rounded-lg border border-slate-700 shrink-0"
                />
                <div className="min-w-0 max-w-[120px]">
                  <p className="text-xs text-slate-200 truncate font-mono">{att.name}</p>
                  <p className="text-[10px] text-cyan-400 font-mono">Image attached</p>
                </div>
                <button
                  onClick={() => removeAttachment(att.id)}
                  className="p-1 rounded-full bg-slate-700 hover:bg-rose-600 text-slate-300 hover:text-white transition"
                  title="Remove image"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Main Input Container */}
        <div className="flex items-end gap-2 bg-slate-950 border border-slate-700/90 rounded-2xl p-2 focus-within:border-cyan-500 transition-colors shadow-inner">
          {/* File Picker Button */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={(e) => e.target.files && processFiles(e.target.files)}
            accept="image/*"
            multiple
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="p-2 text-slate-400 hover:text-cyan-400 hover:bg-slate-800 rounded-xl transition shrink-0"
            title="Attach image (or paste Ctrl+V / drag & drop)"
          >
            <ImageIcon className="w-5 h-5" />
          </button>

          {/* Text Area */}
          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            placeholder={
              attachments.length > 0
                ? 'Ask anything about the attached image(s)... (Press Enter to send)'
                : 'Message your local Ollama model... (Paste or drag images, Shift+Enter for newline)'
            }
            rows={1}
            className="flex-1 bg-transparent text-slate-100 placeholder-slate-500 text-sm focus:outline-none resize-none py-1.5 px-1 max-h-44 leading-relaxed font-sans"
          />

          {/* Send or Stop Button */}
          {isStreaming ? (
            <button
              onClick={onAbort}
              className="p-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl shadow transition shrink-0 flex items-center gap-1.5 text-xs font-semibold"
              title="Stop response generation"
            >
              <Square className="w-4 h-4 fill-white" />
              <span>Stop</span>
            </button>
          ) : (
            <button
              disabled={!text.trim() && attachments.length === 0}
              onClick={handleSend}
              className="p-2.5 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-30 disabled:hover:bg-cyan-600 text-white rounded-xl shadow-lg shadow-cyan-600/20 transition shrink-0"
              title="Send message (Enter)"
            >
              <Send className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Input Helper hints */}
        <div className="flex items-center justify-between text-[11px] text-slate-500 px-1">
          <span className="flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-cyan-400" />
            Runs 100% locally on your PC via Ollama
          </span>
          <span>Shift+Enter for newline • Drag & drop images</span>
        </div>
      </div>
    </div>
  );
};
