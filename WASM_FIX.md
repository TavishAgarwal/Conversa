# WASM Loading Fix - Complete Solution

## Problem

Next.js couldn't dynamically resolve WASM modules from the RunAnywhere SDK, causing the error:
```
Failed to load LlamaCpp WASM module: Cannot find module as expression is too dynamic
```

## Root Cause

1. Next.js 16 uses **Turbopack** by default (not Webpack)
2. The RunAnywhere SDK dynamically imports WASM files using `import.meta.url` resolution
3. Turbopack/Webpack can't resolve these dynamic paths at build time
4. WASM files need to be served from the `public` directory with explicit paths

## Solution Implemented

### 1. Copy WASM Files to Public Directory

Created `/frontend/scripts/copy-wasm.sh`:
```bash
#!/bin/bash
mkdir -p public/assets/sherpa

# LlamaCpp WASM (for LLM)
cp node_modules/@runanywhere/web-llamacpp/wasm/*.{js,wasm} public/assets/

# Sherpa ONNX WASM (for STT/TTS/VAD)
cp node_modules/@runanywhere/web-onnx/wasm/sherpa/* public/assets/sherpa/
```

Added postinstall script to `package.json`:
```json
"scripts": {
  "postinstall": "bash scripts/copy-wasm.sh",
  ...
}
```

### 2. Configure Explicit WASM Paths

Updated `/frontend/lib/runanywhere.ts`:
```typescript
// LlamaCPP (for LLM) - point to WASM files in public/assets
await LlamaCPP.register({
  wasmUrl: '/assets/racommons-llamacpp.js',
  webgpuWasmUrl: '/assets/racommons-llamacpp-webgpu.js',
  acceleration: 'auto',
});

// ONNX (for STT/TTS/VAD) - point to sherpa-onnx files
await ONNX.register({
  wasmUrl: '/assets/sherpa/sherpa-onnx-glue.js',
  helperBaseUrl: '/assets/sherpa/',
});
```

### 3. Update Next.js Config

Updated `/frontend/next.config.mjs`:
```javascript
const nextConfig = {
  // ... other config
  turbopack: {
    // Empty config to enable Turbopack without warnings
  },
}
```

## Files Structure

```
frontend/
├── public/
│   └── assets/
│       ├── racommons-llamacpp.js           (60 KB)
│       ├── racommons-llamacpp.wasm         (3.7 MB)
│       ├── racommons-llamacpp-webgpu.js    (74 KB)
│       ├── racommons-llamacpp-webgpu.wasm  (3.8 MB)
│       └── sherpa/
│           ├── sherpa-onnx-asr.js          (40 KB)
│           ├── sherpa-onnx-glue.js         (93 KB)
│           ├── sherpa-onnx-tts.js          (18 KB)
│           ├── sherpa-onnx-vad.js          (7.5 KB)
│           ├── sherpa-onnx-wave.js         (2.4 KB)
│           └── sherpa-onnx.wasm            (12 MB)
│
├── scripts/
│   └── copy-wasm.sh                        (executable)
│
└── lib/
    └── runanywhere.ts                      (SDK config with paths)
```

## Verification

To verify WASM files are properly set up:

```bash
cd frontend

# Check WASM files exist
ls -lh public/assets/*.{js,wasm}
ls -lh public/assets/sherpa/

# Should see:
# - 4 LlamaCpp files (~8 MB total)
# - 6 Sherpa ONNX files (~12 MB total)
```

## Build Status

✅ TypeScript compilation: Passing  
✅ Next.js build: Successful  
✅ WASM files: Copied to public directory  
✅ SDK configuration: Explicit paths set  

## Running the App

```bash
cd frontend

# Install dependencies (copies WASM files automatically)
npm install

# Start dev server
npm run dev

# Visit http://localhost:3000 (or 3001 if 3000 is in use)
```

## How It Works

1. **On `npm install`**: postinstall script copies WASM files to `public/assets/`
2. **On app load**: SDK fetches WASM from `/assets/` URLs
3. **On model load**: Models download from HuggingFace to browser OPFS
4. **On inference**: WASM modules handle AI processing

## Browser Console

When working correctly, you should see:
```
[RunAnywhere] SDK initialized
[RunAnywhere] LlamaCPP backend registered (cpu/webgpu)
[RunAnywhere] ONNX backend registered
[RunAnywhere] Loading model: lfm2-350m-q4_k_m (0%)...
```

## Troubleshooting

### If models still fail to load:

1. **Check WASM files exist**:
   ```bash
   ls public/assets/*.wasm
   ```

2. **Check browser console** for 404 errors on `/assets/` paths

3. **Verify SDK paths** in `lib/runanywhere.ts`

4. **Check CORS headers** are set in `next.config.mjs`

5. **Clear browser cache** and reload

6. **Try incognito mode** to rule out cache issues

### If build fails:

```bash
# Clean and rebuild
rm -rf .next
npm run build
```

## Why This Approach?

- ✅ **Next.js Compatible**: Works with Turbopack (Next.js 16+)
- ✅ **Explicit Paths**: No dynamic import resolution needed
- ✅ **Public Directory**: WASM served as static assets
- ✅ **Automatic Setup**: postinstall script handles copying
- ✅ **Version Safe**: Works with any RunAnywhere SDK version

## Alternative: Using Webpack

If you need to use Webpack instead of Turbopack:

```bash
# Build with webpack
npm run build -- --webpack
```

But the current solution works with both Turbopack and Webpack!
