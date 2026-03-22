/**
 * Custom RunAnywhere SDK Initialization
 * 
 * Bypasses the SDK's problematic dynamic import system
 * and directly uses pre-loaded WASM modules
 */

'use client';

import { RunAnywhere, SDKEnvironment, ModelManager, ModelCategory, LLMFramework, ExtensionPoint, type CompactModelDef } from '@runanywhere/web';

declare global {
  interface Window {
    __WASM_MODULES_READY__?: boolean;
    __llamacpp_cpu__?: any;
    __llamacpp_webgpu__?: any;
    __sherpa_onnx__?: any;
  }
}

const MODELS: CompactModelDef[] = [
  {
    id: 'lfm2-350m-q4_k_m',
    name: 'LFM2 350M Q4_K_M',
    repo: 'LiquidAI/LFM2-350M-GGUF',
    files: ['LFM2-350M-Q4_K_M.gguf'],
    framework: LLMFramework.LlamaCpp,
    modality: ModelCategory.Language,
    memoryRequirement: 250_000_000,
  },
  {
    id: 'sherpa-onnx-whisper-tiny.en',
    name: 'Whisper Tiny English (ONNX)',
    url: 'https://huggingface.co/runanywhere/sherpa-onnx-whisper-tiny.en/resolve/main/sherpa-onnx-whisper-tiny.en.tar.gz',
    framework: LLMFramework.ONNX,
    modality: ModelCategory.SpeechRecognition,
    memoryRequirement: 105_000_000,
    artifactType: 'archive' as const,
  },
  {
    id: 'vits-piper-en_US-lessac-medium',
    name: 'Piper TTS US English (Lessac)',
    url: 'https://huggingface.co/runanywhere/vits-piper-en_US-lessac-medium/resolve/main/vits-piper-en_US-lessac-medium.tar.gz',
    framework: LLMFramework.ONNX,
    modality: ModelCategory.SpeechSynthesis,
    memoryRequirement: 65_000_000,
    artifactType: 'archive' as const,
  },
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

let _initPromise: Promise<void> | null = null;

/**
 * Initialize SDK with pre-loaded WASM modules
 */
export async function initSDKCustom(): Promise<void> {
  if (typeof window === 'undefined') {
    throw new Error('SDK can only be initialized in browser');
  }

  if (_initPromise) {
    return _initPromise;
  }

  _initPromise = (async () => {
    console.log('[CustomSDK] Starting initialization...');

    // Step 1: Initialize core SDK
    console.log('[CustomSDK] Initializing core SDK...');
    await RunAnywhere.initialize({
      environment: SDKEnvironment.Development,
      debug: true,
    });
    console.log('[CustomSDK] Core SDK initialized ✓');

    // Step 3: Manually initialize WASM modules
    console.log('[CustomSDK] Initializing WASM modules...');
    
    try {
      // Get the SDK's bridge instances
      // @ts-ignore
      const { LlamaCppBridge, LlamaCPP } = await import('@runanywhere/web-llamacpp');
      // @ts-ignore
      const { SherpaONNXBridge, ONNX } = await import('@runanywhere/web-onnx');
      
      // Register the backend SDK controllers natively, providing explicit 
      // override pointers to our locally cached airplane-mode WebAssembly binaries.
      // This delegates WASM ingestion to internal WebWorkers seamlessly bypassing
      // the rigid 8MB V8 synchronous Main-Thread Chrome limits.
      
      await LlamaCPP.register({
         wasmUrl: '/assets/racommons-llamacpp.js',
         acceleration: 'cpu'
      });
      console.log('[CustomSDK] LlamaCpp native worker routing registered ✓');
      
      await ONNX.register({
         wasmUrl: '/assets/sherpa/sherpa-onnx-glue.js',
         helperBaseUrl: '/assets/sherpa/'
      });
      console.log('[CustomSDK] SherpaONNX native worker routing registered ✓');
      
    } catch (error) {
      console.error('[CustomSDK] Failed to inject WASM modules:', error);
      throw error;
    }

    // Step 4: Register model catalog
    console.log('[CustomSDK] Registering model catalog...');
    RunAnywhere.registerModels(MODELS);
    console.log('[CustomSDK] Model catalog registered ✓');

    console.log('[CustomSDK] Initialization complete! ✓');
  })();

  return _initPromise;
}

export { RunAnywhere, ModelManager, ModelCategory };
