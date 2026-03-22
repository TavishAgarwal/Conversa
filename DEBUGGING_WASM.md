# WASM Loading Issue - Debugging Guide

## Current Status
The app is running at http://localhost:3000 but models are failing to load.

## What I've Done

### 1. Added Extensive Logging
- Every step of SDK initialization now logs to console
- Error messages show exact failure point
- Check browser console (F12) for detailed logs

### 2. Files Created/Modified

**New Files:**
- `/frontend/hooks/use-sdk-initialization.ts` - Better init tracking
- `/frontend/public/diagnostic.html` - Test page for WASM loading
- `/frontend/public/test-import.html` - Simple import test
- `/frontend/DEBUG.md` - Debugging instructions

**Modified Files:**
- `/frontend/lib/runanywhere.ts` - Added detailed logging, client-side guards
- `/frontend/lib/ai-service.ts` - Added 'use client' directive
- `/frontend/components/conversa/voice-assistant-screen.tsx` - Enhanced error display

### 3. WASM Files Status
All WASM files are in `/frontend/public/assets/`:
- ✓ racommons-llamacpp.js (60 KB)
- ✓ racommons-llamacpp.wasm (3.7 MB)
- ✓ racommons-llamacpp-webgpu.js (74 KB)
- ✓ racommons-llamacpp-webgpu.wasm (3.8 MB)
- ✓ sherpa/sherpa-onnx-glue.js (93 KB)
- ✓ sherpa/sherpa-onnx.wasm (12 MB)
- ✓ sherpa/*.js (helper files)

## To Debug - Check Browser Console

### Open Console
1. Go to http://localhost:3000
2. Press F12 (or Cmd+Option+I on Mac)
3. Click "Console" tab

### Look For These Logs

**If SDK init succeeds:**
```
[RunAnywhere] Starting SDK initialization...
[RunAnywhere] Step 1: Initializing core SDK...
[RunAnywhere] Core SDK initialized ✓
[RunAnywhere] Step 2: Registering backends from http://localhost:3000
[RunAnywhere] Registering LlamaCPP backend...
[RunAnywhere] LlamaCPP URLs: {wasmUrl: "...", webgpuWasmUrl: "..."}
[RunAnywhere] LlamaCPP backend registered ✓
```

**If it fails, note the error:**
- What step does it fail at?
- What's the exact error message?
- Is there a stack trace?

### Common Errors & Solutions

#### Error: "Cannot find module as expression is too dynamic"
**Cause**: Next.js trying to statically analyze dynamic import  
**Status**: Should be fixed with absolute URLs  
**Check**: Look for logs showing the URLs being used

#### Error: "Failed to fetch" or 404
**Cause**: WASM files not accessible  
**Test**: Visit these URLs directly:
- http://localhost:3000/assets/racommons-llamacpp.js
- http://localhost:3000/assets/sherpa/sherpa-onnx-glue.js

If they return 404, run:
```bash
cd frontend
bash scripts/copy-wasm.sh
```

#### Error: "SharedArrayBuffer is not defined"
**Cause**: CORS headers not set  
**Fix**: Check browser Network tab, look for COOP/COEP headers on main page

#### Error: Module import works but instantiation fails
**Cause**: WASM binary can't be loaded  
**Test**: Visit http://localhost:3000/diagnostic.html  
**Check**: Network tab shows .wasm file loading

## Alternative Test Pages

### 1. Diagnostic Page
http://localhost:3000/diagnostic.html

This page tests:
- ✓ File accessibility (HEAD requests)
- ✓ Dynamic import of JS modules
- ✓ WASM instantiation
- ✓ Module function calls

### 2. Simple Import Test  
http://localhost:3000/test-import.html

This tests basic ES module import.

## What to Report Back

Please share:
1. **Console logs** - Copy the [RunAnywhere] logs
2. **Error message** - The exact error text
3. **Network tab** - Any failed requests (red)
4. **Diagnostic results** - Output from /diagnostic.html

## Quick Fixes to Try

### Fix 1: Clear Cache & Reload
```
Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows/Linux)
```

### Fix 2: Verify WASM Files
```bash
cd frontend
ls -lh public/assets/*.{js,wasm}
ls -lh public/assets/sherpa/
```

Should see 10 files total (~20 MB)

### Fix 3: Restart Dev Server
```bash
# Stop server (Ctrl+C)
cd frontend
npm run dev
```

### Fix 4: Reinstall & Copy WASM
```bash
cd frontend
rm -rf node_modules public/assets
npm install  # This auto-runs copy-wasm.sh
```

## Next Steps

Based on the console logs, we can:
1. Identify exact failure point
2. Check if it's a module loading issue or WASM instantiation issue
3. Apply targeted fix

The extensive logging should make the root cause obvious.
