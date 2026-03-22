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

- **Local Voice Pipeline**: Features complete end-to-end processing incorporating **Voice Activity Detection (VAD)**, **Speech-to-Text (STT)**, and **Text-to-Speech (TTS)**.
- **On-Device LLM**: Powered by a highly-optimized 350M parameter foundation model running on your GPU seamlessly through the browser.
- **Dynamic Personas**: Seamlessly switch between _Productivity_, _Learning_, _Wellness_, _Language Tutor_, and _Cooking_ assistant modes, each featuring tailored system prompts and distinct behaviors.
- **Interactive UI**: Boasts a highly-polished Voice Orb visualization, immersive full-screen floating conversational controls, live scrolling subtitles, and an analytics dashboard tracking your interactions.
- **Anti-Hallucination Guardrails**: Equipped with specific intent routing and real-time knowledge guardrails to prevent confident hallucinations on unanswerable real-time queries (e.g., weather, time).

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
