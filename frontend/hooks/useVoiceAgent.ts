import { useState, useRef, useCallback, useEffect } from 'react';
import { VoiceActivityDetector } from '../voice/vad';
import { VoicePipeline, PipelineState, PipelineTimings } from '../voice/pipeline';
import { ToolCall } from '../llm/prompt';
import { memory } from '../storage/memory';
import { isSmartModelReady, getSmartModelError, type ModelMode } from '../llm/model';

export function useVoiceAgent() {
  const [targetState, setTargetState] = useState<PipelineState>('idle');
  const [userText, setUserText] = useState('');
  const [aiText, setAiText] = useState('');
  const [tasks, setTasks] = useState<{title: string, done: boolean}[]>([]);
  const [timings, setTimings] = useState<PipelineTimings | null>(null);
  const [audioLevel, setAudioLevel] = useState(0);
  const [persona, setPersona] = useState('productivity');
  const [modelMode, setModelMode] = useState<ModelMode>('fast');
  
  const vadRef = useRef<VoiceActivityDetector>(new VoiceActivityDetector());
  const pipelineRef = useRef<VoicePipeline>(new VoicePipeline());
  const continuousRef = useRef(false);
  const personaRef = useRef(persona);
  const modelModeRef = useRef(modelMode);

  // Keep refs in sync
  useEffect(() => {
    personaRef.current = persona;
  }, [persona]);
  useEffect(() => {
    modelModeRef.current = modelMode;
  }, [modelMode]);

  const startVADListening = useCallback(async () => {
    // NOTE: Don't clear userText/aiText here — keep previous turn visible
    // until the next turn's transcript arrives via onTranscript

    await vadRef.current.start({
      onSpeechStart: () => {
        // Visual feedback that speech is detected
      },
      onSpeechEnd: async (audioData) => {
        // Stop VAD while processing this turn
        vadRef.current.stop();
        
        await pipelineRef.current.processTurn(audioData, {
          onStateChange: setTargetState,
          onTranscript: (text) => {
            // Clear previous turn's text when new transcript arrives
            setAiText('');
            setUserText(text);
          },
          onLLMToken: (t) => setAiText(prev => prev + t),
          onLLMComplete: () => {
             // Turn text complete
          },
          onToolCall: (tool: ToolCall) => {
             if (tool.name === 'create_task') {
               const taskTitle = tool.arguments.title || 'New Task';
               // 1. Update local state for immediate sidebar feedback
               setTasks(prev => [...prev, { title: taskTitle, done: false }]);
               
               // 2. Sync with global TasksScreen via localStorage
               const stored = typeof window !== 'undefined' ? localStorage.getItem('conversa-tasks') : null;
               const currentTasks = stored ? JSON.parse(stored) : [];
               const newTask = {
                 id: Date.now().toString(),
                 text: taskTitle,
                 status: 'pending',
                 voiceAdded: true,
                 time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
               };
               localStorage.setItem('conversa-tasks', JSON.stringify([...currentTasks, newTask]));
             }
          },
          onTimings: (t) => setTimings(t),
          onSpeakingDone: () => {
            // Continuous voice loop: auto-restart listening after TTS finishes
            if (continuousRef.current) {
              setTargetState('listening');
              // Re-start VAD for next turn — keep current text visible
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
        }, personaRef.current, modelModeRef.current);
      },
      onAudioLevel: (level: number) => {
        setAudioLevel(level);
      }
    });
  }, []);

  const startListening = useCallback(async () => {
    continuousRef.current = true;
    setTargetState('listening');
    // Don't clear timings — keep last turn's metrics visible
    await startVADListening();
  }, [startVADListening]);

  const stopListening = useCallback(() => {
    continuousRef.current = false;
    vadRef.current.stop();
    pipelineRef.current.interrupt();
    setTargetState('idle');
    setAudioLevel(0);
  }, []);
  
  const processTextInput = useCallback(async (text: string) => {
    // Feeds text directly into LLM → TTS pipeline (e.g. for chat or automation)
    setAiText('');
    setUserText(text);
    setTargetState('llm');

    await pipelineRef.current.processTextTurn(text, {
      onStateChange: setTargetState,
      onTranscript: (t) => setUserText(t),
      onLLMToken: (t) => setAiText(prev => prev + t),
      onLLMComplete: () => {},
      onToolCall: (tool: ToolCall) => {
        if (tool.name === 'create_task') {
          const taskTitle = tool.arguments.title || 'New Task';
          // 1. Update local state
          setTasks(prev => [...prev, { title: taskTitle, done: false }]);
          
          // 2. Sync with localStorage
          const stored = typeof window !== 'undefined' ? localStorage.getItem('conversa-tasks') : null;
          const currentTasks = stored ? JSON.parse(stored) : [];
          const newTask = {
            id: Date.now().toString(),
            text: taskTitle,
            status: 'pending',
            voiceAdded: true,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          };
          localStorage.setItem('conversa-tasks', JSON.stringify([...currentTasks, newTask]));
        }
      },
      onTimings: (t) => setTimings(t),
      onSpeakingDone: () => {},
      onError: (err) => console.error(err)
    }, personaRef.current, modelModeRef.current);
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
    modelMode,
    setModelMode,
    isSmartReady: isSmartModelReady(),
    smartModelError: getSmartModelError(),
    startListening,
    stopListening,
    clearMemory,
    processTextInput
  };
}
