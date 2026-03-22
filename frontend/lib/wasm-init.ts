/**
 * Custom WASM Module Initialization
 * 
 * The RunAnywhere SDK uses dynamic import() which doesn't work in Next.js.
 * This is a workaround that manually loads and initializes the WASM modules.
 */

'use client';

declare global {
  interface Window {
    createLlamaCppModule?: (config: any) => Promise<any>;
    createLlamaCppWebGPUModule?: (config: any) => Promise<any>;
    createSherpaOnnxModule?: (config: any) => Promise<any>;
  }
}

/**
 * Load WASM modules by injecting script tags
 * This bypasses Next.js's dynamic import restrictions
 */
export async function initializeWASMModules(): Promise<void> {
  if (typeof window === 'undefined') {
    throw new Error('WASM modules can only be initialized in browser');
  }

  console.log('[WASMInit] Starting manual WASM initialization...');

  const origin = window.location.origin;
  
  // Load modules sequentially
  await loadScript(`${origin}/assets/racommons-llamacpp.js`, 'llamacpp-cpu-module');
  await loadScript(`${origin}/assets/racommons-llamacpp-webgpu.js`, 'llamacpp-webgpu-module');
  await loadScript(`${origin}/assets/sherpa/sherpa-onnx-glue.js`, 'sherpa-onnx-module');
  
  console.log('[WASMInit] All WASM modules loaded successfully');
}

function loadScript(src: string, id: string): Promise<void> {
  return new Promise((resolve, reject) => {
    // Check if already loaded
    if (document.getElementById(id)) {
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.id = id;
    script.src = src;
    script.async = false; // Load in order
    
    script.onload = () => {
      console.log(`[WASMInit] Loaded: ${src}`);
      resolve();
    };
    
    script.onerror = () => {
      reject(new Error(`Failed to load: ${src}`));
    };
    
    document.head.appendChild(script);
  });
}
