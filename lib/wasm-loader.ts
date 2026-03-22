/**
 * WASM Module Loader - Next.js Workaround
 * 
 * Next.js/Turbopack cannot handle dynamic import() with variable URLs.
 * This module pre-loads the WASM modules as static imports and provides
 * them to the SDK, bypassing the dynamic import issue.
 */

'use client';

// Pre-load WASM modules as static imports
// These will be bundled by Next.js and available synchronously
let llamacppModule: any = null;
let llamacppWebGPUModule: any = null;

/**
 * Load WASM modules and inject them into global scope
 * so the SDK can access them without dynamic import
 */
export async function preloadWASMModules() {
  if (typeof window === 'undefined') {
    throw new Error('preloadWASMModules must be called in browser');
  }

  console.log('[WASMLoader] Pre-loading WASM modules...');

  try {
    // Create script tags to load the modules
    // This bypasses Next.js's import analysis
    await loadModuleViaScript('/assets/racommons-llamacpp.js', 'llamacpp-cpu');
    await loadModuleViaScript('/assets/racommons-llamacpp-webgpu.js', 'llamacpp-webgpu');
    await loadModuleViaScript('/assets/sherpa/sherpa-onnx-glue.js', 'sherpa-onnx');

    console.log('[WASMLoader] All modules pre-loaded successfully');
    return true;
  } catch (error) {
    console.error('[WASMLoader] Failed to pre-load modules:', error);
    throw error;
  }
}

/**
 * Load a module via script tag instead of dynamic import
 */
function loadModuleViaScript(src: string, id: string): Promise<void> {
  return new Promise((resolve, reject) => {
    // Check if already loaded
    if (document.getElementById(id)) {
      console.log(`[WASMLoader] ${id} already loaded`);
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.id = id;
    script.type = 'module';
    script.src = src;

    script.onload = () => {
      console.log(`[WASMLoader] ${id} loaded successfully`);
      resolve();
    };

    script.onerror = (error) => {
      console.error(`[WASMLoader] Failed to load ${id}:`, error);
      reject(new Error(`Failed to load ${src}`));
    };

    document.head.appendChild(script);
  });
}

/**
 * Alternative: Use fetch + eval approach
 * More reliable for Next.js
 */
export async function loadWASMModulesViaFetch() {
  if (typeof window === 'undefined') {
    throw new Error('loadWASMModulesViaFetch must be called in browser');
  }

  console.log('[WASMLoader] Loading modules via fetch...');

  try {
    const origin = window.location.origin;
    
    // Fetch the module code
    const urls = [
      `${origin}/assets/racommons-llamacpp.js`,
      `${origin}/assets/racommons-llamacpp-webgpu.js`,
      `${origin}/assets/sherpa/sherpa-onnx-glue.js`,
    ];

    for (const url of urls) {
      console.log(`[WASMLoader] Fetching ${url}...`);
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch ${url}: ${response.status}`);
      }

      const code = await response.text();
      
      // Create a blob URL for the module
      const blob = new Blob([code], { type: 'application/javascript' });
      const blobUrl = URL.createObjectURL(blob);
      
      // Import the blob URL
      await import(/* webpackIgnore: true */ blobUrl);
      
      console.log(`[WASMLoader] Loaded ${url} ✓`);
    }

    console.log('[WASMLoader] All modules loaded via fetch ✓');
    return true;
  } catch (error) {
    console.error('[WASMLoader] Fetch loading failed:', error);
    throw error;
  }
}
