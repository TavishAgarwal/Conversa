/**
 * API service layer for voice assistant functionality.
 * Wraps RunAnywhere SDK for STT, LLM, TTS, and VAD.
 * 
 * IMPORTANT: This module MUST only run in the browser (client-side).
 */

'use client';

import { initSDK, ModelManager, ModelCategory } from './runanywhere';
import { 
  VoicePipeline, 
  AudioCapture, 
  AudioPlayback, 
  SpeechActivity 
} from '@runanywhere/web';
import { VAD } from '@runanywhere/web-onnx';

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

let globalPipeline: VoicePipeline | null = null;

/** Get or create the global voice pipeline */
function getVoicePipeline(): VoicePipeline {
  if (!globalPipeline) {
    globalPipeline = new VoicePipeline();
  }
  return globalPipeline;
}

/** Process a complete voice turn: audio -> text -> LLM -> speech */
export async function processVoiceTurn(
  audioData: Float32Array,
  systemPrompt: string,
  callbacks?: VoiceProcessingCallbacks
): Promise<{ transcript: string; response: string }> {
  const pipeline = getVoicePipeline();
  
  try {
    let transcript = '';
    let response = '';

    const result = await pipeline.processTurn(audioData, {
      maxTokens: 512,
      temperature: 0.7,
      systemPrompt,
    }, {
      onTranscription: (text) => {
        transcript = text;
        callbacks?.onTranscription?.(text);
      },
      onResponseToken: (_token, accumulated) => {
        response = accumulated;
        callbacks?.onGenerationToken?.(_token);
      },
      onResponseComplete: (text) => {
        response = text;
        callbacks?.onGenerationComplete?.(text);
      },
      onSynthesisComplete: async (audio, sampleRate) => {
        callbacks?.onSynthesisStart?.();
        const player = new AudioPlayback({ sampleRate });
        await player.play(audio, sampleRate);
        player.dispose();
        callbacks?.onSynthesisComplete?.();
      },
      onStateChange: (state) => {
        if (state === 'processingSTT') {
          callbacks?.onTranscriptionStart?.();
        } else if (state === 'generatingResponse') {
          callbacks?.onGenerationStart?.();
        } else if (state === 'playingTTS') {
          callbacks?.onSynthesisStart?.();
        }
      },
    });

    return { 
      transcript: result?.transcription || transcript, 
      response: result?.response || response 
    };
  } catch (error) {
    callbacks?.onError?.(error as Error);
    throw error;
  }
}

export { SpeechActivity };
