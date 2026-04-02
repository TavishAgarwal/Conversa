# Conversa Codebase Evaluation Report

## 1. Project Overview
**Conversa** is a Next.js-based web application providing a fully offline, voice-first AI assistant. It processes Speech-to-Text (STT), Large Language Model (LLM) reasoning, and Text-to-Speech (TTS) entirely on the client's device directly within the browser, ensuring zero data egress or cloud dependency.

### Technology Stack:
- **Framework:** Next.js 16.2.0 (React 19) App Router
- **Styling:** Tailwind CSS (v4), Radix UI, Class variance authority (clsx, tailwind-merge)
- **Local AI execution:** `@runanywhere/web`, `@runanywhere/web-llamacpp`, `@runanywhere/web-onnx` (WASM/WebGPU)
- **Charts / Visualizations:** `recharts`
- **Data Storage:** Uses Browser `IndexedDB` for conversation memory.
- **Service Workers:** Used for caching and optimizing offline access and potentially WASM module delivery.

### Boot Process Architecture:
1. `app/page.tsx` renders the main client wrapper (`ConversaApp`), managing app states (`modelsReady`, tabs).
2. The UI intercepts interactions with a boot screen, triggering `loadLLM()` from `frontend/llm/model.ts`.
3. `loadLLM()` downloads and natively mounts three core processing models via `ModelManager`: `lfm2-350m-q4_k_m` (Fast LLM), `sherpa-onnx-whisper-tiny.en` (STT), `vits-piper-en_US-lessac-medium` (TTS), and `silero-vad-v5` (Voice Activity Detection).
4. Simultaneously, it lazy loads the smarter `1.2B` param LLM model in the background.
5. Once core models load, the primary UI unlocks (`VoiceUI.tsx`) and the user can invoke the STT/LLM/TTS pipeline (`frontend/voice/pipeline.ts`).

## 2. Current Features
- **Working Components:**
  - Complete STT -> LLM -> TTS pipeline functionality using lightweight ONNX/Llama.cpp models.
  - VAD (Voice Activity Detection): Working, intercepts mic blobs to trigger STT processing (`frontend/voice/vad.ts`).
  - LLM Local Logic & Model Switcher: Hybrid model lazy-loading. Fallback fast 350M parameters to lazy loaded 1.2B parameters.
  - Persona System System Prompts (`frontend/llm/prompt.ts`) and conversation memory in IndexedDB (`frontend/storage/memory.ts`).
  - TTS audio synthesizer queuing (`ttsQueue`) mechanism mapping streamed sentences concurrently (`frontend/voice/pipeline.ts`).
- **Partially Working / Unrefined Components:**
  - Tasks Management: `create_task` tool-call parser operates partially, saving to React state and `localStorage`, but it intercepts tasks based on raw JSON regex in an unstable manner.
  - The hallucination filtering for Whisper STT is primitive (hardcoded regex for "Thank you for watching" etc).
- **Broken / Missing Components:**
  - Missing offline capability despite Service Worker code due to lack of a functional `next-pwa` configuration or generated manifest map.

## 3. Bugs Found

| Description | File Location | Root Cause | Proposed Fix |
|-------------|---------------|------------|--------------|
| Concurrent Event Listeners Warning in PlayQueue | `frontend/voice/pipeline.ts` | The consumer loop `playQueuePromise` awaits a dynamic `setTimeout(r, 50)` tick polling for standard array shifts instead of a proper async queue construct. | Implement an async Mutex or standard streaming Queue iterators instead of spin-locking arrays in a while loop. |
| Memory Storage Size Exceed | `frontend/storage/memory.ts` | The storage does not have an eviction policy beyond limiting output fetch (`getRecentContext`), so IndexedDB will grow indefinitely given LLM histories. | Implement message trimming inside `addMessage` or on DB initialization to limit total DB rows. |
| Tool Parsing Fragility | `frontend/voice/pipeline.ts` | Relies on token bracing tracking (`braceDepth`) over the raw text stream which easily breaks if the LLM hallucinate braces `{` in natural speaking text. | Use strict grammar files (GBNF) for Llama.cpp for structured tool outputs. |
| Synthesize Audio Promise leak | `frontend/voice/tts.ts` | Fallback fake resolve duration relies entirely on an uncancelled timeout if fallback kicks in. | Ensure cleanup logic clears the timeout during interrupts. |

## 4. Code Quality Issues
- **Type Safety (`any` usage):** Widespread usage of `any` across the core extensions (e.g., `const stt: any = ExtensionPoint.requireProvider('stt', '@runanywhere/web-onnx')` in `voice/stt.ts` and `const textGen: any` in `pipeline.ts`).
- **Missing Loading States:** While `page.tsx` has global loading, granular loading states for task modifications or IndexedDB retrievals are missing in the respective UI components.
- **Hardcoded values:** STT Confidence minimum, VAD threshold silences, and System Prompts are hardcoded in the primary scripts (`stt.ts`, `vad.ts`, `prompt.ts`) rather than abstracted to a config accessible by user settings.
- **ESlint Config:** Project lacks a functional strict ESLint setup compatible with React 19 / Next 16 v10 structures.

## 5. Missing Features (Given the Architecture)
- **Audio Worklet for VAD:** Right now, VAD relies on simple RMS polling inside `vad.ts`. Need to implement an actual Web Audio API `AudioWorklet` processor for non-blocking VAD chunking. *Difficulty: Medium*. Mod point: `frontend/voice/vad.ts`.
- **System Theme Sync:** The UI is hardcoded to `<html class="dark">` in `layout.tsx` without reading user OS preference. *Difficulty: Easy*. Mod point: `app/layout.tsx` + `theme-provider.tsx` injection.
- **Microphone Permissions Error State:** If the user denies mic access, `vad.ts` throws a native error that is barely handled by `useVoiceAgent`, leaving the UI in a confused idle state without an actionable "Grant Permission" prompt. *Difficulty: Medium*. Mod point: `frontend/ui/VoiceUI.tsx` and `vad.ts`.

## 6. Performance Issues
- **Memory Leaks:** `activePlayer` instances inside `pipeline.ts` are heavily reliant on garbage collection. Disconnecting Web Audio Nodes requires explicit `.disconnect()` which is missed for interrupted streams.
- **Inefficient Polling:** `playQueuePromise` in `pipeline.ts` runs a spin loop on the main thread `await new Promise(r => setTimeout(r, 50))` while waiting for TS chunks.
- **React Renders:** `useVoiceAgent` returns a hook heavily mutating multiple states continuously upon `requestAnimationFrame`-style token updates. State object splitting should be applied here to prevent re-rendering the whole UI on every LLM token.

## 7. Security & Privacy
- **Microphone Permissions:** Cleanly implemented via `navigator.mediaDevices` inside `@runanywhere`, but lacks pre-flight clarity. Requires strict OS-level consent.
- **OPFS and Data Escapes:** Data uses IndexedDB which is locally sound, but relies optionally on localStorage (`conversa-tasks`). Both are susceptible to XSS if user text is unsafely rendered in tasks, but React mitigates the immediate DOM XSS. 
- **Privacy Core:** 100% Offline AI. No cloud egress logs exist in the repository architecture.

## 8. Summary Score

| Category | Score | Notes |
|----------|-------|-------|
| Functionality | 8/10 | Core pipeline of local offline speech runs seamlessly but tasks feature relies on brittle token generation. |
| Code Quality | 6/10 | Use of `any`, spin-lock queue patterns, and missing error boundary configurations limits growth. |
| UX Output | 8/10 | Tailwind+Radix base provides smooth design. Missing granular Mic error states. |
| Performance | 7/10 | Excellent local model orchestration but poor token-state reactivity loops. |
| **Overall** | **7.25/10** | A highly functional proof-of-concept ready for production hardening. |

**Priority Fixes:**
1. Fix the `braceDepth` json stream tool parser fragility.
2. Replace spinlocks (`setTimeout`) in TTS streaming queues.
3. Manage indexedDB history evictions to prevent eventual storage exhaustion.
