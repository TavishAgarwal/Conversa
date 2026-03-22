# Quick Debugging Steps

Open your browser console (F12) and look for these log messages:

## Expected Success Flow:
```
[RunAnywhere] Starting SDK initialization...
[RunAnywhere] Step 1: Initializing core SDK...
[RunAnywhere] Core SDK initialized ✓
[RunAnywhere] Step 2: Registering backends from http://localhost:3000
[RunAnywhere] Registering LlamaCPP backend...
[RunAnywhere] LlamaCPP URLs: {wasmUrl: ..., webgpuWasmUrl: ...}
[RunAnywhere] LlamaCPP backend registered ✓
[RunAnywhere] Registering ONNX backend...
[RunAnywhere] ONNX URLs: {wasmUrl: ..., helperBaseUrl: ...}
[RunAnywhere] ONNX backend registered ✓
[RunAnywhere] Step 3: Registering model catalog...
[RunAnywhere] Model catalog registered ✓
[RunAnywhere] SDK initialization complete!
```

## If you see an error, note which step it fails at:

1. **Step 1 fails**: Core SDK issue - check @runanywhere/web package
2. **Step 2 LlamaCPP fails**: WASM loading issue - check:
   - http://localhost:3000/assets/racommons-llamacpp.js exists
   - Browser console shows dynamic import error
3. **Step 2 ONNX fails**: Sherpa ONNX loading issue - check:
   - http://localhost:3000/assets/sherpa/sherpa-onnx-glue.js exists

## Common Errors:

### "Failed to fetch" or 404
- WASM files not copied to public directory
- Run: `cd frontend && bash scripts/copy-wasm.sh`

### "Cannot find module" or "dynamic"  
- Next.js blocking dynamic imports
- This should be fixed with absolute URLs

### "SharedArrayBuffer is not defined"
- CORS headers not set
- Check next.config.mjs has COOP/COEP headers

## Quick Test:
Open http://localhost:3000/diagnostic.html to run automated diagnostics
