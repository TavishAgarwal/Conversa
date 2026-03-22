"use client"

import { useEffect, useRef } from "react"
import { cn } from "@/lib/utils"

type OrbState = "idle" | "listening" | "thinking" | "speaking"

interface VoiceOrbProps {
  state: OrbState
  modeColor: string
  onClick: () => void
  disabled?: boolean
}

const stateConfig: Record<OrbState, { label: string; outerClass: string; innerClass: string }> = {
  idle: {
    label: "Tap to speak",
    outerClass: "opacity-30 scale-100",
    innerClass: "opacity-40",
  },
  listening: {
    label: "Listening...",
    outerClass: "opacity-60 scale-110 animate-pulse",
    innerClass: "opacity-70",
  },
  thinking: {
    label: "Processing...",
    outerClass: "opacity-50 scale-105",
    innerClass: "opacity-50",
  },
  speaking: {
    label: "Speaking...",
    outerClass: "opacity-70 scale-115",
    innerClass: "opacity-80",
  },
}

export function VoiceOrb({ state, modeColor, onClick, disabled = false }: VoiceOrbProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animFrameRef = useRef<number>(0)
  const phaseRef = useRef(0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const size = canvas.width

    function draw() {
      if (!ctx || !canvas) return
      ctx.clearRect(0, 0, size, size)

      const cx = size / 2
      const cy = size / 2
      const baseR = size * 0.28

      // Waveform bars around the orb when speaking
      if (state === "speaking" || state === "listening") {
        const barCount = 48
        for (let i = 0; i < barCount; i++) {
          const angle = (i / barCount) * Math.PI * 2
          const wave =
            state === "speaking"
              ? Math.sin(phaseRef.current * 3 + i * 0.5) * 18 + Math.sin(phaseRef.current * 5 + i * 0.3) * 10
              : Math.sin(phaseRef.current * 2 + i * 0.4) * 8
          const r1 = baseR + 12
          const r2 = baseR + 20 + Math.max(0, wave)
          const x1 = cx + Math.cos(angle) * r1
          const y1 = cy + Math.sin(angle) * r1
          const x2 = cx + Math.cos(angle) * r2
          const y2 = cy + Math.sin(angle) * r2
          ctx.beginPath()
          ctx.moveTo(x1, y1)
          ctx.lineTo(x2, y2)
          ctx.strokeStyle = modeColor + "99"
          ctx.lineWidth = 2.5
          ctx.lineCap = "round"
          ctx.stroke()
        }
      }

      // Outer glow rings
      const ringCount = 3
      for (let r = 0; r < ringCount; r++) {
        const progress = ((phaseRef.current * 0.5 + r / ringCount) % 1)
        const ringR = baseR + 8 + progress * 55
        const alpha = state === "idle" ? 0.08 : (1 - progress) * 0.25
        const grad = ctx.createRadialGradient(cx, cy, ringR - 2, cx, cy, ringR + 2)
        grad.addColorStop(0, modeColor + "00")
        grad.addColorStop(0.5, modeColor + Math.round(alpha * 255).toString(16).padStart(2, "0"))
        grad.addColorStop(1, modeColor + "00")
        ctx.beginPath()
        ctx.arc(cx, cy, ringR, 0, Math.PI * 2)
        ctx.strokeStyle = grad
        ctx.lineWidth = 3
        ctx.stroke()
      }

      phaseRef.current += state === "speaking" ? 0.04 : state === "listening" ? 0.025 : 0.008
      animFrameRef.current = requestAnimationFrame(draw)
    }

    draw()
    return () => cancelAnimationFrame(animFrameRef.current)
  }, [state, modeColor])

  const config = stateConfig[state]

  return (
    <div className="relative flex items-center justify-center" style={{ width: 260, height: 260 }}>
      {/* Canvas for animated rings/waveform */}
      <canvas
        ref={canvasRef}
        width={260}
        height={260}
        className="absolute inset-0 pointer-events-none"
      />

      {/* Outer soft ring */}
      <div
        className={cn(
          "absolute rounded-full border transition-all duration-700",
          config.outerClass
        )}
        style={{
          width: 220,
          height: 220,
          borderColor: modeColor + "55",
          boxShadow: `0 0 60px ${modeColor}33`,
        }}
      />

      {/* Main orb button */}
      <button
        onClick={onClick}
        disabled={disabled}
        aria-label={config.label}
        className={cn(
          "relative z-10 rounded-full flex items-center justify-center",
          "transition-all duration-500 active:scale-95 focus:outline-none",
          "border",
          disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"
        )}
        style={{
          width: 140,
          height: 140,
          background: `radial-gradient(circle at 35% 35%, ${modeColor}55, ${modeColor}22 60%, transparent)`,
          borderColor: modeColor + "60",
          boxShadow: `0 0 30px ${modeColor}44, inset 0 1px 0 ${modeColor}33`,
        }}
      >
        {/* Inner glow */}
        <div
          className={cn("absolute inset-4 rounded-full transition-opacity duration-500", config.innerClass)}
          style={{
            background: `radial-gradient(circle at 40% 40%, ${modeColor}88, ${modeColor}22)`,
          }}
        />
        {/* State icon */}
        <div className="relative z-10">
          {state === "idle" && (
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: modeColor }}>
              <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z" />
              <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
              <line x1="12" y1="19" x2="12" y2="22" />
            </svg>
          )}
          {state === "listening" && (
            <div className="flex gap-1 items-end h-7">
              {[3, 5, 7, 5, 3].map((h, i) => (
                <div
                  key={i}
                  className="w-1.5 rounded-full animate-bounce"
                  style={{
                    height: h * 3,
                    backgroundColor: modeColor,
                    animationDelay: `${i * 0.1}s`,
                    animationDuration: "0.6s",
                  }}
                />
              ))}
            </div>
          )}
          {state === "thinking" && (
            <div className="flex gap-1.5">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="w-2 h-2 rounded-full animate-bounce"
                  style={{
                    backgroundColor: modeColor,
                    animationDelay: `${i * 0.15}s`,
                  }}
                />
              ))}
            </div>
          )}
          {state === "speaking" && (
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: modeColor }}>
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
              <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
              <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
            </svg>
          )}
        </div>
      </button>

      {/* State label */}
      <div className="absolute -bottom-8 text-sm font-medium text-muted-foreground tracking-wide">
        {config.label}
      </div>
    </div>
  )
}
