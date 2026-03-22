import React, { useEffect, useState } from 'react';
import { useVoiceAgent } from '../hooks/useVoiceAgent';
import { isLLMLoaded, loadLLM } from '../llm/model';

// Import the user's preferred legacy aesthetic components
import { VoiceOrb } from '@/components/conversa/voice-orb';
import { SubtitlesPanel } from '@/components/conversa/subtitles-panel';
import { ModeSelector, MODES, type AssistantMode } from '@/components/conversa/mode-selector';
import { StatusBar } from '@/components/conversa/status-bar';
import { FloatingControls } from '@/components/conversa/floating-controls';
import { LatencyMetrics } from '@/components/conversa/LatencyMetrics';

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
    startListening, 
    stopListening,
    clearMemory
  } = useVoiceAgent();

  const [isModelsLoaded, setIsModelsLoaded] = useState(false);
  const [loadProgress, setLoadProgress] = useState(0);
  const [isOffline, setIsOffline] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showMetrics, setShowMetrics] = useState(true);

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

  useEffect(() => {
    if (!isLLMLoaded()) {
      // Begin loading the massive WebWorker structures offline
      loadLLM((progress) => setLoadProgress(progress))
        .then(() => setIsModelsLoaded(true))
        .catch(err => {
          console.error(err);
          setErrorMessage(err.message || String(err));
        });
    } else {
      setIsModelsLoaded(true);
      setLoadProgress(100);
    }
  }, []);

  const currentMode = MODES.find((m) => m.id === persona)!;
  const modeColor = currentMode.color;

  function handleModeChange(mode: AssistantMode) {
    setPersona(mode);
  }

  async function handleOrbClick() {
    if (!isModelsLoaded) return;
    if (state === "idle") {
      await startListening();
    } else {
      // If listening, thinking, or speaking — tap to interrupt
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

  if (!isModelsLoaded) {
    return (
      <div className="flex flex-col h-full items-center justify-center min-h-[500px] p-4 relative z-50">
        <div className="w-full max-w-md p-8 bg-background/80 backdrop-blur-sm rounded-2xl border border-border/50 text-center shadow-lg">
          {errorMessage ? (
            <>
              <div className="text-red-500 font-bold mb-4 text-xl">Failed to load models.</div>
              <div className="text-xs font-mono bg-red-500/10 text-red-500 p-4 rounded-xl text-left overflow-auto max-h-40 border border-red-500/20">{errorMessage}</div>
              <div className="mt-4 text-sm text-foreground opacity-80">Ensure internet is connected for the initial weights download, then refresh.</div>
            </>
          ) : (
            <>
              <div className="text-lg font-medium mb-6 animate-pulse">Initializing Local AI Pipeline...</div>
              <div className="w-full bg-muted rounded-full h-2 mb-3 overflow-hidden">
                <div className="bg-primary h-full rounded-full transition-all duration-300 shadow-[0_0_10px_rgba(var(--primary),0.5)]" style={{ width: `${loadProgress}%` }} />
              </div>
              <div className="text-xs text-muted-foreground font-mono">{Math.round(loadProgress)}% initialized</div>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-8 py-6 px-4 min-h-full w-full mx-auto relative">
      <StatusBar
        micActive={state === "listening"}
        isThinking={state === "llm" || state === "stt"}
        isOffline={isOffline}
        showMetrics={showMetrics}
        onToggleMetrics={() => setShowMetrics(prev => !prev)}
      />

      {/* Latency metrics overlay */}
      <LatencyMetrics timings={timings} visible={showMetrics} />

      {/* The 5 Skills requested by the user */}
      <ModeSelector activeMode={persona as AssistantMode} onChange={handleModeChange} />

      {/* The large interactive Voice Orb centerpiece */}
      <div className="flex-1 flex flex-col items-center justify-center py-6 w-full relative">
        <VoiceOrb 
          state={mappedOrbState} 
          modeColor={modeColor} 
          onClick={handleOrbClick}
          disabled={!isModelsLoaded}
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
