"use client"

import { cn } from "@/lib/utils"

interface StatusBarProps {
  micActive: boolean
  isThinking: boolean
  isOffline: boolean
  className?: string
}

export function StatusBar({ micActive, isThinking, isOffline, className }: StatusBarProps) {
  return (
    <div className={cn("flex items-center gap-3 flex-wrap justify-center", className)}>
      {/* Offline badge */}
      <div
        className={cn(
          "flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border",
          "bg-emerald-950/60 border-emerald-700/50 text-emerald-400"
        )}
      >
        <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
        </svg>
        Offline
      </div>

      {/* Mic status */}
      <div
        className={cn(
          "flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border transition-all duration-300",
          micActive
            ? "bg-blue-950/60 border-blue-600/50 text-blue-400"
            : "bg-muted/40 border-border/40 text-muted-foreground"
        )}
      >
        <span
          className={cn(
            "w-1.5 h-1.5 rounded-full",
            micActive ? "bg-blue-400 animate-pulse" : "bg-muted-foreground/50"
          )}
        />
        {micActive ? "Mic Active" : "Mic Off"}
      </div>

      {/* AI thinking */}
      {isThinking && (
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border bg-purple-950/60 border-purple-600/50 text-purple-400">
          <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-ping" />
          AI Thinking
        </div>
      )}
    </div>
  )
}
