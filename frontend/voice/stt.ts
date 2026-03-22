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
  const trimmed = text.trim();
  
  // Check for known hallucination patterns
  for (const pattern of HALLUCINATION_PATTERNS) {
    if (pattern.test(trimmed)) return '';
  }
  
  // Too short to be meaningful speech (< 2 characters)
  if (trimmed.length < 2) return '';
  
  return trimmed;
}

export async function transcribeAudio(audioData: Float32Array): Promise<string> {
  try {
    const stt: any = ExtensionPoint.requireProvider('stt', '@runanywhere/web-onnx');
    const sttResult = await stt.transcribe(audioData, {
      sampleRate: 16000,
      language: 'en',       // Pin to English to reduce multilingual confusion errors
      suppressBlank: true,  // Skip blank/silent segments
      noSpeechThreshold: 0.6, // Higher threshold = more aggressive noise suppression
    });
    
    const raw = sttResult.text ?? '';
    return cleanTranscript(raw);
  } catch (error) {
    console.error('STT Transcription Error:', error);
    throw error;
  }
}
