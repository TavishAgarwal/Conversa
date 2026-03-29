import React, { useEffect, useState } from 'react';
import { useVoiceAgent } from '../hooks/useVoiceAgent';
import { type ModelMode } from '../llm/model';

// Import the user's preferred legacy aesthetic components
import { VoiceOrb } from '@/components/conversa/voice-orb';
import { SubtitlesPanel } from '@/components/conversa/subtitles-panel';
import { ModeSelector, MODES, type AssistantMode } from '@/components/conversa/mode-selector';
import { StatusBar } from '@/components/conversa/status-bar';
import { FloatingControls } from '@/components/conversa/floating-controls';
import { NetworkMonitor } from '@/components/conversa/network-monitor';
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
    modelMode,
    setModelMode,
    isSmartReady,
    smartModelError,
    startListening, 
    stopListening,
    clearMemory,
    processTextInput
  } = useVoiceAgent();

  const [isOffline, setIsOffline] = useState(false);
  const [showAiReady, setShowAiReady] = useState(false);
  const [aiReadyDismissed, setAiReadyDismissed] = useState(false);

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

  // Task 5: AI Ready indicator — show briefly after models are loaded
  useEffect(() => {
    if (!aiReadyDismissed) {
      setShowAiReady(true);
      const timer = setTimeout(() => {
        setShowAiReady(false);
        setAiReadyDismissed(true);
      }, 4000);
      return () => clearTimeout(timer);
    }
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



      {/* Task 5: AI Ready indicator */}
      {showAiReady && (
        <div className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-emerald-950/60 border border-emerald-700/40 text-emerald-400 text-xs font-bold animate-in fade-in zoom-in-95 duration-500">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
          </svg>
          AI Ready ⚡
        </div>
      )}

      {/* Fast / Smart model toggle */}
      <div className="flex flex-col items-center gap-1.5">
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

        {/* Task 6: Smart mode fallback message */}
        {modelMode === 'smart' && !isSmartReady && (
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-950/40 border border-amber-700/30 text-amber-400/90 text-[10px] font-medium animate-in fade-in slide-in-from-top-1 duration-300">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
            Smart mode unavailable on this device — using Fast mode
          </div>
        )}
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
        className="w-full max-w-xl mb-2"
      />

      {/* Task 8: Latency metrics always visible */}
      <LatencyMetrics
        timings={timings}
        visible={true}
        className="w-full max-w-xl"
      />

      {/* Task 2: Network monitor badge — always visible */}
      <NetworkMonitor className="mb-16" />

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

// Expose processTextInput for QuickDemo
export type VoiceUIHandle = {
  processTextInput: (text: string) => Promise<void>;
  setPersona: (p: string) => void;
};
