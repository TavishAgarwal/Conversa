import { initSDKCustom, ModelManager, RunAnywhere } from '@/lib/runanywhere-custom';

/**
 * Initializes and manages models. WebGPU with WASM fallback is handled by the initial configuration layer `runanywhere-custom.ts`.
 */

const CORE_MODELS = [
  'lfm2-350m-q4_k_m',
  'sherpa-onnx-whisper-tiny.en',
  'vits-piper-en_US-lessac-medium',
  'silero-vad-v5'
];

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
    
    // Explicitly pass CPU context to safely bind across standard hardware profiles
    const config = { coexist: true, acceleration: 'auto' } as any;
    const success = await ModelManager.loadModel(modelId, config);
    
    if (!success) {
      const checkModel = ModelManager.getModels().find(m => m.id === modelId);
      throw new Error(checkModel?.error || `Failed to natively mount pipeline model: ${modelId}`);
    }
  }
  
  if (onProgress) onProgress(100);
}

export function isLLMLoaded(): boolean {
  const models = ModelManager.getModels();
  // Ensure the full conversational voice pipeline is natively verified
  return CORE_MODELS.every(id => models.some(m => m.id === id && m.status === 'loaded'));
}
