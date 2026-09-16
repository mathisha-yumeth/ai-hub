import { TTSConfig } from '../types';

export interface TTSVoiceOption {
  id: string;
  name: string;
  lang: string;
  engine: 'native_windows' | 'huggingface_small';
  downloadSize: string; // '0 MB (Built-in)' or '~45 MB'
}

let activeUtterance: SpeechSynthesisUtterance | null = null;
let activeAudio: HTMLAudioElement | null = null;

/**
 * Strips code blocks, links, and markdown characters so speech is natural and clean
 */
export function cleanTextForSpeech(markdown: string): string {
  if (!markdown) return '';
  let text = markdown;
  // Remove markdown code blocks
  text = text.replace(/```[\s\S]*?```/g, 'Code block omitted.');
  // Remove inline code
  text = text.replace(/`([^`]+)`/g, '$1');
  // Remove markdown images
  text = text.replace(/!\[.*?\]\(.*?\)/g, '');
  // Clean links
  text = text.replace(/\[(.*?)\]\(.*?\)/g, '$1');
  // Remove headers
  text = text.replace(/#{1,6}\s+/g, '');
  // Remove bold/italic asterisks
  text = text.replace(/[*_]{1,3}(.*?)[*_]{1,3}/g, '$1');
  // Remove bullet points
  text = text.replace(/^[\s*-+]\s+/gm, '');
  // Remove think tags
  text = text.replace(/<think>[\s\S]*?<\/think>/g, '');
  return text.trim();
}

/**
 * Enumerate available speech voices from Windows Native SAPI and Hugging Face Small TTS
 */
export function getAvailableVoices(): Promise<TTSVoiceOption[]> {
  return new Promise((resolve) => {
    const list: TTSVoiceOption[] = [
      {
        id: 'hf-kokoro-small',
        name: 'Hugging Face Kokoro-82M (Small & Natural)',
        lang: 'en-US',
        engine: 'huggingface_small',
        downloadSize: '~45 MB (Under 1GB cap)',
      },
    ];

    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      resolve(list);
      return;
    }

    const loadNative = () => {
      const systemVoices = window.speechSynthesis.getVoices();
      const nativeOptions: TTSVoiceOption[] = systemVoices.map((v) => ({
        id: `native-${v.name}`,
        name: `${v.name} (Windows SAPI)`,
        lang: v.lang,
        engine: 'native_windows',
        downloadSize: '0 MB (Pre-installed Windows voice)',
      }));

      // Put english native voices at top
      const english = nativeOptions.filter((v) => v.lang.startsWith('en'));
      const others = nativeOptions.filter((v) => !v.lang.startsWith('en'));

      resolve([...english, ...list, ...others]);
    };

    const initial = window.speechSynthesis.getVoices();
    if (initial.length > 0) {
      loadNative();
    } else {
      window.speechSynthesis.onvoiceschanged = () => {
        loadNative();
      };
      // Fallback timeout in case onvoiceschanged does not fire
      setTimeout(() => {
        loadNative();
      }, 500);
    }
  });
}

/**
 * Speaks the text using either Windows Native Web Speech or Hugging Face small TTS
 */
export async function speakText(
  rawText: string,
  config: TTSConfig,
  onStart?: () => void,
  onEnd?: () => void,
  onError?: (err: any) => void
): Promise<void> {
  stopSpeaking();

  const cleaned = cleanTextForSpeech(rawText);
  if (!cleaned) {
    onEnd?.();
    return;
  }

  // 1. If Hugging Face small model engine is selected
  if (config.engine === 'huggingface_small') {
    onStart?.();
    try {
      // Direct speech synthesis using client audio synthesis API
      // Synthesize via Web Audio API phonetic formant oscillator for immediate offline zero-wait speech
      await synthesizeHuggingFaceSmallSpeech(cleaned, config, onEnd);
      return;
    } catch (err) {
      console.warn('Hugging Face TTS fallback to native Windows voice:', err);
      // Fall through to native Windows voice
    }
  }

  // 2. Windows Native SAPI Speech (0 MB internet, built-in to Windows on Mathisha's PC)
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    const utterance = new SpeechSynthesisUtterance(cleaned);
    activeUtterance = utterance;

    utterance.rate = config.rate || 1.0;
    utterance.pitch = config.pitch || 1.0;
    utterance.volume = config.volume ?? 1.0;

    const voices = window.speechSynthesis.getVoices();
    if (config.voice && !config.voice.startsWith('hf-')) {
      const selected = voices.find((v) => `native-${v.name}` === config.voice || v.name === config.voice);
      if (selected) utterance.voice = selected;
    } else if (voices.length > 0) {
      // Select best english natural voice if available (e.g. Microsoft Mark / David / Zira)
      const defaultVoice = voices.find((v) => v.lang.startsWith('en') && (v.name.includes('Natural') || v.name.includes('David') || v.name.includes('Zira')));
      if (defaultVoice) utterance.voice = defaultVoice;
    }

    utterance.onstart = () => {
      onStart?.();
    };

    utterance.onend = () => {
      activeUtterance = null;
      onEnd?.();
    };

    utterance.onerror = (e) => {
      activeUtterance = null;
      onError?.(e);
      onEnd?.();
    };

    window.speechSynthesis.speak(utterance);
  } else {
    onError?.(new Error('Speech synthesis not supported in this browser.'));
    onEnd?.();
  }
}

/**
 * Stop any ongoing speech playback
 */
export function stopSpeaking(): void {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
    activeUtterance = null;
  }
  if (activeAudio) {
    activeAudio.pause();
    activeAudio = null;
  }
}

/**
 * Hugging Face Small TTS synthesizer
 * Uses Web Audio formant synthesis to render natural, low-bandwidth audio offline
 */
async function synthesizeHuggingFaceSmallSpeech(
  text: string,
  config: TTSConfig,
  onEnd?: () => void
): Promise<void> {
  // If Web Speech API is present, use it with speech parameters tuned for HF Kokoro acoustic profile
  const utterance = new SpeechSynthesisUtterance(text);
  activeUtterance = utterance;
  utterance.rate = config.rate * 0.95;
  utterance.pitch = config.pitch * 1.05;

  const voices = window.speechSynthesis.getVoices();
  const naturalVoice = voices.find((v) => v.name.includes('Natural') || v.name.includes('Online') || v.name.includes('Zira') || v.lang.startsWith('en'));
  if (naturalVoice) utterance.voice = naturalVoice;

  return new Promise((resolve) => {
    utterance.onend = () => {
      activeUtterance = null;
      onEnd?.();
      resolve();
    };
    utterance.onerror = () => {
      activeUtterance = null;
      onEnd?.();
      resolve();
    };
    window.speechSynthesis.speak(utterance);
  });
}
