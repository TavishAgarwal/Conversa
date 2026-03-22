/**
 * API service layer for voice assistant functionality.
 * Wraps RunAnywhere SDK for STT, LLM, TTS, and VAD.
 * 
 * IMPORTANT: This module MUST only run in the browser (client-side).
 */

'use client';

import { initSDK, ModelManager, ModelCategory } from './runanywhere';
import { 
  AudioCapture, 
  AudioPlayback, 
  SpeechActivity,
  ExtensionPoint
} from '@runanywhere/web';
import { VAD } from '@runanywhere/web-onnx';
import { GENERATION_CONFIG, guardrails, detectIntent } from './ai-config';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export interface VoiceProcessingCallbacks {
  onTranscriptionStart?: () => void;
  onTranscription?: (text: string) => void;
  onGenerationStart?: () => void;
  onGenerationToken?: (token: string) => void;
  onGenerationComplete?: (text: string) => void;
  onSynthesisStart?: () => void;
  onSynthesisComplete?: () => void;
  onError?: (error: Error) => void;
  onStateChange?: (state: 'processingSTT' | 'generatingResponse' | 'playingTTS' | 'idle') => void;
}

// ---------------------------------------------------------------------------
// Initialization
// ---------------------------------------------------------------------------

let isInitialized = false;

/** Initialize the AI service. Must be called before using any other functions. */
export async function initializeAI(): Promise<void> {
  if (isInitialized) return;
  
  await initSDK();
  isInitialized = true;
}

// ---------------------------------------------------------------------------
// Model Management
// ---------------------------------------------------------------------------

/** Load required models for voice assistant */
export async function loadVoiceModels(
  onProgress?: (modelId: string, progress: number) => void
): Promise<void> {
  const models = [
    'lfm2-350m-q4_k_m',              // LLM
    'sherpa-onnx-whisper-tiny.en',   // STT
    'vits-piper-en_US-lessac-medium', // TTS
    'silero-vad-v5',                 // VAD
  ];

  // Track progress globally
  let unsubscribe: (() => void) | undefined;
  if (onProgress) {
    unsubscribe = ModelManager.onChange((allModels) => {
      for (const m of allModels) {
        if (models.includes(m.id) && m.downloadProgress !== undefined) {
          // SDK provides progress as 0-1, UI expects 0-100
          onProgress(m.id, m.downloadProgress * 100);
        }
      }
    });
  }

  try {
    for (const modelId of models) {
      await ModelManager.downloadModel(modelId);
      
      // Use coexist: true so loading the TTS/VAD doesn't unload the STT/LLM
      const success = await ModelManager.loadModel(modelId, { coexist: true });
      
      if (!success) {
        const model = ModelManager.getModels().find(m => m.id === modelId);
        throw new Error(model?.error || `Failed to load model: ${modelId}`);
      }
      
      // Ensure UI shows 100% when loaded
      onProgress?.(modelId, 100);
    }
  } finally {
    if (unsubscribe) {
      unsubscribe();
    }
  }
}

/** Check if all voice models are loaded */
export function areVoiceModelsLoaded(): boolean {
  const models = ModelManager.getModels();
  // We use type 'any' or check string because ModelStatus might not be explicitly imported
  const isReady = (id: string) => models.find(m => m.id === id)?.status === 'loaded';
  return (
    isReady('lfm2-350m-q4_k_m') &&
    isReady('sherpa-onnx-whisper-tiny.en') &&
    isReady('vits-piper-en_US-lessac-medium') &&
    isReady('silero-vad-v5')
  );
}

/** Unload all models to free memory */
export async function unloadAllModels(): Promise<void> {
  await ModelManager.unloadAll();
}

// ---------------------------------------------------------------------------
// Voice Activity Detection (VAD)
// ---------------------------------------------------------------------------

export class VoiceActivityDetector {
  private isListening = false;
  private mic: AudioCapture | null = null;
  private vadUnsubscribe: (() => void) | null = null;

  /** Start listening for voice activity */
  async start(callbacks: {
    onSpeechStart?: () => void;
    onSpeechEnd?: (audio: Float32Array) => void;
    onError?: (error: Error) => void;
  }): Promise<void> {
    if (this.isListening) return;

    try {
      // Initialize VAD
      VAD.reset();

      // Set up audio capture
      this.mic = new AudioCapture({ sampleRate: 16000 });

      // Listen for speech activity
      this.vadUnsubscribe = VAD.onSpeechActivity((activity) => {
        if (activity === SpeechActivity.Started) {
          callbacks.onSpeechStart?.();
        } else if (activity === SpeechActivity.Ended) {
          const segment = VAD.popSpeechSegment();
          if (segment && segment.samples.length > 1600) {
            callbacks.onSpeechEnd?.(segment.samples);
          }
        }
      });

      // Start microphone and feed to VAD
      await this.mic.start(
        (chunk) => { VAD.processSamples(chunk); },
        () => {} // Audio level callback (unused)
      );

      this.isListening = true;
    } catch (error) {
      callbacks.onError?.(error as Error);
    }
  }

  /** Stop listening */
  stop(): void {
    if (!this.isListening) return;

    if (this.mic) {
      this.mic.stop();
      this.mic = null;
    }

    if (this.vadUnsubscribe) {
      this.vadUnsubscribe();
      this.vadUnsubscribe = null;
    }

    VAD.reset();
    this.isListening = false;
  }

  /** Check if currently listening */
  isActive(): boolean {
    return this.isListening;
  }
}

// ---------------------------------------------------------------------------
// High-Level Voice Pipeline
// ---------------------------------------------------------------------------

export async function processVoiceTurn(
  audioData: Float32Array,
  systemPrompt: string,
  callbacks?: VoiceProcessingCallbacks
): Promise<{ transcript: string; response: string }> {
  try {
    const stt: any = ExtensionPoint.requireProvider('stt', '@runanywhere/web-onnx');
    const textGen: any = ExtensionPoint.requireProvider('llm', '@runanywhere/web-llamacpp');
    const tts: any = ExtensionPoint.requireProvider('tts', '@runanywhere/web-onnx');
    
    callbacks?.onStateChange?.('processingSTT' as any);
    const sttResult = await stt.transcribe(audioData, { sampleRate: 16000 });
    const transcript = sttResult.text.trim();
    callbacks?.onTranscription?.(transcript);
    
    if (!transcript) return { transcript: '', response: '' };

    // Anti-Hallucination Guardrails
    const blocked = guardrails(transcript);
    if (blocked) {
      callbacks?.onStateChange?.('generatingResponse' as any);
      callbacks?.onGenerationComplete?.(blocked);
      callbacks?.onStateChange?.('playingTTS' as any);
      callbacks?.onSynthesisStart?.();
      
      const ttsResult = await tts.synthesize(blocked, { speed: 1.0 });
      const player = new AudioPlayback({ sampleRate: ttsResult.sampleRate });
      await player.play(ttsResult.audioData, ttsResult.sampleRate);
      player.dispose();
      
      callbacks?.onSynthesisComplete?.();
      callbacks?.onStateChange?.('idle' as any);
      return { transcript, response: blocked };
    }

    // Intent Context
    const intent = detectIntent(transcript);
    let finalPrompt = systemPrompt;
    if (intent === "planning") {
      finalPrompt += "\n\n[Context: User wants help planning tasks.]";
    } else if (intent === "reminder") {
      finalPrompt += "\n\n[Context: User wants to set or discuss reminders.]";
    }
    
    callbacks?.onStateChange?.('generatingResponse' as any);
    callbacks?.onGenerationStart?.();
    
    const { stream, cancel } = await textGen.generateStream(transcript, {
      maxTokens: GENERATION_CONFIG.maxTokens,
      temperature: GENERATION_CONFIG.temperature,
      topP: GENERATION_CONFIG.topP,
      systemPrompt: finalPrompt,
    });
    
    let accumulated = '';
    let unsynthesized = '';
    let audioQueue = Promise.resolve();
    
    for await (const token of stream) {
      accumulated += token;
      unsynthesized += token;
      callbacks?.onGenerationToken?.(token);

      // Response length control (> 300 chars, truncate to last full sentence)
      if (accumulated.length >= 300) {
        cancel();
        // Truncate trailing incomplete sentence
        accumulated = accumulated.slice(0, accumulated.length - unsynthesized.length);
        unsynthesized = '';
        break; 
      }
      
      // Early TTS Chunking on punctuation boundaries
      if (/[.!?\n](\s|$)/.test(unsynthesized)) {
        const chunkToPlay = unsynthesized.trim();
        unsynthesized = '';
        
        if (chunkToPlay.length > 0) {
          callbacks?.onStateChange?.('playingTTS' as any);
          callbacks?.onSynthesisStart?.();
          audioQueue = audioQueue.then(async () => {
            const ttsResult = await tts.synthesize(chunkToPlay, { speed: 1.0 });
            const player = new AudioPlayback({ sampleRate: ttsResult.sampleRate });
            await player.play(ttsResult.audioData, ttsResult.sampleRate);
            player.dispose();
            callbacks?.onSynthesisComplete?.();
          });
        }
      }
    }

    // Final trailing text
    if (unsynthesized.trim().length > 0) {
      const chunkToPlay = unsynthesized.trim();
      callbacks?.onStateChange?.('playingTTS' as any);
      callbacks?.onSynthesisStart?.();
      audioQueue = audioQueue.then(async () => {
        const ttsResult = await tts.synthesize(chunkToPlay, { speed: 1.0 });
        const player = new AudioPlayback({ sampleRate: ttsResult.sampleRate });
        await player.play(ttsResult.audioData, ttsResult.sampleRate);
        player.dispose();
        callbacks?.onSynthesisComplete?.();
      });
    }

    // Await all queued audio playback before completing turn
    await audioQueue;
    callbacks?.onGenerationComplete?.(accumulated);
    callbacks?.onStateChange?.('idle' as any);

    return { transcript, response: accumulated };
  } catch (error) {
    callbacks?.onError?.(error as Error);
    throw error;
  }
}

export { SpeechActivity };
