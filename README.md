# Conversa: 100% Offline Voice Assistant

<div align="center">
  <p><strong>Voice conversations with AI — entirely on your device. Zero cloud. Zero cost. Zero compromise on privacy.</strong></p>
  <p><em>Built for HackXtreme 2026 @ Microsoft</em></p>
</div>

---

## 🌟 Why Conversa?

In a world dependent on cloud APIs and expensive subscriptions, **Conversa** brings the power of voice-first conversational AI directly to your local device browser. 

- **100% Private**: Your audio is transcribed, processed, and synthesized directly in your browser. Audio never leaves your device.
- **Lightning Fast**: Near-zero latency thanks to the complete elimination of network roundtrips. Hardware-accelerated WebAssembly and WebGPU ensure native-like performance.
- **Offline Capable**: Works anywhere, anytime. Models are securely cached locally via the Origin Private File System (OPFS), requiring an internet connection only for the very first initialization.

## ✨ Key Features

- **Full Local Voice Pipeline**: Complete end-to-end processing with STT (Whisper), LLM (LFM2), and TTS (Piper), featuring real-time streaming responses and fluid interrupt handling.
- **Hybrid System & Tool Calling**: 
  - ⚡ **Fast Mode (LFM2 350M, default)**: Near-instant responses for general conversational flow.
  - 🧠 **Smart Mode (LFM2 1.2B)**: Background-loaded powerhouse optimized for complex reasoning and seamless **Tool Calling & Execution**.
- **Robust Local Infrastructure**: Persistent conversational memory via IndexedDB, visibly integrated `@runanywhere/web` SDK, and active anti-hallucination guardrails.

## 🏗️ Technical Architecture

Conversa leverages the powerful `@runanywhere/web` SDK to seamlessly execute advanced neural networks locally within the browser context.

```
[ Your Voice / Mic ] 
        │ 
        ▼ 
┌───────────────┐     ┌───────────────┐     ┌───────────────┐
│  Sherpa ONNX  │     │   Llama.cpp   │     │  Sherpa ONNX  │
│  (VAD & STT)  ├────►│ (LLM Engine)  ├────►│     (TTS)     │
└───────────────┘     └───────────────┘     └───────────────┘
        │                     │                     │
  Detect Speech        Process Context      Synthesize Voice &
        &               via WebGPU              Play Audio
  Transcribe text
```

### 💻 Stack
- **Framework:** Next.js 16 (App Router), React 19
- **Styling & UI:** Tailwind CSS, shadcn/ui components
- **AI Backend SDKs:** `@runanywhere/web`, `@runanywhere/web-llamacpp`, `@runanywhere/web-onnx`
- **Models:**
  - **LLM:** `lfm2-350m-q4_k_m`
  - **STT:** `sherpa-onnx-whisper-tiny.en`
  - **TTS:** `vits-piper-en_US-lessac-medium`
  - **VAD:** `silero-vad-v5`

## 🚀 Quick Start

### 1. Requirements
- A modern WebGPU-compatible browser: **Chrome 120+** or **Edge 120+**.
- **WebAssembly** & **SharedArrayBuffer** support (the Next.js server handles providing the required Cross-Origin Isolation headers automatically).

### 2. Run the App Locally
Clone the repository and install the dependencies:

```bash
npm install
```

Start the Next.js development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser. The models will automatically begin caching into your OPFS storage on launch!

---

*Conversa: Redefining digital assistants through local edge computing.*
