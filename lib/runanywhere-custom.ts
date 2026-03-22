/**
 * Custom RunAnywhere SDK Initialization
 * 
 * Bypasses the SDK's problematic dynamic import system
 * and directly uses pre-loaded WASM modules
 */

'use client';

import { RunAnywhere, SDKEnvironment, ModelManager, ModelCategory, LLMFramework, type CompactModelDef } from '@runanywhere/web';

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

    // Step 1: Wait for pre-loaded modules
    console.log('[CustomSDK] Waiting for pre-loaded WASM modules...');
    let attempts = 0;
    while (!window.__WASM_MODULES_READY__ && attempts < 300) {
      await new Promise(resolve => setTimeout(resolve, 100));
      attempts++;
    }

    if (!window.__WASM_MODULES_READY__) {
      throw new Error('WASM modules failed to pre-load');
    }

    console.log('[CustomSDK] WASM modules pre-loaded ✓');

    // Step 2: Initialize core SDK
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
      const { LlamaCppBridge } = await import('@runanywhere/web-llamacpp/dist/Foundation/LlamaCppBridge');
      // @ts-ignore
      const { SherpaONNXBridge } = await import('@runanywhere/web-onnx/dist/Foundation/SherpaONNXBridge');
      
      // Patch the bridges to use pre-loaded modules
      const llamaBridge = (LlamaCppBridge as any).shared;
      const onnxBridge = (SherpaONNXBridge as any).shared;
      
      // Inject pre-loaded modules
      if (llamaBridge) {
        console.log('[CustomSDK] Injecting LlamaCpp module...');
        llamaBridge._module = await window.__llamacpp_cpu__?.({
          print: (text: string) => console.log('[LlamaCpp]', text),
          printErr: (text: string) => console.error('[LlamaCpp]', text),
          locateFile: (path: string) => `/assets/${path}`,
        });
        llamaBridge._loaded = true;
        llamaBridge._accelerationMode = 'cpu';
        console.log('[CustomSDK] LlamaCpp module injected ✓');
      }
      
      if (onnxBridge) {
        console.log('[CustomSDK] Injecting Sherpa ONNX module...');
        onnxBridge._module = await window.__sherpa_onnx__?.({
          print: (text: string) => console.log('[SherpaONNX]', text),
          printErr: (text: string) => console.error('[SherpaONNX]', text),
          locateFile: (path: string) => `/assets/sherpa/${path}`,
        });
        onnxBridge._loaded = true;
        console.log('[CustomSDK] Sherpa ONNX module injected ✓');
      }
      
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
