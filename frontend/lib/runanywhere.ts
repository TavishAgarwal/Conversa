/**
 * RunAnywhere SDK initialization and model catalog.
 *
 * This module:
 * 1. Initializes the core SDK (TypeScript-only, no WASM)
 * 2. Registers the LlamaCPP backend (loads LLM/VLM WASM)
 * 3. Registers the ONNX backend (sherpa-onnx — STT/TTS/VAD)
 * 4. Registers the model catalog
 *
 * Import this module once at app startup.
 * 
 * IMPORTANT: This module MUST only run in the browser (client-side).
 */

'use client';

import {
  RunAnywhere,
  SDKEnvironment,
  ModelManager,
  ModelCategory,
  LLMFramework,
  type CompactModelDef,
} from '@runanywhere/web';

import { LlamaCPP } from '@runanywhere/web-llamacpp';
import { ONNX } from '@runanywhere/web-onnx';

// ---------------------------------------------------------------------------
// Model catalog
// ---------------------------------------------------------------------------

const MODELS: CompactModelDef[] = [
  // LLM — Liquid AI LFM2 350M (small + fast for chat)
  {
    id: 'lfm2-350m-q4_k_m',
    name: 'LFM2 350M Q4_K_M',
    repo: 'LiquidAI/LFM2-350M-GGUF',
    files: ['LFM2-350M-Q4_K_M.gguf'],
    framework: LLMFramework.LlamaCpp,
    modality: ModelCategory.Language,
    memoryRequirement: 250_000_000,
  },
  // LLM — Liquid AI LFM2 1.2B Tool (optimized for tool calling & function calling)
  {
    id: 'lfm2-1.2b-tool-q4_k_m',
    name: 'LFM2 1.2B Tool Q4_K_M',
    repo: 'LiquidAI/LFM2-1.2B-Tool-GGUF',
    files: ['LFM2-1.2B-Tool-Q4_K_M.gguf'],
    framework: LLMFramework.LlamaCpp,
    modality: ModelCategory.Language,
    memoryRequirement: 800_000_000,
  },
  // STT (sherpa-onnx archive)
  {
    id: 'sherpa-onnx-whisper-tiny.en',
    name: 'Whisper Tiny English (ONNX)',
    url: 'https://huggingface.co/runanywhere/sherpa-onnx-whisper-tiny.en/resolve/main/sherpa-onnx-whisper-tiny.en.tar.gz',
    framework: LLMFramework.ONNX,
    modality: ModelCategory.SpeechRecognition,
    memoryRequirement: 105_000_000,
    artifactType: 'archive' as const,
  },
  // TTS (sherpa-onnx archive)
  {
    id: 'vits-piper-en_US-lessac-medium',
    name: 'Piper TTS US English (Lessac)',
    url: 'https://huggingface.co/runanywhere/vits-piper-en_US-lessac-medium/resolve/main/vits-piper-en_US-lessac-medium.tar.gz',
    framework: LLMFramework.ONNX,
    modality: ModelCategory.SpeechSynthesis,
    memoryRequirement: 65_000_000,
    artifactType: 'archive' as const,
  },
  // VAD (single ONNX file)
  {
    id: 'silero-vad-v5',
    name: 'Silero VAD v5',
    url: 'https://huggingface.co/runanywhere/silero-vad-v5/resolve/main/silero_vad.onnx',
    files: ['silero_vad.onnx'],
    framework: LLMFramework.ONNX,
    modality: ModelCategory.Audio,
    memoryRequirement: 5_000_000,
  },
];

// ---------------------------------------------------------------------------
// Initialization
// ---------------------------------------------------------------------------

let _initPromise: Promise<void> | null = null;
let _isClient = false;

// Check if we're in the browser on first import
if (typeof window !== 'undefined') {
  _isClient = true;
}

/** Initialize the RunAnywhere SDK. Safe to call multiple times. */
export async function initSDK(): Promise<void> {
  // Guard against server-side execution
  if (!_isClient || typeof window === 'undefined') {
    console.warn('[RunAnywhere] Skipping initialization - not in browser');
    throw new Error('RunAnywhere SDK can only be initialized in the browser');
  }

  if (_initPromise) {
    console.log('[RunAnywhere] Already initialized or initializing...');
    return _initPromise;
  }

  _initPromise = (async () => {
    console.log('[RunAnywhere] Starting SDK initialization...');
    
    try {
      // Step 1: Initialize core SDK (TypeScript-only, no WASM)
      console.log('[RunAnywhere] Step 1: Initializing core SDK...');
      await RunAnywhere.initialize({
        environment: SDKEnvironment.Development,
        debug: true,
      });
      console.log('[RunAnywhere] Core SDK initialized ✓');

      // Step 2: Register backends with explicit WASM paths
      const origin = window.location.origin;
      console.log('[RunAnywhere] Step 2: Registering backends from', origin);
      
      // LlamaCPP (for LLM) - point to WASM files in public/assets
      console.log('[RunAnywhere] Registering LlamaCPP backend...');
      console.log('[RunAnywhere] LlamaCPP URLs:', {
        wasmUrl: `${origin}/assets/racommons-llamacpp.js`,
        webgpuWasmUrl: `${origin}/assets/racommons-llamacpp-webgpu.js`,
      });
      
      await LlamaCPP.register({
        wasmUrl: `${origin}/assets/racommons-llamacpp.js`,
        webgpuWasmUrl: `${origin}/assets/racommons-llamacpp-webgpu.js`,
        acceleration: 'auto',
      });
      console.log('[RunAnywhere] LlamaCPP backend registered ✓');

      // ONNX (for STT/TTS/VAD) - point to sherpa-onnx files in public/assets/sherpa
      console.log('[RunAnywhere] Registering ONNX backend...');
      console.log('[RunAnywhere] ONNX URLs:', {
        wasmUrl: `${origin}/assets/sherpa/sherpa-onnx-glue.js`,
        helperBaseUrl: `${origin}/assets/sherpa/`,
      });
      
      await ONNX.register({
        wasmUrl: `${origin}/assets/sherpa/sherpa-onnx-glue.js`,
        helperBaseUrl: `${origin}/assets/sherpa/`,
      });
      console.log('[RunAnywhere] ONNX backend registered ✓');

      // Step 3: Register model catalog
      console.log('[RunAnywhere] Step 3: Registering model catalog...');
      RunAnywhere.registerModels(MODELS);
      console.log('[RunAnywhere] Model catalog registered ✓');
      console.log('[RunAnywhere] SDK initialization complete!');
      
    } catch (error) {
      console.error('[RunAnywhere] Initialization failed:', error);
      _initPromise = null; // Reset so we can try again
      throw error;
    }
  })();

  return _initPromise;
}

/** Get acceleration mode after init. */
export function getAccelerationMode(): string | null {
  return LlamaCPP.isRegistered ? LlamaCPP.accelerationMode : null;
}

// Re-export for convenience
export { RunAnywhere, ModelManager, ModelCategory };
