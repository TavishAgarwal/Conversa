import { ExtensionPoint } from '@runanywhere/web';
import { transcribeAudio } from './stt';
import { synthesizeAudio, NativeAudioPlayer } from './tts';
import { SYSTEM_PROMPT, buildChatMLPrompt, parseToolCalls, GENERATION_CONFIG, getGenerationConfig, getPersonaPrompt, ToolCall } from '../llm/prompt';
import { selectModelId, type ModelMode } from '../llm/model';
import { memory } from '../storage/memory';

export type PipelineState = 'idle' | 'listening' | 'stt' | 'llm' | 'tts';

export interface PipelineTimings {
  sttMs: number;
  llmMs: number;
  llmTokens: number;
  llmTokensPerSec: number;
  ttsMs: number;
  totalMs: number;
}

export interface PipelineCallbacks {
  onStateChange: (state: PipelineState) => void;
  onTranscript: (text: string) => void;
  onLLMToken: (token: string) => void;
  onLLMComplete: (text: string) => void;
  onToolCall: (tool: ToolCall) => void;
  onTimings: (timings: PipelineTimings) => void;
  onSpeakingDone: () => void;
  onError: (error: Error) => void;
}

// Sentence boundary detection — matches . ! ? followed by whitespace or end of string
const SENTENCE_END_RE = /[.!?](\s|$)/;

export class VoicePipeline {
  private activeCancel: (() => void) | null = null;
  private activePlayer: NativeAudioPlayer | null = null;
  private isCancelled = false;

  public interrupt() {
    this.isCancelled = true;
    if (this.activeCancel) {
      this.activeCancel();
      this.activeCancel = null;
    }
    this._stopCurrentAudio();
  }

  private _stopCurrentAudio() {
    if (this.activePlayer) {
      try {
        this.activePlayer.stop();
      } catch (_) { /* ignore */ }
      this.activePlayer = null;
    }
  }

  private async _playSequentially(audioPlayers: NativeAudioPlayer[]): Promise<void> {
    for (const player of audioPlayers) {
      if (this.isCancelled) break;
      this.activePlayer = player;
      // Wait for audio to actually finish playing
      await player.waitForEnd();
    }
  }

  public async processTurn(audioData: Float32Array, callbacks: PipelineCallbacks, persona: string = 'productivity', modelMode: ModelMode = 'fast') {
    this.isCancelled = false;
    this.activeCancel = null;
    this._stopCurrentAudio();

    const turnStart = performance.now();
    let sttMs = 0;
    let llmMs = 0;
    let llmTokenCount = 0;
    let ttsMs = 0;

    try {
      // 1. STT
      callbacks.onStateChange('stt');
      const sttStart = performance.now();
      const transcript = await transcribeAudio(audioData);
      sttMs = performance.now() - sttStart;

      if (this.isCancelled || !transcript) {
        callbacks.onStateChange('idle');
        return;
      }
      callbacks.onTranscript(transcript);
      await memory.addMessage({ role: 'user', content: transcript });

      // 2. LLM + TTS — concurrent streaming: synthesize & play sentences as they arrive
      callbacks.onStateChange('llm');
      const llmStart = performance.now();
      const textGen: any = ExtensionPoint.requireProvider('llm', '@runanywhere/web-llamacpp');

      const history = await memory.getRecentContext(6);
      const systemPrompt = getPersonaPrompt(persona);
      const fullPrompt = buildChatMLPrompt(systemPrompt, transcript, history.slice(0, -1));

      const genConfig = getGenerationConfig(modelMode);
      const activeModelId = selectModelId(modelMode);
      const { stream, cancel } = await textGen.generateStream(fullPrompt, { ...genConfig, modelId: activeModelId });
      this.activeCancel = cancel;

      let fullResponse = '';
      let buffer = '';
      // Concurrent TTS queue system
      const ttsQueue: string[] = [];
      let llmDone = false;
      let firstTtsStarted = false;
      let ttsStartTime = 0;

      // Consumer: plays sentences from the queue as they arrive
      const playQueuePromise = (async () => {
        while (true) {
          if (ttsQueue.length > 0) {
            const sentence = ttsQueue.shift()!;
            if (this.isCancelled) break;

            if (!firstTtsStarted) {
              firstTtsStarted = true;
              ttsStartTime = performance.now();
              callbacks.onStateChange('tts');
            }

            this._stopCurrentAudio();
            const player = await synthesizeAudio(sentence);
            this.activePlayer = player;
            await player.waitForEnd();
          } else if (llmDone) {
            // Queue empty and LLM finished — we're done
            break;
          } else {
            // Wait briefly for more sentences to arrive
            await new Promise(r => setTimeout(r, 50));
          }
        }
      })();

      // Producer: stream tokens and detect sentence boundaries
      for await (const token of stream) {
        if (this.isCancelled) break;
        fullResponse += token;
        buffer += token;
        llmTokenCount++;
        callbacks.onLLMToken(token);

        // Check for sentence boundary — queue sentence for TTS immediately
        if (SENTENCE_END_RE.test(buffer)) {
          const sentence = buffer.trim();
          buffer = '';
          if (sentence.length > 0) {
            const { text: cleanSentence } = parseToolCalls(sentence);
            if (cleanSentence.length > 0) {
              ttsQueue.push(cleanSentence);
            }
          }
        }
      }

      llmMs = performance.now() - llmStart;

      // Handle remaining text in buffer
      if (buffer.trim().length > 0 && !this.isCancelled) {
        const { text: cleanTail } = parseToolCalls(buffer.trim());
        if (cleanTail.length > 0) {
          ttsQueue.push(cleanTail);
        }
      }

      // Signal producer is done and wait for consumer to finish
      llmDone = true;
      await playQueuePromise;

      ttsMs = firstTtsStarted ? performance.now() - ttsStartTime : 0;

      if (!this.isCancelled) {
        callbacks.onLLMComplete(fullResponse);
        await memory.addMessage({ role: 'assistant', content: fullResponse });

        const { tools } = parseToolCalls(fullResponse);
        for (const tool of tools) {
          callbacks.onToolCall(tool);
        }

        // Emit timings
        const totalMs = performance.now() - turnStart;
        callbacks.onTimings({
          sttMs: Math.round(sttMs),
          llmMs: Math.round(llmMs),
          llmTokens: llmTokenCount,
          llmTokensPerSec: llmMs > 0 ? Math.round((llmTokenCount / llmMs) * 1000 * 10) / 10 : 0,
          ttsMs: Math.round(ttsMs),
          totalMs: Math.round(totalMs),
        });

        callbacks.onStateChange('idle');
        callbacks.onSpeakingDone();
      }

    } catch (e) {
      console.error('Pipeline Error:', e);
      callbacks.onError(e as Error);
      callbacks.onStateChange('idle');
    }
  }

  /**
   * Like processTurn but skips STT — feeds text directly into LLM → TTS.
   * Used by the Quick Demo feature to drive the real pipeline programmatically.
   */
  public async processTextTurn(
    text: string,
    callbacks: PipelineCallbacks,
    persona: string = 'productivity',
    modelMode: ModelMode = 'fast'
  ) {
    this.isCancelled = false;
    this.activeCancel = null;
    this._stopCurrentAudio();

    const turnStart = performance.now();
    let llmMs = 0;
    let llmTokenCount = 0;
    let ttsMs = 0;

    try {
      // Skip STT — user text is already provided
      callbacks.onTranscript(text);
      await memory.addMessage({ role: 'user', content: text });

      // LLM + TTS — identical to processTurn
      callbacks.onStateChange('llm');
      const llmStart = performance.now();
      const textGen: any = ExtensionPoint.requireProvider('llm', '@runanywhere/web-llamacpp');

      const history = await memory.getRecentContext(6);
      const systemPrompt = getPersonaPrompt(persona);
      const fullPrompt = buildChatMLPrompt(systemPrompt, text, history.slice(0, -1));

      const genConfig = getGenerationConfig(modelMode);
      const activeModelId = selectModelId(modelMode);
      const { stream, cancel } = await textGen.generateStream(fullPrompt, { ...genConfig, modelId: activeModelId });
      this.activeCancel = cancel;

      let fullResponse = '';
      let buffer = '';
      const ttsQueue: string[] = [];
      let llmDone = false;
      let firstTtsStarted = false;
      let ttsStartTime = 0;

      const playQueuePromise = (async () => {
        while (true) {
          if (ttsQueue.length > 0) {
            const sentence = ttsQueue.shift()!;
            if (this.isCancelled) break;
            if (!firstTtsStarted) {
              firstTtsStarted = true;
              ttsStartTime = performance.now();
              callbacks.onStateChange('tts');
            }
            this._stopCurrentAudio();
            const player = await synthesizeAudio(sentence);
            this.activePlayer = player;
            await player.waitForEnd();
          } else if (llmDone) {
            break;
          } else {
            await new Promise(r => setTimeout(r, 50));
          }
        }
      })();

      for await (const token of stream) {
        if (this.isCancelled) break;
        fullResponse += token;
        buffer += token;
        llmTokenCount++;
        callbacks.onLLMToken(token);

        if (SENTENCE_END_RE.test(buffer)) {
          const sentence = buffer.trim();
          buffer = '';
          if (sentence.length > 0) {
            const { text: cleanSentence } = parseToolCalls(sentence);
            if (cleanSentence.length > 0) {
              ttsQueue.push(cleanSentence);
            }
          }
        }
      }

      llmMs = performance.now() - llmStart;

      if (buffer.trim().length > 0 && !this.isCancelled) {
        const { text: cleanTail } = parseToolCalls(buffer.trim());
        if (cleanTail.length > 0) {
          ttsQueue.push(cleanTail);
        }
      }

      llmDone = true;
      await playQueuePromise;

      ttsMs = firstTtsStarted ? performance.now() - ttsStartTime : 0;

      if (!this.isCancelled) {
        callbacks.onLLMComplete(fullResponse);
        await memory.addMessage({ role: 'assistant', content: fullResponse });

        const { tools } = parseToolCalls(fullResponse);
        for (const tool of tools) {
          callbacks.onToolCall(tool);
        }

        const totalMs = performance.now() - turnStart;
        callbacks.onTimings({
          sttMs: 0,
          llmMs: Math.round(llmMs),
          llmTokens: llmTokenCount,
          llmTokensPerSec: llmMs > 0 ? Math.round((llmTokenCount / llmMs) * 1000 * 10) / 10 : 0,
          ttsMs: Math.round(ttsMs),
          totalMs: Math.round(totalMs),
        });

        callbacks.onStateChange('idle');
        callbacks.onSpeakingDone();
      }

    } catch (e) {
      console.error('Pipeline Error (text turn):', e);
      callbacks.onError(e as Error);
      callbacks.onStateChange('idle');
    }
  }
}
