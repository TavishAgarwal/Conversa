import { AudioCapture, SpeechActivity } from '@runanywhere/web';
import { VAD as RunAnywhereVAD } from '@runanywhere/web-onnx';

export class VoiceActivityDetector {
  private isListening = false;
  private mic: AudioCapture | null = null;
  private vadUnsubscribe: (() => void) | null = null;

  async start(callbacks: {
    onSpeechStart?: () => void;
    onSpeechEnd?: (audio: Float32Array) => void;
    onAudioLevel?: (level: number) => void;
    onError?: (error: Error) => void;
  }): Promise<void> {
    if (this.isListening) return;

    try {
      RunAnywhereVAD.reset();
      this.mic = new AudioCapture({ sampleRate: 16000 });

      this.vadUnsubscribe = RunAnywhereVAD.onSpeechActivity((activity) => {
        if (activity === SpeechActivity.Started) {
          callbacks.onSpeechStart?.();
        } else if (activity === SpeechActivity.Ended) {
          const segment = RunAnywhereVAD.popSpeechSegment();
          if (segment && segment.samples.length > 1600) {
            callbacks.onSpeechEnd?.(segment.samples);
          }
        }
      });

      await this.mic.start(
        (chunk) => {
          RunAnywhereVAD.processSamples(chunk);
          
          // Compute RMS audio level for visualisation
          if (callbacks.onAudioLevel && chunk.length > 0) {
            let sum = 0;
            for (let i = 0; i < chunk.length; i++) {
              sum += chunk[i] * chunk[i];
            }
            const rms = Math.sqrt(sum / chunk.length);
            // Normalise to 0–1 range (typical mic RMS is 0–0.3)
            const level = Math.min(1, rms / 0.15);
            callbacks.onAudioLevel(level);
          }
        },
        () => {}
      );
      this.isListening = true;
    } catch (error) {
      callbacks.onError?.(error as Error);
    }
  }

  stop(): void {
    if (!this.isListening) return;

    if (this.mic) {
      this.mic.stop();
      this.mic = null;
    }

    if (this.vadUnsubscribe) {
      this.vadUnsubscribe();
      this.vadUnsubscribe = null;
    }

    RunAnywhereVAD.reset();
    this.isListening = false;
  }

  isActive(): boolean {
    return this.isListening;
  }
}
