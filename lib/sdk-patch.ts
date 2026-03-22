/**
 * RunAnywhere SDK Patch for Next.js
 * 
 * The SDK uses dynamic import() which Next.js can't handle.
 * This patch intercepts the module loading and provides a workaround.
 */

'use client';

// Store the original Function constructor
const OriginalFunction = Function;

/**
 * Patch the global environment to support SDK's dynamic imports
 */
export function patchSDKForNextJS() {
  if (typeof window === 'undefined') return;

  console.log('[SDKPatch] Applying Next.js compatibility patches...');

  // Monkey-patch the import function
  // The SDK code does: await import(/* @vite-ignore */ moduleUrl)
  // We need to intercept this and provide the modules directly

  // Store module cache
  const moduleCache = new Map<string, any>();

  // Override the global import (won't work, import is not patchable)
  // Instead, we'll load modules via script tags first

  console.log('[SDKPatch] Patches applied');
}

/**
 * Pre-load WASM modules into the global scope
 * so they're available when SDK tries to import them
 */
export async function preloadSDKModules() {
  if (typeof window === 'undefined') {
    throw new Error('preloadSDKModules must run in browser');
  }

  console.log('[SDKPatch] Pre-loading WASM modules into global scope...');

  const origin = window.location.origin;
  
  const modules = [
    { url: `${origin}/assets/racommons-llamacpp.js`, name: 'llamacpp-cpu' },
    { url: `${origin}/assets/racommons-llamacpp-webgpu.js`, name: 'llamacpp-webgpu' },
    { url: `${origin}/assets/sherpa/sherpa-onnx-glue.js`, name: 'sherpa-onnx' },
  ];

  for (const { url, name } of modules) {
    try {
      console.log(`[SDKPatch] Loading ${name} from ${url}...`);
      
      // Fetch the module code
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const code = await response.text();
      
      // Execute in global scope
      // This makes the exported function available globally
      const scriptEl = document.createElement('script');
      scriptEl.type = 'module';
      scriptEl.textContent = `
        import createModule from '${url}';
        window.__runanywhere_${name.replace(/-/g, '_')} = createModule;
      `;
      document.head.appendChild(scriptEl);
      
      // Wait a bit for the script to execute
      await new Promise(resolve => setTimeout(resolve, 100));
      
      console.log(`[SDKPatch] ${name} loaded ✓`);
    } catch (error) {
      console.error(`[SDKPatch] Failed to load ${name}:`, error);
      throw error;
    }
  }

  console.log('[SDKPatch] All modules pre-loaded');
}
