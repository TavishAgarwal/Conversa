import React, { useEffect, useState } from 'react';
import { useVoiceAgent } from '../hooks/useVoiceAgent';
import { type ModelMode } from '../llm/model';

// Import the user's preferred legacy aesthetic components
import { VoiceOrb } from '@/components/conversa/voice-orb';
import { SubtitlesPanel } from '@/components/conversa/subtitles-panel';
import { ModeSelector, MODES, type AssistantMode } from '@/components/conversa/mode-selector';
import { StatusBar } from '@/components/conversa/status-bar';
import { FloatingControls } from '@/components/conversa/floating-controls';

export const VoiceUI: React.FC = () => {
  const { 
    state, 
    userText, 
    aiText, 
    tasks,
    timings,
    audioLevel,
    persona,
    setPersona,
    modelMode,
    setModelMode,
    isSmartReady,
    startListening, 
    stopListening,
    clearMemory
  } = useVoiceAgent();

  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    setIsOffline(!navigator.onLine);
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const currentMode = MODES.find((m) => m.id === persona)!;
  const modeColor = currentMode.color;

  function handleModeChange(mode: AssistantMode) {
    setPersona(mode);
  }

  async function handleOrbClick() {
    if (state === "idle") {
      await startListening();
    } else {
      stopListening();
    }
  }

  function handleInterrupt() {
    stopListening();
  }

  function handleReset() {
    stopListening();
    clearMemory();
  }

  // Define how the legacy UI Maps to our new powerful Pipeline states
  const mappedOrbState = state === "llm" || state === "stt" ? "thinking" 
                       : state === "tts" ? "speaking" 
                       : state === "listening" ? "listening" 
                       : "idle";

  return (
    <div className="flex flex-col items-center gap-8 py-6 px-4 min-h-full w-full mx-auto relative">
      <StatusBar
        micActive={state === "listening"}
        isThinking={state === "llm" || state === "stt"}
        isOffline={isOffline}
      />

      {/* Fast / Smart model toggle */}
      <div className="flex items-center gap-1.5">
        {(['fast', 'smart'] as ModelMode[]).map((m) => (
          <button
            key={m}
            onClick={() => setModelMode(m)}
            disabled={m === 'smart' && !isSmartReady}
            title={m === 'smart' && !isSmartReady ? 'Smart model is loading in the background…' : undefined}
            className={[
              'px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 border',
              modelMode === m
                ? m === 'fast'
                  ? 'bg-amber-500/20 border-amber-500/50 text-amber-300'
                  : 'bg-violet-500/20 border-violet-500/50 text-violet-300'
                : 'bg-card/40 border-border/30 text-muted-foreground hover:text-foreground',
              m === 'smart' && !isSmartReady ? 'opacity-40 cursor-not-allowed' : 'active:scale-95',
            ].join(' ')}
          >
            {m === 'fast' ? '⚡ Fast' : '🧠 Smart'}
          </button>
        ))}
      </div>

      {/* The 5 Skills requested by the user */}
      <ModeSelector activeMode={persona as AssistantMode} onChange={handleModeChange} />

      {/* The large interactive Voice Orb centerpiece */}
      <div className="flex-1 flex flex-col items-center justify-center py-6 w-full relative">
        <VoiceOrb 
          state={mappedOrbState} 
          modeColor={modeColor} 
          onClick={handleOrbClick}
          disabled={false}
          audioLevel={audioLevel}
        />
        
        {tasks.length > 0 && (
          <div className="absolute top-0 right-0 max-w-xs w-full bg-card/40 backdrop-blur-md p-4 rounded-xl border border-border/50 shadow-sm">
            <h4 className="text-xs uppercase tracking-wider text-muted-foreground font-bold mb-3">Action Output</h4>
            <div className="space-y-2">
              {tasks.map((task, i) => (
                <div key={i} className="flex items-center gap-3 text-sm">
                  <div className="w-2 h-2 rounded-full bg-primary/80" />
                  <span className="text-foreground">{task.title}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <SubtitlesPanel
        userText={userText}
        aiText={aiText}
        isStreaming={state === "llm" || state === "tts"}
        className="w-full max-w-xl mb-24"
      />

      {/* The explicitly requested Interrupt and Reset action buttons */}
      <FloatingControls
        orbState={mappedOrbState}
        onToggleListen={handleOrbClick}
        onInterrupt={handleInterrupt}
        onReset={handleReset}
        modeColor={modeColor}
      />
    </div>
  );
};
