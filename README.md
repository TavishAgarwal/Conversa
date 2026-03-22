# Conversa

Voice conversations with AI — 100% on your device. Zero cloud. Zero cost. Zero compromise on privacy.

## Why Conversa?

In a world dependent on cloud APIs and expensive subscriptions, Conversa brings the power of voice-first conversational AI directly to your local device.

- **Offline**: Works anywhere, anytime. No internet connection required once initialized.
- **Private**: All audio and text processing happens directly in your browser. Audio never leaves your device.
- **Fast**: Near-zero latency since there is no network overhead for streaming responses and generating speech.

## How it works

Conversa leverages WebAssembly to run advanced neural networks locally within the browser:

```
[ Your Voice ] 
       │ 
       ▼ 
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  Sherpa ONNX │     │  Llama.cpp   │     │  Sherpa ONNX │
│  (VAD & STT) ├────►│  (LLM Engine)├────►│     (TTS)    │
└──────────────┘     └──────────────┘     └──────────────┘
       │                    │                    │
  Detect Speech       Process Context       Synthesize Voice
```

1. **VAD & STT**: Voice Activity Detection intelligently listens, and Offline Speech-to-Text transcribes your spoken words.
2. **LLM**: Your transcribed request alongside conversation context is sent to a localized language model. 
3. **TTS**: The text response is streamed into our Text-to-Speech Engine and played back dynamically.

## Quick Start

Initialize and run the development server:

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173). 

## Browser Requirements

- Chrome 96+ or Edge 96+ (recommended: 120+)
- WebAssembly (required)
- SharedArrayBuffer (requires Cross-Origin Isolation headers)
- OPFS (for persistent model cache)

---
*Built for HackXtreme 2026 @ Microsoft*
