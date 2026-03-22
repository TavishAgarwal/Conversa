/**
 * WASM Pre-loader for Next.js
 * 
 * Loads WASM modules via script tags and makes them globally available
 * This bypasses Next.js bundler's inability to handle dynamic imports
 */

'use client';

export interface WASMModule {
  name: string;
  url: string;
  globalName: string;
}

const WASM_MODULES: WASMModule[] = [
  {
    name: 'LlamaCpp CPU',
    url: '/assets/racommons-llamacpp.js',
    globalName: '__llamacpp_cpu__',
  },
  {
    name: 'LlamaCpp WebGPU',
    url: '/assets/racommons-llamacpp-webgpu.js',
    globalName: '__llamacpp_webgpu__',
  },
  {
    name: 'Sherpa ONNX',
    url: '/assets/sherpa/sherpa-onnx-glue.js',
    globalName: '__sherpa_onnx__',
  },
];

/**
 * Load a single WASM module via script tag
 */
function loadModule(module: WASMModule): Promise<any> {
  return new Promise((resolve, reject) => {
    const scriptId = `wasm-module-${module.globalName}`;
    
    // Check if already loaded
    if (document.getElementById(scriptId)) {
      console.log(`[WASMPreloader] ${module.name} already loaded`);
      resolve((window as any)[module.globalName]);
      return;
    }

    console.log(`[WASMPreloader] Loading ${module.name} from ${module.url}...`);

    // Create script element
    const script = document.createElement('script');
    script.id = scriptId;
    script.type = 'text/javascript'; // NOT module type
    script.async = false;
    
    // Create wrapper that exposes the module globally
    script.textContent = `
      (async function() {
        try {
          // Fetch the module code
          const response = await fetch('${module.url}');
          if (!response.ok) throw new Error('Failed to fetch: ' + response.status);
          
          const code = await response.text();
          
          // Create a blob URL for the code
          const blob = new Blob([code], { type: 'application/javascript' });
          const blobURL = URL.createObjectURL(blob);
          
          // Import the module from blob URL
          const mod = await import(blobURL);
          
          // Store globally
          window['${module.globalName}'] = mod.default || mod;
          
          console.log('[WASMPreloader] ${module.name} loaded ✓');
          
          // Dispatch event to signal completion
          window.dispatchEvent(new CustomEvent('wasm-module-loaded', { 
            detail: { name: '${module.name}', globalName: '${module.globalName}' }
          }));
        } catch (error) {
          console.error('[WASMPreloader] Failed to load ${module.name}:', error);
          window.dispatchEvent(new CustomEvent('wasm-module-error', { 
            detail: { name: '${module.name}', error: error.message }
          }));
        }
      })();
    `;

    script.onerror = () => {
      console.error(`[WASMPreloader] Script error for ${module.name}`);
      reject(new Error(`Failed to load ${module.name}`));
    };

    document.head.appendChild(script);

    // Listen for completion event
    const successHandler = (e: Event) => {
      const event = e as CustomEvent;
      if (event.detail.globalName === module.globalName) {
        window.removeEventListener('wasm-module-loaded', successHandler);
        window.removeEventListener('wasm-module-error', errorHandler);
        resolve((window as any)[module.globalName]);
      }
    };

    const errorHandler = (e: Event) => {
      const event = e as CustomEvent;
      if (event.detail.name === module.name) {
        window.removeEventListener('wasm-module-loaded', successHandler);
        window.removeEventListener('wasm-module-error', errorHandler);
        reject(new Error(event.detail.error));
      }
    };

    window.addEventListener('wasm-module-loaded', successHandler);
    window.addEventListener('wasm-module-error', errorHandler);

    // Timeout after 30 seconds
    setTimeout(() => {
      window.removeEventListener('wasm-module-loaded', successHandler);
      window.removeEventListener('wasm-module-error', errorHandler);
      reject(new Error(`Timeout loading ${module.name}`));
    }, 30000);
  });
}

/**
 * Pre-load all WASM modules before SDK initialization
 */
export async function preloadWASMModules(): Promise<void> {
  if (typeof window === 'undefined') {
    throw new Error('preloadWASMModules must be called in browser');
  }

  console.log('[WASMPreloader] Starting to pre-load WASM modules...');

  try {
    // Load all modules in parallel
    await Promise.all(WASM_MODULES.map(loadModule));
    
    console.log('[WASMPreloader] All WASM modules pre-loaded successfully ✓');
  } catch (error) {
    console.error('[WASMPreloader] Failed to pre-load WASM modules:', error);
    throw error;
  }
}

/**
 * Get a pre-loaded module from global scope
 */
export function getPreloadedModule(globalName: string): any {
  if (typeof window === 'undefined') return null;
  return (window as any)[globalName];
}

/**
 * Check if all modules are pre-loaded
 */
export function areModulesPreloaded(): boolean {
  if (typeof window === 'undefined') return false;
  
  return WASM_MODULES.every(module => {
    const loaded = !!(window as any)[module.globalName];
    if (!loaded) {
      console.log(`[WASMPreloader] Module not loaded: ${module.name}`);
    }
    return loaded;
  });
}
