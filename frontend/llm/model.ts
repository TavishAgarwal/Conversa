import { initSDKCustom, ModelManager, RunAnywhere } from '@/lib/runanywhere-custom';

/**
 * Hybrid Model System
 * 
 * Loads the 350M (Fast) model at startup for instant responsiveness.
 * The 1.2B (Smart) model is lazily loaded in the background after core models are ready.
 */

export type ModelMode = 'fast' | 'smart';

export const MODEL_IDS = {
  fast: 'lfm2-350m-q4_k_m',
  smart: 'lfm2-1.2b-tool-q4_k_m',
} as const;

// Core models required for the voice pipeline to function
const CORE_MODELS = [
  MODEL_IDS.fast,
  'sherpa-onnx-whisper-tiny.en',
  'vits-piper-en_US-lessac-medium',
  'silero-vad-v5'
];

// Track smart model loading state
let _smartModelLoading = false;
let _smartModelLoaded = false;
let _smartModelError: string | null = null;

/**
 * Load core pipeline models (Fast LLM + STT + TTS + VAD).
 * After core models are ready, begin lazy-loading the Smart model in the background.
 */
export async function loadLLM(onProgress?: (progress: number) => void): Promise<void> {
  await initSDKCustom();
  
  if (onProgress) {
    ModelManager.onChange((models) => {
      const active = models.filter(m => CORE_MODELS.includes(m.id));
      if (active.length === 0) return;
      
      const totalProgress = active.reduce((acc, m) => acc + (m.downloadProgress || 0), 0);
      onProgress((totalProgress / CORE_MODELS.length) * 100);
    });
  }

  if (onProgress) onProgress(0);
  
  for (const modelId of CORE_MODELS) {
    await ModelManager.downloadModel(modelId);
    
    const config = { coexist: true, acceleration: 'auto' } as any;
    const success = await ModelManager.loadModel(modelId, config);
    
    if (!success) {
      const checkModel = ModelManager.getModels().find(m => m.id === modelId);
      throw new Error(checkModel?.error || `Failed to natively mount pipeline model: ${modelId}`);
    }
  }
  
  if (onProgress) onProgress(100);

  // Lazy-load the Smart (1.2B) model in the background — non-blocking
  loadSmartModelInBackground();
}

/**
 * Silently download and load the 1.2B model after core models are ready.
 * Does NOT block the UI or throw on failure.
 */
async function loadSmartModelInBackground(): Promise<void> {
  if (_smartModelLoading || _smartModelLoaded) return;
  _smartModelLoading = true;

  try {
    console.log('[ModelLoader] Background loading Smart model (1.2B)...');
    await ModelManager.downloadModel(MODEL_IDS.smart);
    
    const config = { coexist: true, acceleration: 'auto' } as any;
    const success = await ModelManager.loadModel(MODEL_IDS.smart, config);
    
    if (success) {
      _smartModelLoaded = true;
      console.log('[ModelLoader] Smart model (1.2B) ready ✓');
    } else {
      const m = ModelManager.getModels().find(m => m.id === MODEL_IDS.smart);
      _smartModelError = m?.error || 'Failed to load smart model';
      console.warn('[ModelLoader] Smart model load failed:', _smartModelError);
    }
  } catch (e) {
    _smartModelError = String(e);
    console.warn('[ModelLoader] Smart model background load error:', e);
  } finally {
    _smartModelLoading = false;
  }
}

/**
 * Returns whether the core voice pipeline is loaded and ready.
 */
export function isLLMLoaded(): boolean {
  const models = ModelManager.getModels();
  return CORE_MODELS.every(id => models.some(m => m.id === id && m.status === 'loaded'));
}

/**
 * Returns whether the Smart (1.2B) model is loaded and available.
 */
export function isSmartModelReady(): boolean {
  return _smartModelLoaded;
}

/**
 * Returns the error message if the Smart model failed to load, or null.
 */
export function getSmartModelError(): string | null {
  return _smartModelError;
}

/**
 * Select the appropriate LLM model ID based on the mode.
 * Falls back to Fast model if Smart is not yet loaded.
 */
export function selectModelId(mode: ModelMode): string {
  if (mode === 'smart' && _smartModelLoaded) {
    return MODEL_IDS.smart;
  }
  return MODEL_IDS.fast;
}
