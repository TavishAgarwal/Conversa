"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"

const DEMO_STEPS = [
  {
    step: 1,
    title: "Model Loading",
    instruction: "Watch the AI models load directly into your browser — no server needed.",
    icon: "🧠",
    tip: "All 4 models (LLM, STT, TTS, VAD) are cached in your browser's OPFS storage.",
  },
  {
    step: 2,
    title: "Ask a Question",
    instruction: "Tap the orb and say:",
    prompt: "\"What is the speed of light?\"",
    icon: "🎤",
    tip: "Watch the latency metrics appear — everything runs locally on your GPU.",
  },
  {
    step: 3,
    title: "Switch Persona",
    instruction: "Select the Cooking mode above the orb, then say:",
    prompt: "\"How do I make pasta carbonara?\"",
    icon: "👨‍🍳",
    tip: "Each persona has a tailored system prompt that changes the AI's behavior.",
  },
  {
    step: 4,
    title: "Create a Task by Voice",
    instruction: "Switch back to Productivity mode and say:",
    prompt: "\"Create a task: prepare hackathon demo\"",
    icon: "✅",
    tip: "Check the Tasks tab to see it appear. The LLM outputs structured JSON for tool calling.",
  },
  {
    step: 5,
    title: "Verify Offline",
    instruction: "Go to Privacy tab → Run the Offline Benchmark. Optionally disconnect WiFi first!",
    icon: "🔒",
    tip: "The benchmark proves the entire pipeline works without internet.",
  },
  {
    step: 6,
    title: "Check Analytics",
    instruction: "Visit the Dashboard tab to see real-time usage analytics from this session.",
    icon: "📊",
    tip: "All analytics are computed from localStorage — zero cloud telemetry.",
  },
]

export function DemoGuide() {
  const [isOpen, setIsOpen] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className={cn(
          "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold",
          "bg-gradient-to-r from-amber-500/20 to-orange-500/20",
          "border border-amber-500/40 text-amber-300",
          "hover:from-amber-500/30 hover:to-orange-500/30",
          "transition-all duration-300 active:scale-95",
          "animate-pulse hover:animate-none"
        )}
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="5 3 19 12 5 21 5 3" />
        </svg>
        Demo Guide
      </button>
    )
  }

  const step = DEMO_STEPS[currentStep]

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center p-4 pointer-events-none">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm pointer-events-auto"
        onClick={() => setIsOpen(false)}
      />

      {/* Guide panel */}
      <div
        className={cn(
          "relative z-10 w-full max-w-lg pointer-events-auto",
          "bg-card/95 backdrop-blur-xl rounded-2xl border border-border/60",
          "shadow-2xl shadow-black/50",
          "animate-in slide-in-from-bottom-4 fade-in duration-300"
        )}
      >
        {/* Progress bar */}
        <div className="h-1 bg-muted/30 rounded-t-2xl overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-amber-400 to-orange-400 transition-all duration-500"
            style={{ width: `${((currentStep + 1) / DEMO_STEPS.length) * 100}%` }}
          />
        </div>

        <div className="p-5">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="text-2xl">{step.icon}</span>
              <div>
                <div className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">
                  Step {step.step} of {DEMO_STEPS.length}
                </div>
                <div className="text-sm font-semibold text-foreground">{step.title}</div>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="w-7 h-7 rounded-lg bg-muted/40 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          {/* Instruction */}
          <p className="text-sm text-foreground/90 leading-relaxed">{step.instruction}</p>
          {step.prompt && (
            <div className="mt-2 px-3 py-2 rounded-lg bg-primary/10 border border-primary/20">
              <p className="text-sm font-medium text-primary">{step.prompt}</p>
            </div>
          )}

          {/* Tip */}
          <div className="mt-3 flex items-start gap-2 px-3 py-2 rounded-lg bg-amber-500/5 border border-amber-500/10">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-400 mt-0.5 flex-shrink-0">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="16" x2="12" y2="12" />
              <line x1="12" y1="8" x2="12.01" y2="8" />
            </svg>
            <p className="text-[11px] text-amber-200/70 leading-relaxed">{step.tip}</p>
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between mt-4 pt-3 border-t border-border/30">
            <button
              onClick={() => setCurrentStep((s) => Math.max(0, s - 1))}
              disabled={currentStep === 0}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                currentStep === 0
                  ? "text-muted-foreground/30 cursor-not-allowed"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
              )}
            >
              ← Previous
            </button>

            {/* Step dots */}
            <div className="flex items-center gap-1.5">
              {DEMO_STEPS.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentStep(i)}
                  className={cn(
                    "w-1.5 h-1.5 rounded-full transition-all duration-300",
                    i === currentStep
                      ? "w-4 bg-amber-400"
                      : i < currentStep
                      ? "bg-amber-400/50"
                      : "bg-muted-foreground/20"
                  )}
                />
              ))}
            </div>

            {currentStep < DEMO_STEPS.length - 1 ? (
              <button
                onClick={() => setCurrentStep((s) => s + 1)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-amber-300 bg-amber-500/15 hover:bg-amber-500/25 transition-all"
              >
                Next →
              </button>
            ) : (
              <button
                onClick={() => setIsOpen(false)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-emerald-300 bg-emerald-500/15 hover:bg-emerald-500/25 transition-all"
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
