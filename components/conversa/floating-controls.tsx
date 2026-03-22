"use client"

import { cn } from "@/lib/utils"

interface FloatingControlsProps {
  orbState: "idle" | "listening" | "thinking" | "speaking"
  onToggleListen: () => void
  onInterrupt: () => void
  onReset: () => void
  modeColor: string
}

export function FloatingControls({ orbState, onToggleListen, onInterrupt, onReset, modeColor }: FloatingControlsProps) {
  const isListening = orbState === "listening"
  const isSpeaking = orbState === "speaking" || orbState === "thinking"

  return (
    <div className="flex items-center gap-3">
      {/* Main start/stop */}
      <button
        onClick={onToggleListen}
        className={cn(
          "flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold transition-all duration-300",
          "border focus:outline-none active:scale-95",
          isListening
            ? "text-red-400 border-red-800/60 bg-red-950/40 hover:bg-red-950/60"
            : "border-border/60 bg-secondary/60 text-foreground hover:bg-secondary"
        )}
        style={
          !isListening
            ? { borderColor: modeColor + "55", color: modeColor }
            : {}
        }
      >
        {isListening ? (
          <>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <rect x="6" y="6" width="12" height="12" rx="2" />
            </svg>
            Stop
          </>
        ) : (
          <>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z" />
              <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
            </svg>
            Listen
          </>
        )}
      </button>

      {/* Interrupt */}
      <button
        onClick={onInterrupt}
        disabled={!isSpeaking}
        className={cn(
          "flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium transition-all duration-300",
          "border focus:outline-none active:scale-95",
          isSpeaking
            ? "border-amber-700/60 bg-amber-950/40 text-amber-400 hover:bg-amber-950/60"
            : "border-border/30 bg-muted/20 text-muted-foreground/40 cursor-not-allowed"
        )}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
        </svg>
        Interrupt
      </button>

      {/* Reset */}
      <button
        onClick={onReset}
        className={cn(
          "flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium transition-all duration-300",
          "border border-border/40 bg-muted/20 text-muted-foreground hover:text-foreground hover:bg-muted/40",
          "focus:outline-none active:scale-95"
        )}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="1 4 1 10 7 10" />
          <path d="M3.51 15a9 9 0 1 0 .49-3.5" />
        </svg>
        Reset
      </button>
    </div>
  )
}
