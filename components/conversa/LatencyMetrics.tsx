"use client"

import { cn } from "@/lib/utils"
import type { PipelineTimings } from "@/frontend/voice/pipeline"

interface LatencyMetricsProps {
  timings: PipelineTimings | null
  visible: boolean
  className?: string
}

export function LatencyMetrics({ timings, visible, className }: LatencyMetricsProps) {
  if (!visible || !timings) return null

  // Dynamic cloud API latency estimate based on actual response size
  // STT: ~800ms Whisper API + 400ms network RTT
  // LLM: ~400ms network + tokens × 30ms/tok (GPT-4o streaming, ~33 tok/s observed)
  // TTS: ~800ms synthesis API + 400ms network RTT
  const cloudSttMs = 800 + 400
  const cloudLlmMs = 400 + (timings.llmTokens || 10) * 30
  const cloudTtsMs = 800 + 400
  const estimatedCloudMs = cloudSttMs + cloudLlmMs + cloudTtsMs

  const metrics = [
    {
      label: "STT",
      value: `${timings.sttMs}ms`,
      color: "#4F8EF7",
      icon: (
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z" />
          <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
        </svg>
      ),
    },
    {
      label: "LLM",
      value: `${timings.llmTokensPerSec} tok/s`,
      color: "#A78BFA",
      icon: (
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      ),
    },
    {
      label: "TTS",
      value: `${timings.ttsMs}ms`,
      color: "#34D399",
      icon: (
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
          <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
        </svg>
      ),
    },
    {
      label: "Total",
      value: `${(timings.totalMs / 1000).toFixed(1)}s`,
      color: "#FBBF24",
      icon: (
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
      ),
    },
  ]

  const speedup = estimatedCloudMs > 0 ? (estimatedCloudMs / timings.totalMs) : 0
  const isFaster = timings.totalMs < estimatedCloudMs

  return (
    <div className={cn("flex flex-col gap-1.5 items-center", className)}>
      {/* Main metrics bar */}
      <div
        className={cn(
          "flex items-center gap-2 px-3 py-1.5 rounded-xl",
          "bg-card/60 backdrop-blur-md border border-border/40",
          "animate-in fade-in slide-in-from-top-2 duration-300"
        )}
      >
        <div className="flex items-center gap-1 mr-1">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-400">
            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
          </svg>
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Local</span>
        </div>
        {metrics.map((m) => (
          <div key={m.label} className="flex items-center gap-1">
            <span style={{ color: m.color }}>{m.icon}</span>
            <span className="text-[10px] font-mono font-semibold" style={{ color: m.color }}>
              {m.value}
            </span>
          </div>
        ))}
      </div>

      {/* Cloud vs Local comparison badge */}
      <div
        className={cn(
          "flex items-center gap-2.5 px-3 py-1 rounded-lg",
          "bg-card/40 backdrop-blur-md border border-border/30",
          "animate-in fade-in slide-in-from-top-1 duration-500"
        )}
      >
        <div className="flex items-center gap-1">
          <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-amber-400">
            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
          </svg>
          <span className="text-[10px] font-mono font-bold text-emerald-400">
            Local {(timings.totalMs / 1000).toFixed(1)}s
          </span>
        </div>
        <span className="text-[10px] text-muted-foreground/60">vs</span>
        <div className="flex items-center gap-1">
          <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground/50">
            <path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z" />
          </svg>
          <span className="text-[10px] font-mono text-muted-foreground/60">
            Cloud ~{(estimatedCloudMs / 1000).toFixed(1)}s
          </span>
        </div>
        {isFaster && speedup > 1 && (
          <span className="text-[10px] font-bold text-emerald-400 ml-0.5">
            {speedup.toFixed(1)}× faster
          </span>
        )}
      </div>
    </div>
  )
}
