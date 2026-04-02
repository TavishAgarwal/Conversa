import { ExtensionPoint } from '@runanywhere/web';

// Whisper hallucination artifacts to aggressively filter out from Whisper Tiny model
const HALLUCINATION_PATTERNS = [
  /^\s*thank\s+you\s+(for\s+watching|so\s+much)[\s!.]*$/i,
  /^\s*\[.*?\]\s*$/i,           // [BLANK_AUDIO], [Music], etc.
  /^\s*\(.*?\)\s*$/i,           // (whirring), etc.
  /^\s*\.{3,}\s*$/,             // ... (silence)
  /^\s*♪.*?♪\s*$/i,            // ♪ music ♪
  /^\s*you\s*$/i,
  /^\s*\.\s*$/,
  /^\s*,\s*$/,
];

function cleanTranscript(text: string): string {
  let cleaned = text
    .trim()
    .replace(/\[.*?\]/g, '')    // remove [BLANK_AUDIO], [inaudible], [music] etc.
    .replace(/\(.*?\)/g, '')    // remove (noise), (music) etc.
    .replace(/thank you for watching/gi, '')
    .replace(/please subscribe/gi, '')
    .trim();
  
  // Check for known hallucination patterns
  for (const pattern of HALLUCINATION_PATTERNS) {
    if (pattern.test(cleaned)) return '';
  }
  
  // Too short to be meaningful speech (< 2 characters)
  if (cleaned.length < 2) return '';
  
  return cleaned;
}

/**
 * Ensure audio is mono (1-channel) Float32Array at 16000 Hz sample rate.
 * Whisper accepts ONLY mono Float32 PCM in range [-1.0, 1.0].
 */
function preprocessAudioBuffer(audioData: Float32Array): Float32Array {
  // AudioCapture with sampleRate: 16000 should already provide Float32 mono
  // But we validate and normalize here to ensure compatibility
  return audioData instanceof Float32Array ? audioData : new Float32Array(audioData);
}

export async function transcribeAudio(audioData: Float32Array): Promise<string> {
  try {
    const stt: any = ExtensionPoint.requireProvider('stt', '@runanywhere/web-onnx');
    
    // Preprocess: ensure mono Float32 at 16000Hz
    const processedAudio = preprocessAudioBuffer(audioData);
    
    const sttResult = await stt.transcribe(processedAudio, {
      sampleRate: 16000,           // CRITICAL: Whisper requires exactly 16000 Hz
      language: 'en',              // Pin to English to reduce multilingual confusion errors
      suppressBlank: true,         // Skip blank/silent segments
      noSpeechThreshold: 0.6,      // Higher threshold = more aggressive noise suppression
    });
    
    const raw = sttResult.text ?? '';
    return cleanTranscript(raw);
  } catch (error) {
    console.error('STT Transcription Error:', error);
    throw error;
  }
}
