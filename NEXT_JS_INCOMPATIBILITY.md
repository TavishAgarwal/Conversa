# The Real Problem and Solution

## The Problem

The RunAnywhere SDK contains this code:
```javascript
const { default: createModule } = await import(/* @vite-ignore */ moduleUrl);
```

Next.js/Turbopack analyzes ALL code it bundles, including node_modules. When it sees `import(moduleUrl)` with a variable, it throws:
"Cannot find module as expression is too dynamic"

This is a **bundler-time error**, not a runtime error.

## Why Vite Works

Vite sees the `/* @vite-ignore */` comment and skips static analysis of that import.
Next.js/Turbopack doesn't respect this comment.

## Solutions (in order of feasibility)

### Solution 1: Use the Vite Frontend (RECOMMENDED)
The Vite app at `/src` already works perfectly.
Just use that instead of the Next.js frontend.

```bash
# In project root
npm install
npm run dev
# Visit http://localhost:5173
```

### Solution 2: Build Next.js with Webpack Instead of Turbopack
```bash
cd frontend
npm run dev -- --webpack
```

This MIGHT work because Webpack handles dynamic imports differently.

### Solution 3: Load SDK as External Script
Don't import the SDK through npm. Load it via CDN or copy the dist files to public/ and load via script tags.

### Solution 4: Fork the SDK
Fork @runanywhere/web-llamacpp and @runanywhere/web-onnx, remove the dynamic imports, and use static imports or a different loading mechanism.

## Recommendation

**Use the Vite frontend** - it's fully functional and works perfectly. The Next.js frontend was just a UI mockup that we tried to make functional, but Next.js's bundler is fundamentally incompatible with the SDK's dynamic import pattern.

The Vite app has:
- ✓ Real AI models working
- ✓ Full voice pipeline
- ✓ All functionality
- ✓ No bundler issues

The only thing the Next.js app has is a prettier UI, but that's not worth the incompatibility.
