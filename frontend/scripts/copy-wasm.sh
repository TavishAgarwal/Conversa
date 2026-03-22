#!/bin/bash
# Copy WASM files from node_modules to public directory

echo "Copying WASM files to public directory..."

# Create directories
mkdir -p public/assets/sherpa

# Copy LlamaCpp WASM files
if [ -d "node_modules/@runanywhere/web-llamacpp/wasm" ]; then
  cp node_modules/@runanywhere/web-llamacpp/wasm/*.js public/assets/
  cp node_modules/@runanywhere/web-llamacpp/wasm/*.wasm public/assets/
  echo "✓ Copied LlamaCpp WASM files"
else
  echo "✗ LlamaCpp WASM directory not found"
fi

# Copy Sherpa ONNX WASM files
if [ -d "node_modules/@runanywhere/web-onnx/wasm/sherpa" ]; then
  cp node_modules/@runanywhere/web-onnx/wasm/sherpa/* public/assets/sherpa/
  echo "✓ Copied Sherpa ONNX WASM files"
else
  echo "✗ Sherpa ONNX WASM directory not found"
fi

echo "Patching WASM bridge files for Webpack compatibility..."
if [[ "$OSTYPE" == "darwin"* ]]; then
  sed -i '' 's/\/\* @vite-ignore \*\//\/\* webpackIgnore: true \*\//g' node_modules/@runanywhere/web-llamacpp/dist/Foundation/LlamaCppBridge.js
  sed -i '' 's/\/\* @vite-ignore \*\//\/\* webpackIgnore: true \*\//g' node_modules/@runanywhere/web-onnx/dist/Foundation/SherpaONNXBridge.js
  sed -i '' 's/\/\* @vite-ignore \*\//\/\* webpackIgnore: true \*\//g' node_modules/@runanywhere/web-onnx/dist/Foundation/SherpaHelperLoader.js
else
  sed -i 's/\/\* @vite-ignore \*\//\/\* webpackIgnore: true \*\//g' node_modules/@runanywhere/web-llamacpp/dist/Foundation/LlamaCppBridge.js
  sed -i 's/\/\* @vite-ignore \*\//\/\* webpackIgnore: true \*\//g' node_modules/@runanywhere/web-onnx/dist/Foundation/SherpaONNXBridge.js
  sed -i 's/\/\* @vite-ignore \*\//\/\* webpackIgnore: true \*\//g' node_modules/@runanywhere/web-onnx/dist/Foundation/SherpaHelperLoader.js
fi
echo "✓ Patched WASM imports"

echo "WASM files copied and patched successfully!"
