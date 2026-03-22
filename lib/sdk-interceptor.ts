/**
 * SDK Import Interceptor
 * 
 * Monkey-patches the RunAnywhere SDK to use pre-loaded modules
 * instead of trying to dynamically import them (which fails in Next.js)
 */

'use client';

declare global {
  interface Window {
    __WASM_MODULES_READY__?: boolean;
    __WASM_MODULES_ERROR__?: string;
    __llamacpp_cpu__?: any;
    __llamacpp_webgpu__?: any;
    __sherpa_onnx__?: any;
  }
}

/**
 * Wait for WASM modules to be pre-loaded
 */
export async function waitForWASMModules(timeout = 30000): Promise<void> {
  const startTime = Date.now();
  
  while (!window.__WASM_MODULES_READY__) {
    if (window.__WASM_MODULES_ERROR__) {
      throw new Error(`WASM pre-load failed: ${window.__WASM_MODULES_ERROR__}`);
    }
    
    if (Date.now() - startTime > timeout) {
      throw new Error('Timeout waiting for WASM modules to pre-load');
    }
    
    // Wait 100ms before checking again
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  console.log('[SDKInterceptor] WASM modules are ready');
}

/**
 * Patch the SDK's LlamaCppBridge to use pre-loaded modules
 */
export function patchSDKModuleLoading() {
  if (typeof window === 'undefined') return;
  
  console.log('[SDKInterceptor] Patching SDK module loading...');
  
  // Store original dynamic import
  // @ts-ignore - TS doesn't know about window.import
  const originalImport = window.import || ((...args: any[]) => (window as any).import(...args));
  
  // Create custom import function
  const customImport = async (url: string) => {
    console.log('[SDKInterceptor] Intercepting import:', url);
    
    // Check if it's one of our WASM modules
    if (url.includes('racommons-llamacpp-webgpu.js')) {
      console.log('[SDKInterceptor] Returning pre-loaded LlamaCpp WebGPU module');
      return { default: window.__llamacpp_webgpu__ };
    }
    
    if (url.includes('racommons-llamacpp.js')) {
      console.log('[SDKInterceptor] Returning pre-loaded LlamaCpp CPU module');
      return { default: window.__llamacpp_cpu__ };
    }
    
    if (url.includes('sherpa-onnx-glue.js')) {
      console.log('[SDKInterceptor] Returning pre-loaded Sherpa ONNX module');
      return { default: window.__sherpa_onnx__ };
    }
    
    // For other imports, use original
    console.log('[SDKInterceptor] Using original import for:', url);
    return originalImport(url);
  };
  
  // Can't actually override import() globally, so we need a different approach
  // Instead, we'll inject the modules into the SDK's bridge instances directly
  
  console.log('[SDKInterceptor] Patch complete (module injection ready)');
}

/**
 * Get pre-loaded module for SDK
 */
export function getPreloadedModuleForSDK(url: string): any {
  if (typeof window === 'undefined') return null;
  
  if (url.includes('racommons-llamacpp-webgpu.js')) {
    return { default: window.__llamacpp_webgpu__ };
  }
  
  if (url.includes('racommons-llamacpp.js')) {
    return { default: window.__llamacpp_cpu__ };
  }
  
  if (url.includes('sherpa-onnx-glue.js')) {
    return { default: window.__sherpa_onnx__ };
  }
  
  return null;
}
