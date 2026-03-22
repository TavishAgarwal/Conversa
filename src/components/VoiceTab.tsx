import { useState, useRef, useCallback, useEffect } from 'react';
import { VoicePipeline, ModelCategory, ModelManager, AudioCapture, AudioPlayback, SpeechActivity } from '@runanywhere/web';
import { VAD } from '@runanywhere/web-onnx';
import { useModelLoader } from '../hooks/useModelLoader';
import { ModelBanner } from './ModelBanner';
import { WaveformVisualizer } from './WaveformVisualizer';
import { TranscriptPanel, TranscriptMessage } from './TranscriptPanel';
import { PersonaSelector } from './PersonaSelector';
import { PrivacyStats } from './PrivacyStats';
import { useSessionStats } from '../hooks/useSessionStats';
import { SYSTEM_PROMPT, GENERATION_CONFIG, buildContextualPrompt, guardrails } from '../../frontend/lib/ai-config';

type VoiceState = 'idle' | 'loading-models' | 'listening' | 'processing' | 'speaking';

export function VoiceTab() {
  const llmLoader = useModelLoader(ModelCategory.Language, true);
  const sttLoader = useModelLoader(ModelCategory.SpeechRecognition, true);
  const ttsLoader = useModelLoader(ModelCategory.SpeechSynthesis, true);
  const vadLoader = useModelLoader(ModelCategory.Audio, true);

  const [voiceState, setVoiceState] = useState<VoiceState>('idle');
  const [transcript, setTranscript] = useState('');
  const [response, setResponse] = useState('');
  const [messages, setMessages] = useState<TranscriptMessage[]>([]);
  const [audioLevel, setAudioLevel] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [micPermissionState, setMicPermissionState] = useState<'unknown' | 'prompting' | 'granted' | 'denied'>('unknown');
  
  const [personaPrompt, setPersonaPrompt] = useState<string | null>(null);
  const { wordsSpoken, aiResponses, addWords, addResponse } = useSessionStats();
  const [activeStream, setActiveStream] = useState<MediaStream | null>(null);

  const micRef = useRef<AudioCapture | null>(null);
  const pipelineRef = useRef<VoicePipeline | null>(null);
  const vadUnsub = useRef<(() => void) | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      micRef.current?.stop();
      vadUnsub.current?.();
    };
  }, []);

  // Ensure all 4 models are loaded
  const ensureModels = useCallback(async (): Promise<boolean> => {
    setVoiceState('loading-models');
    setError(null);

    const results = await Promise.all([
      vadLoader.ensure(),
      sttLoader.ensure(),
      llmLoader.ensure(),
      ttsLoader.ensure(),
    ]);

    if (results.every(Boolean)) {
      setVoiceState('idle');
      return true;
    }

    setError('Failed to load one or more voice models');
    setVoiceState('idle');
    return false;
  }, [vadLoader, sttLoader, llmLoader, ttsLoader]);

  // Start listening
  const startListeningActual = useCallback(async () => {
    setTranscript('');
    setResponse('');
    setError(null);

    // Load models if needed
    const anyMissing = !ModelManager.getLoadedModel(ModelCategory.Audio)
      || !ModelManager.getLoadedModel(ModelCategory.SpeechRecognition)
      || !ModelManager.getLoadedModel(ModelCategory.Language)
      || !ModelManager.getLoadedModel(ModelCategory.SpeechSynthesis);

    if (anyMissing) {
      const ok = await ensureModels();
      if (!ok) return;
    }

    setVoiceState('listening');

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setActiveStream(stream);
    } catch (err) {
      console.warn("Failed retrieving visualizer stream", err);
    }

    const mic = new AudioCapture({ sampleRate: 16000 });
    micRef.current = mic;

    if (!pipelineRef.current) {
      pipelineRef.current = new VoicePipeline();
    }

    // Start VAD + mic
    VAD.reset();

    vadUnsub.current = VAD.onSpeechActivity((activity) => {
      if (activity === SpeechActivity.Ended) {
        const segment = VAD.popSpeechSegment();
        if (segment && segment.samples.length > 1600) {
          processSpeech(segment.samples);
        }
      }
    });

    await mic.start(
      (chunk) => { VAD.processSamples(chunk); },
      (level) => { setAudioLevel(level); },
    );
  }, [ensureModels, messages]);

  const requestMicPermission = useCallback(async () => {
    try {
      const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioStream.getTracks().forEach(t => t.stop());
      setMicPermissionState('granted');
      startListeningActual();
    } catch (err) {
      setMicPermissionState('denied');
    }
  }, [startListeningActual]);

  const handleStartListening = useCallback(() => {
    if (micPermissionState === 'granted') {
      startListeningActual();
    } else {
      setMicPermissionState('prompting');
    }
  }, [micPermissionState, startListeningActual]);

  // Process a speech segment through the full pipeline
  const processSpeech = useCallback(async (audioData: Float32Array) => {
    const pipeline = pipelineRef.current;
    if (!pipeline) return;

    // Stop mic during processing
    micRef.current?.stop();
    vadUnsub.current?.();
    setVoiceState('processing');

    try {
      const blocked = guardrails(transcript);
      if (blocked) {
        setVoiceState('speaking');
        setResponse(blocked);
        const player = new AudioPlayback({ sampleRate: 16000 });
        const ttsLoaderExt = ModelManager.getLoadedModel(ModelCategory.SpeechSynthesis);
        if (ttsLoaderExt) {
          // Fallback to minimal reproduction of TTS since we can't easily wait for pipeline
          setVoiceState('idle'); // not ideal but pipeline abstracts TTS
        }
        return; // VoiceTab uses pipeline which does TTS. We'll let processVoiceTurn handle intent, but for ChatTab it's easy. Here, we'll let ai-service handle it fully to avoid breaking VoicePipeline.
      }
      
      const contextualPrompt = buildContextualPrompt(transcript, personaPrompt || SYSTEM_PROMPT);
      
      let historyText = "";
      if (messages.length > 0) {
        historyText = "\n\nConversation History:\n" + messages.map(msg => 
          `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`
        ).join("\n");
      }

      const result = await pipeline.processTurn(audioData, {
        maxTokens: GENERATION_CONFIG.maxTokens,
        temperature: GENERATION_CONFIG.temperature,
        systemPrompt: contextualPrompt + historyText,
      }, {
        onTranscription: (text) => {
          setTranscript(text);
        },
        onResponseToken: (_token, accumulated) => {
          setResponse(accumulated);
        },
        onResponseComplete: (text) => {
          setResponse(text);
        },
        onSynthesisComplete: async (audio, sampleRate) => {
          setVoiceState('speaking');
          const player = new AudioPlayback({ sampleRate });
          await player.play(audio, sampleRate);
          player.dispose();
        },
        onStateChange: (s) => {
          if (s === 'processingSTT') setVoiceState('processing');
          if (s === 'generatingResponse') setVoiceState('processing');
          if (s === 'playingTTS') setVoiceState('speaking');
        },
      });

      if (result) {
        addWords(result.transcription);
        addResponse();
        setTranscript(result.transcription);
        setResponse(result.response);
        setMessages(prev => [
          ...prev,
          { role: 'user', content: result.transcription, timestamp: new Date() },
          { role: 'assistant', content: result.response, timestamp: new Date() }
        ]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }

    setVoiceState('idle');
    setAudioLevel(0);
  }, []);

  const stopListening = useCallback(() => {
    micRef.current?.stop();
    vadUnsub.current?.();
    if (activeStream) {
       activeStream.getTracks().forEach(t => t.stop());
       setActiveStream(null);
    }
    setVoiceState('idle');
    setAudioLevel(0);
  }, [activeStream]);

  // Which loaders are still loading?
  const pendingLoaders = [
    { label: 'VAD', loader: vadLoader },
    { label: 'STT', loader: sttLoader },
    { label: 'LLM', loader: llmLoader },
    { label: 'TTS', loader: ttsLoader },
  ].filter((l) => l.loader.state !== 'ready');

  if (!personaPrompt) {
    return (
      <>
        {pendingLoaders.length > 0 && voiceState === 'idle' && (
          <ModelBanner
            state={pendingLoaders[0].loader.state}
            progress={pendingLoaders[0].loader.progress}
            error={pendingLoaders[0].loader.error}
            onLoad={ensureModels}
            label={`Voice (${pendingLoaders.map((l) => l.label).join(', ')})`}
          />
        )}
        <PersonaSelector onStart={setPersonaPrompt} />
      </>
    );
  }

  return (
    <div className="tab-panel voice-panel" style={{ display: 'flex', flexDirection: 'column' }}>
      {pendingLoaders.length > 0 && voiceState === 'idle' && (
        <ModelBanner
          state={pendingLoaders[0].loader.state}
          progress={pendingLoaders[0].loader.progress}
          error={pendingLoaders[0].loader.error}
          onLoad={ensureModels}
          label={`Voice (${pendingLoaders.map((l) => l.label).join(', ')})`}
        />
      )}

      {error && <div className="model-banner"><span className="error-text">{error}</span></div>}

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '8px' }}>
         <button className="btn btn-sm" onClick={() => setPersonaPrompt(null)}>Change Persona</button>
      </div>

      <WaveformVisualizer audioStream={activeStream} isTTSSpeaking={voiceState === 'speaking' || voiceState === 'processing'} />

      {micPermissionState === 'prompting' ? (
        <div className="permission-interstitial" style={{ textAlign: 'center', padding: '2rem' }}>
          <h3>Microphone Access Required</h3>
          <p>We need access to your microphone for voice input.</p>
          <p><strong>Your audio is processed entirely on this device and never sent to any server.</strong></p>
          <div style={{ marginTop: '1rem', display: 'flex', gap: '1rem', justifyContent: 'center' }}>
            <button className="btn btn-primary" onClick={requestMicPermission}>Enable Microphone</button>
            <button className="btn" onClick={() => setMicPermissionState('unknown')}>Cancel</button>
          </div>
        </div>
      ) : micPermissionState === 'denied' ? (
        <div className="permission-interstitial" style={{ textAlign: 'center', padding: '2rem' }}>
          <h3>Microphone Access Denied</h3>
          <p>Please enable microphone access in your browser settings to use voice features.</p>
          <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'center' }}>
            <button className="btn" onClick={() => setMicPermissionState('unknown')}>Go Back</button>
          </div>
        </div>
      ) : (
      <>
        <div className="voice-center" style={{ padding: '8px 0' }}>
          <p className="voice-status" style={{ marginBottom: '16px' }}>
            {voiceState === 'idle' && 'Tap to start conversation'}
            {voiceState === 'loading-models' && 'Loading models...'}
            {voiceState === 'listening' && 'Listening... speak now'}
            {voiceState === 'processing' && 'Processing...'}
            {voiceState === 'speaking' && 'Speaking...'}
          </p>

          {voiceState === 'idle' || voiceState === 'loading-models' ? (
            <button
              className="btn btn-primary btn-lg"
              onClick={handleStartListening}
              disabled={voiceState === 'loading-models'}
            >
              Start Conversation
            </button>
          ) : voiceState === 'listening' ? (
            <button className="btn btn-lg" onClick={stopListening}>
              Stop
            </button>
          ) : null}
        </div>

        <TranscriptPanel messages={messages} onClear={() => setMessages([])} />
        <PrivacyStats wordsSpoken={wordsSpoken} aiResponses={aiResponses} />
      </>
      )}
    </div>
  );
}
