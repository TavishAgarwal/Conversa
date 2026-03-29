import { ExtensionPoint } from '@runanywhere/web';

// Shared global AudioContext ensures stable playback across components
let audioCtx: AudioContext | null = null;

export interface NativeAudioPlayer {
  stop: () => void;
  /** Resolves when the audio finishes playing naturally */
  waitForEnd: () => Promise<void>;
  durationMs: number;
}

export async function synthesizeAudio(text: string, onStart?: () => void): Promise<NativeAudioPlayer> {
  const tts: any = ExtensionPoint.requireProvider('tts', '@runanywhere/web-onnx');
  
  if (onStart) onStart();

  try {
    const ttsResult = await tts.synthesize(text, { speed: 1.0 });
    
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') {
      await audioCtx.resume();
    }

    const buffer = audioCtx.createBuffer(1, ttsResult.audioData.length, ttsResult.sampleRate);
    buffer.copyToChannel(ttsResult.audioData, 0);

    const source = audioCtx.createBufferSource();
    source.buffer = buffer;
    source.connect(audioCtx.destination);

    let endResolve: (() => void) | null = null;
    const endPromise = new Promise<void>((resolve) => {
      endResolve = resolve;
    });

    const stopPlayback = () => {
      try {
        source.stop();
        source.disconnect();
      } catch (e) { }
      if (endResolve) endResolve();
    };

    source.onended = () => {
      source.disconnect();
      if (endResolve) endResolve();
    };

    source.start(0);

    const durationMs = (ttsResult.audioData.length / ttsResult.sampleRate) * 1000;
    setTimeout(() => {
      if (endResolve) endResolve();
    }, durationMs + 2000);

    return { stop: stopPlayback, waitForEnd: () => endPromise, durationMs };
  } catch (err) {
    console.warn("TTS fallback engaged due to synthesis error:", err);
    // Provide a dummy player so the text rendering pipeline continues seamlessly
    const estimatedDurationMs = text.length * 60; // ~60ms per character spoken
    let cancelled = false;
    let endResolve: (() => void) | null = null;
    const endPromise = new Promise<void>((resolve) => { endResolve = resolve; });
    
    setTimeout(() => {
        if (endResolve && !cancelled) endResolve();
    }, estimatedDurationMs);

    return {
      stop: () => { cancelled = true; if (endResolve) endResolve(); },
      waitForEnd: () => endPromise,
      durationMs: estimatedDurationMs
    };
  }
}
