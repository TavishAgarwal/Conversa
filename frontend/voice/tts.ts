import { ExtensionPoint } from '@runanywhere/web';

// Shared global AudioContext ensures stable playback across components
let audioCtx: AudioContext | null = null;

export interface NativeAudioPlayer {
  stop: () => void;
  /** Resolves when the audio finishes playing naturally */
  waitForEnd: () => Promise<void>;
}

export async function synthesizeAudio(text: string, onStart?: () => void): Promise<NativeAudioPlayer> {
  const tts: any = ExtensionPoint.requireProvider('tts', '@runanywhere/web-onnx');
  
  if (onStart) onStart();
  const ttsResult = await tts.synthesize(text, { speed: 1.0 });
  
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') {
    await audioCtx.resume();
  }

  // Create native AudioBuffer from the raw Float32Array
  const buffer = audioCtx.createBuffer(1, ttsResult.audioData.length, ttsResult.sampleRate);
  buffer.copyToChannel(ttsResult.audioData, 0);

  const source = audioCtx.createBufferSource();
  source.buffer = buffer;
  source.connect(audioCtx.destination);

  // Create a promise that resolves when audio finishes playing
  let endResolve: (() => void) | null = null;
  const endPromise = new Promise<void>((resolve) => {
    endResolve = resolve;
  });

  const stopPlayback = () => {
    try {
      source.stop();
      source.disconnect();
    } catch (e) {
      // Ignore if already stopped
    }
    // Also resolve the end promise so pipeline doesn't hang
    if (endResolve) endResolve();
  };

  source.onended = () => {
    source.disconnect();
    if (endResolve) endResolve();
  };

  source.start(0);

  // Fallback timeout based on audio duration to prevent infinite hang
  const durationMs = (ttsResult.audioData.length / ttsResult.sampleRate) * 1000;
  setTimeout(() => {
    if (endResolve) endResolve();
  }, durationMs + 2000); // 2s grace period

  return { stop: stopPlayback, waitForEnd: () => endPromise };
}
