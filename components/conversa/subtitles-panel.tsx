"use client"

import { useEffect, useRef } from "react"
import { cn } from "@/lib/utils"

interface SubtitlesPanelProps {
  userText: string
  aiText: string
  isStreaming: boolean
  className?: string
}

export function SubtitlesPanel({ userText, aiText, isStreaming, className }: SubtitlesPanelProps) {
  const aiRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (aiRef.current) {
      aiRef.current.scrollTop = aiRef.current.scrollHeight
    }
  }, [aiText])

  return (
    <div
      className={cn(
        "rounded-2xl border border-border/50 overflow-hidden",
        "bg-card/40 backdrop-blur-md",
        className
      )}
    >
      {/* User speech */}
      {userText && (
        <div className="px-5 pt-4 pb-3 border-b border-border/30">
          <div className="flex items-center gap-2 mb-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-primary" />
            <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">You</span>
          </div>
          <p className="text-foreground/90 text-sm leading-relaxed">{userText}</p>
        </div>
      )}

      {/* AI response */}
      <div ref={aiRef} className="px-5 py-4 max-h-40 overflow-y-auto">
        {aiText ? (
          <>
            <div className="flex items-center gap-2 mb-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-accent" />
              <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Conversa</span>
            </div>
            <p className="text-foreground text-sm leading-relaxed">
              {aiText}
              {isStreaming && (
                <span className="inline-block w-0.5 h-4 bg-primary ml-0.5 animate-pulse align-middle" />
              )}
            </p>
          </>
        ) : (
          <p className="text-muted-foreground/50 text-sm text-center py-2 italic">
            {userText ? (
              <span className="inline-flex items-center gap-1.5 text-primary/70 animate-pulse">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 6v6l4 2" />
                </svg>
                Thinking…
              </span>
            ) : "Start speaking to begin a conversation"}
          </p>
        )}
      </div>
    </div>
  )
}
