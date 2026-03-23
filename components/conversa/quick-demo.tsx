"use client"

import { useState, useCallback } from "react"
import { cn } from "@/lib/utils"

const DEMO_STEPS = [
  {
    step: 1,
    label: "General Knowledge",
    prompt: "What is the speed of light?",
    persona: "productivity",
    icon: "🧠",
    description: "Testing LLM general knowledge",
  },
  {
    step: 2,
    label: "Tool Calling",
    prompt: "Create a task: prepare demo slides",
    persona: "productivity",
    icon: "✅",
    description: "Testing tool execution pipeline",
  },
  {
    step: 3,
    label: "Persona Switch",
    prompt: "How do I make scrambled eggs?",
    persona: "cooking",
    icon: "👨‍🍳",
    description: "Testing persona switching + domain expertise",
  },
]

interface QuickDemoProps {
  onProcessText: (text: string) => Promise<void>
  onSetPersona: (persona: string) => void
  onSwitchToVoice: () => void
  disabled?: boolean
}

export function QuickDemo({ onProcessText, onSetPersona, onSwitchToVoice, disabled }: QuickDemoProps) {
  const [isRunning, setIsRunning] = useState(false)
  const [currentStep, setCurrentStep] = useState(-1)
  const [isOpen, setIsOpen] = useState(false)
  const [completed, setCompleted] = useState(false)

  const runDemo = useCallback(async () => {
    setIsRunning(true)
    setCompleted(false)
    onSwitchToVoice()

    for (let i = 0; i < DEMO_STEPS.length; i++) {
      const step = DEMO_STEPS[i]
      setCurrentStep(i)

      // Switch persona if needed
      onSetPersona(step.persona)

      // Small delay to let persona switch propagate
      await new Promise(r => setTimeout(r, 300))

      // Run the actual AI pipeline with this text
      await onProcessText(step.prompt)

      // Brief pause between steps
      if (i < DEMO_STEPS.length - 1) {
        await new Promise(r => setTimeout(r, 1500))
      }
    }

    // Reset to productivity persona
    onSetPersona("productivity")
    setCurrentStep(-1)
    setIsRunning(false)
    setCompleted(true)
  }, [onProcessText, onSetPersona, onSwitchToVoice])

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        disabled={disabled}
        className={cn(
          "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold",
          "bg-gradient-to-r from-violet-500/20 to-blue-500/20",
          "border border-violet-500/40 text-violet-300",
          "hover:from-violet-500/30 hover:to-blue-500/30",
          "transition-all duration-300 active:scale-95",
          disabled && "opacity-40 cursor-not-allowed"
        )}
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="5 3 19 12 5 21 5 3" />
        </svg>
        Quick Demo
      </button>
    )
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center p-4 pointer-events-none">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm pointer-events-auto"
        onClick={() => { if (!isRunning) setIsOpen(false) }}
      />

      {/* Panel */}
      <div
        className={cn(
          "relative z-10 w-full max-w-lg pointer-events-auto",
          "bg-card/95 backdrop-blur-xl rounded-2xl border border-border/60",
          "shadow-2xl shadow-black/50",
          "animate-in slide-in-from-bottom-4 fade-in duration-300"
        )}
      >
        {/* Progress */}
        <div className="h-1 bg-muted/30 rounded-t-2xl overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-violet-400 to-blue-400 transition-all duration-700"
            style={{ width: `${isRunning ? ((currentStep + 1) / DEMO_STEPS.length) * 100 : completed ? 100 : 0}%` }}
          />
        </div>

        <div className="p-5">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500/20 to-blue-500/20 border border-violet-500/30 flex items-center justify-center text-lg">
                🚀
              </div>
              <div>
                <div className="text-sm font-semibold text-foreground">Quick Demo</div>
                <div className="text-[10px] text-muted-foreground">3-step automated showcase</div>
              </div>
            </div>
            {!isRunning && (
              <button
                onClick={() => setIsOpen(false)}
                className="w-7 h-7 rounded-lg bg-muted/40 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            )}
          </div>

          {/* Steps */}
          <div className="space-y-2 mb-4">
            {DEMO_STEPS.map((step, i) => {
              const isActive = currentStep === i
              const isDone = currentStep > i || (completed && currentStep === -1)
              return (
                <div
                  key={i}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-all duration-300",
                    isActive
                      ? "bg-primary/10 border-primary/30 shadow-sm"
                      : isDone
                      ? "bg-emerald-950/30 border-emerald-700/30"
                      : "bg-card/30 border-border/20"
                  )}
                >
                  <span className="text-lg">{step.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-semibold text-foreground">
                      Step {step.step}: {step.label}
                    </div>
                    <div className="text-[10px] text-muted-foreground mt-0.5 truncate">
                      &ldquo;{step.prompt}&rdquo;
                    </div>
                  </div>
                  {isActive && (
                    <span className="w-2 h-2 rounded-full bg-primary animate-ping" />
                  )}
                  {isDone && (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-400">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </div>
              )
            })}
          </div>

          {/* Description */}
          {isRunning && currentStep >= 0 && (
            <div className="px-3 py-2 rounded-lg bg-blue-950/20 border border-blue-700/20 mb-4">
              <p className="text-[11px] text-blue-300/80">
                {DEMO_STEPS[currentStep].description}… Using real AI pipeline (no mocking)
              </p>
            </div>
          )}

          {completed && (
            <div className="px-3 py-2 rounded-lg bg-emerald-950/20 border border-emerald-700/20 mb-4">
              <p className="text-[11px] text-emerald-300/80">
                ✓ Demo complete! All 3 steps ran through the real local AI pipeline.
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-border/30">
            {!isRunning && !completed && (
              <button
                onClick={runDemo}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-violet-500 to-blue-500 hover:from-violet-600 hover:to-blue-600 transition-all active:scale-95 shadow-lg shadow-violet-500/20"
              >
                ▶ Run Demo
              </button>
            )}
            {isRunning && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                Running step {currentStep + 1} of {DEMO_STEPS.length}…
              </div>
            )}
            {completed && (
              <button
                onClick={() => { setCompleted(false); setIsOpen(false) }}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-emerald-300 bg-emerald-500/15 hover:bg-emerald-500/25 transition-all active:scale-95"
              >
                ✓ Done
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
