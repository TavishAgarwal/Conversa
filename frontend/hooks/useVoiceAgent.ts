import { useState, useRef, useCallback, useEffect } from 'react';
import { VoiceActivityDetector } from '../voice/vad';
import { VoicePipeline, PipelineState, PipelineTimings } from '../voice/pipeline';
import { ToolCall } from '../llm/prompt';
import { memory } from '../storage/memory';

export function useVoiceAgent() {
  const [targetState, setTargetState] = useState<PipelineState>('idle');
  const [userText, setUserText] = useState('');
  const [aiText, setAiText] = useState('');
  const [tasks, setTasks] = useState<{title: string, done: boolean}[]>([]);
  const [timings, setTimings] = useState<PipelineTimings | null>(null);
  const [audioLevel, setAudioLevel] = useState(0);
  const [persona, setPersona] = useState('productivity');
  
  const vadRef = useRef<VoiceActivityDetector>(new VoiceActivityDetector());
  const pipelineRef = useRef<VoicePipeline>(new VoicePipeline());
  const continuousRef = useRef(false);
  const personaRef = useRef(persona);

  // Keep personaRef in sync
  useEffect(() => {
    personaRef.current = persona;
  }, [persona]);

  const startVADListening = useCallback(async () => {
    setUserText('');
    setAiText('');

    await vadRef.current.start({
      onSpeechStart: () => {
        // Visual feedback that speech is detected
      },
      onSpeechEnd: async (audioData) => {
        // Stop VAD while processing this turn
        vadRef.current.stop();
        
        await pipelineRef.current.processTurn(audioData, {
          onStateChange: setTargetState,
          onTranscript: setUserText,
          onLLMToken: (t) => setAiText(prev => prev + t),
          onLLMComplete: () => {
             // Turn text complete
          },
          onToolCall: (tool: ToolCall) => {
             if (tool.name === 'create_task') {
               setTasks(prev => [...prev, { title: tool.arguments.title || 'New Task', done: false }]);
             }
          },
          onTimings: (t) => setTimings(t),
          onSpeakingDone: () => {
            // Continuous voice loop: auto-restart listening after TTS finishes
            if (continuousRef.current) {
              setTargetState('listening');
              setUserText('');
              setAiText('');
              // Re-start VAD for next turn
              startVADListening();
            }
          },
          onError: (err) => {
            console.error(err);
            // Even on error, try to re-enter listening if continuous
            if (continuousRef.current) {
              setTargetState('listening');
              startVADListening();
            }
          }
        }, personaRef.current);
      },
      onAudioLevel: (level: number) => {
        setAudioLevel(level);
      }
    });
  }, []);

  const startListening = useCallback(async () => {
    continuousRef.current = true;
    setTargetState('listening');
    setTimings(null);
    await startVADListening();
  }, [startVADListening]);

  const stopListening = useCallback(() => {
    continuousRef.current = false;
    vadRef.current.stop();
    pipelineRef.current.interrupt();
    setTargetState('idle');
    setAudioLevel(0);
  }, []);
  
  const clearMemory = useCallback(async () => {
    await memory.clear();
    setAiText('');
    setUserText('');
    setTimings(null);
  }, []);

  useEffect(() => {
    return () => {
      continuousRef.current = false;
      vadRef.current.stop();
    };
  }, []);

  return {
    state: targetState,
    userText,
    aiText,
    tasks,
    timings,
    audioLevel,
    persona,
    setPersona,
    startListening,
    stopListening,
    clearMemory
  };
}
