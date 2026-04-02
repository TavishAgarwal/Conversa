# Conversa - Implementation Reference Guide

## Quick Start for Developers

This document provides a quick reference for the 13 fixes applied to resolve critical issues.

---

## 1. No More Hardcoded Responses

**Before:**
```typescript
// ❌ REMOVED - This was intercepting real queries
function getDemoOverrideStream(transcript: string) {
  if (transcript.includes("robotics")) {
    return fakeStream("The Three Laws...");
  }
}
```

**After:**
```typescript
// ✅ ONLY real LLM responses
const result = await textGen.generateStream(fullPrompt, genConfig);
const stream = result.stream;
```

---

## 2. Streaming Token Handling

**Already Correct - No Changes Needed**
```typescript
// ✅ Each token immediately updates UI
for await (const token of stream) {
  fullResponse += token;
  callbacks.onLLMToken(token);  // ← Real-time UI update
}
```

---

## 3. No Empty Response Fallbacks

**Before:**
```typescript
// ❌ REMOVED - Misleading fallback
if (fullResponse.trim().length === 0) {
  fullResponse = "I'm sorry, I didn't quite catch that...";
  callbacks.onLLMToken(fullResponse);
}
```

**After:**
```typescript
// ✅ Just complete normally
if (!this.isCancelled) {
  callbacks.onLLMComplete(fullResponse);
  await memory.addMessage({ role: 'assistant', content: fullResponse });
}
```

---

## 4. Clean Error Handling

**Before:**
```typescript
// ❌ REMOVED - Synthesizing fake error messages
} catch (e) {
  const errorMsg = "I'm sorry, I encountered a temporary issue...";
  callbacks.onLLMToken(errorMsg);
  await synthesizeAudio(errorMsg);
}
```

**After:**
```typescript
// ✅ Clean error reporting
} catch (e) {
  console.error('Pipeline Error:', e);
  callbacks.onError(e as Error);  // ← Let UI handle error display
}
```

---

## 5. Stop Button (Already Working)

```typescript
// ✅ Already wired correctly
public interrupt() {
  this.isCancelled = true;
  if (this.activeCancel) {
    this.activeCancel();  // ← Stops LLM generation
  }
}

// Called from FloatingControls
<button onClick={onInterrupt}>Stop</button>
```

---

## 6. Model Loading (Already Correct)

```typescript
// ✅ Wait for all models before UI active
if (isLLMLoaded()) {
  setModelsReady(true);
} else {
  await loadLLM((progress) => setLoadProgress(progress));
  setModelsReady(true);
}

// ✅ VoiceUI only renders when ready
{!modelsReady ? <LoadingScreen /> : <VoiceUI />}
```

---

## 7. CRITICAL: Audio Sample Rate 16000 Hz

**VAD (Voice Activity Detector):**
```typescript
// ✅ CRITICAL: Capture at exactly 16000 Hz
this.mic = new AudioCapture({ sampleRate: 16000 });
```

**STT (Speech-to-Text):**
```typescript
// ✅ CRITICAL: Tell Whisper to use 16kHz
const sttResult = await stt.transcribe(processedAudio, {
  sampleRate: 16000,  // ← MUST match audio format
  language: 'en',
  suppressBlank: true,
});
```

**Why This Matters:**
- Whisper (and most STT models) expect EXACTLY 16000 Hz
- 44100 Hz → Gibberish output
- 48000 Hz → Gibberish output
- 8000 Hz → Gibberish output
- **Only 16000 Hz works correctly**

---

## 8. Stereo to Mono Conversion

**Audio Preprocessing:**
```typescript
function preprocessAudioBuffer(audioData: Float32Array): Float32Array {
  // ✅ AudioCapture already provides mono at 16kHz
  // Validate and normalize just in case
  return audioData instanceof Float32Array ? audioData : new Float32Array(audioData);
}

// ✅ Use channel 0 only (don't average stereo channels)
const monoData = audioBuffer.getChannelData(0);
```

---

## 9. Audio Buffer Format: Float32 [-1.0, 1.0]

**Format Requirements:**
```typescript
// ✅ CORRECT: Float32Array with values in [-1.0, 1.0]
const float32 = new Float32Array(samples);  // ← Correct

// ❌ WRONG: Int16 or Uint8 → Gibberish
const int16 = new Int16Array(samples);  // ← Wrong!

// ✅ If converting from Int16:
const float32 = new Float32Array(int16Buffer.length);
for (let i = 0; i < int16Buffer.length; i++) {
  float32[i] = int16Buffer[i] / 32768.0;  // ← Scale to [-1.0, 1.0]
}
```

---

## 10. STT Language and Accuracy

**Configuration:**
```typescript
const sttResult = await stt.transcribe(audioData, {
  sampleRate: 16000,           // ✅ Exact Hz
  language: 'en',              // ✅ Pin to English (not auto-detect)
  suppressBlank: true,         // ✅ Skip silence
  noSpeechThreshold: 0.6,      // ✅ Aggressive noise suppression
});
```

**Why This Works:**
- Auto-detect language is unreliable for short phrases
- English pinning prevents cross-language confusion
- Suppressing blanks reduces hallucinations
- Higher noise threshold filters background noise

---

## 11. STT Result Cleanup

**Pattern Removal:**
```typescript
function cleanTranscript(text: string): string {
  let cleaned = text
    .trim()
    .replace(/\[.*?\]/g, '')    // ✅ Remove [BLANK_AUDIO], [music], etc.
    .replace(/\(.*?\)/g, '')    // ✅ Remove (noise), (music), etc.
    .replace(/thank you for watching/gi, '')
    .replace(/please subscribe/gi, '')
    .trim();
  
  // ✅ Check hallucination patterns
  for (const pattern of HALLUCINATION_PATTERNS) {
    if (pattern.test(cleaned)) return '';
  }
  
  // ✅ Too short = likely false positive
  if (cleaned.length < 2) return '';
  
  return cleaned;
}
```

**Common Hallucinations Filtered:**
- `[BLANK_AUDIO]` - Whisper thinks silence is a label
- `(music)`, `(noise)` - Annotated sounds
- "Thank you for watching" - YouTube intro/outro
- "Please subscribe" - YouTube outro
- Single letters or punctuation - False positives

---

## 12. VAD Silence Wait - Prevent Early Cutoff

**Before:**
```typescript
// ❌ REMOVED - Cut off end of speech
} else if (activity === SpeechActivity.Ended) {
  const segment = RunAnywhereVAD.popSpeechSegment();
  callbacks.onSpeechEnd?.(segment.samples);  // ← Too fast!
}
```

**After:**
```typescript
// ✅ Wait for post-speech silence
} else if (activity === SpeechActivity.Ended) {
  // Wait 800-1200ms for speech to truly end
  setTimeout(() => {
    const segment = RunAnywhereVAD.popSpeechSegment();
    if (segment && segment.samples.length > 1600) {
      callbacks.onSpeechEnd?.(segment.samples);  // ← Full speech!
    }
  }, 1000);  // ← 1 second silence wait
}
```

**Why 1000ms?**
- Speech naturally has pauses (300-500ms)
- Final consonants/affricatives take time (~200-300ms)
- 1000ms ensures words like "test" aren't cut to "tes"
- Browser event latency adds buffer time

---

## 13. STT Result Display in UI

**Immediate Display:**
```typescript
// ✅ Show transcript immediately
onTranscript: (text) => {
  setAiText('');  // Clear previous turn
  setUserText(text);  // ← Show user's words first
},

// ✅ Add to memory
await memory.addMessage({ role: 'user', content: transcript });

// ✅ THEN send to LLM
const result = await textGen.generateStream(fullPrompt, genConfig);
```

**Timeline:**
1. User speaks → Captured at 16kHz
2. VAD waits 1000ms → Confirms end of speech
3. Audio processed → Sent to STT
4. STT returns text → Cleaned of hallucinations
5. **UI Updated** → User sees their words ← **KEY!**
6. LLM starts generating → User sees "Thinking..."
7. Response streams → Tokens appear in real-time

---

## Debugging Tips

### STT Producing Gibberish?
- [ ] Check audio sample rate (must be 16000 Hz)
- [ ] Check audio format (must be Float32)
- [ ] Check audio range (must be -1.0 to 1.0)
- [ ] Check if stereo was converted to mono
- [ ] Verify language is set to 'en'

### VAD Cutting Off Speech?
- [ ] Check post-silence timeout (should be 1000ms)
- [ ] Check if segment has minimum 1600 samples (~100ms at 16kHz)
- [ ] Verify VAD isn't triggering prematurely

### LLM Stuck/Hanging?
- [ ] Check model is actually loaded (`isLLMLoaded()`)
- [ ] Check for exceptions in stream iteration
- [ ] Verify cancel function is wired correctly
- [ ] Check for infinite loops in TTS queue

### Empty Responses?
- [ ] This is now expected - no fallback messages
- [ ] Check error handler is working
- [ ] Verify LLM model is loaded correctly

---

## Performance Notes

| Component | Typical Duration | Impact |
|-----------|------------------|--------|
| Audio capture | Continuous | Real-time |
| VAD processing | <50ms per chunk | Negligible |
| Post-silence wait | ~1000ms | User perceives as "listening" |
| STT processing | 500ms - 2s | Dependent on speech length |
| STT cleanup | <5ms | Negligible |
| LLM first token | 500ms - 2s | Dominant latency |
| Token streaming | 50-200ms per token | Visible in UI |
| TTS synthesis | 500ms - 3s | Dependent on response length |

---

## Monitoring Checklist

After deploying fixes, verify:

- [ ] First response is not a hardcoded demo message
- [ ] Multiple consecutive conversations work without state leakage
- [ ] "Stop" button immediately halts LLM generation
- [ ] STT transcriptions are displayed in UI before LLM response
- [ ] Whisper hallucinations ("[music]", "thank you", etc.) are filtered
- [ ] Short pauses in speech don't trigger partial transcriptions
- [ ] Errors are reported cleanly without fake fallback messages
- [ ] Model loads to 100% before voice button activates
- [ ] Streaming response updates in real-time (not batched)
- [ ] Long responses don't cause app to hang

---

## References

- [Whisper Audio Requirements](https://github.com/openai/whisper/blob/main/whisper/audio.py)
- [WebAudio API Sample Rates](https://developer.mozilla.org/en-US/docs/Web/API/AudioContext/sampleRate)
- [Sherpa ONNX Documentation](https://k2-fsa.github.io/sherpa/onnx/)
- [VAD (Voice Activity Detection) Principles](https://en.wikipedia.org/wiki/Voice_activity_detection)

---

## Version History

- **v1.0** (Apr 2, 2026): Initial 13-fix implementation
  - Removed hardcoded responses
  - Fixed STT audio sample rate
  - Fixed VAD silence timeout
  - Fixed error handling
  - Added comprehensive documentation

---

**Questions?** Refer to `FIXES_APPLIED.md` for detailed explanations of each fix.
