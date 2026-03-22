"use client"

import { cn } from "@/lib/utils"

export type AssistantMode = "productivity" | "learning" | "wellness" | "language" | "cooking"

export const MODES: { id: AssistantMode; label: string; color: string; icon: React.ReactNode }[] = [
  {
    id: "productivity",
    label: "Productivity",
    color: "#4F8EF7",
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
      </svg>
    ),
  },
  {
    id: "learning",
    label: "Learning",
    color: "#A78BFA",
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
        <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
      </svg>
    ),
  },
  {
    id: "wellness",
    label: "Wellness",
    color: "#34D399",
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
      </svg>
    ),
  },
  {
    id: "language",
    label: "Language",
    color: "#FBBF24",
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <line x1="2" y1="12" x2="22" y2="12" />
        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
      </svg>
    ),
  },
  {
    id: "cooking",
    label: "Cooking",
    color: "#F87171",
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 8h1a4 4 0 0 1 0 8h-1" />
        <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z" />
        <line x1="6" y1="1" x2="6" y2="4" />
        <line x1="10" y1="1" x2="10" y2="4" />
        <line x1="14" y1="1" x2="14" y2="4" />
      </svg>
    ),
  },
]

interface ModeSelectorProps {
  activeMode: AssistantMode
  onChange: (mode: AssistantMode) => void
}

export function ModeSelector({ activeMode, onChange }: ModeSelectorProps) {
  return (
    <div className="flex items-center gap-2 flex-wrap justify-center">
      {MODES.map((mode) => {
        const isActive = mode.id === activeMode
        return (
          <button
            key={mode.id}
            onClick={() => onChange(mode.id)}
            className={cn(
              "flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-sm font-medium transition-all duration-300",
              "border focus:outline-none",
              isActive
                ? "text-background shadow-lg scale-105"
                : "border-border/50 text-muted-foreground hover:text-foreground hover:border-border bg-transparent"
            )}
            style={
              isActive
                ? {
                    backgroundColor: mode.color,
                    borderColor: mode.color,
                    boxShadow: `0 0 16px ${mode.color}55`,
                    color: "#0B0F19",
                  }
                : {}
            }
          >
            <span style={{ color: isActive ? "#0B0F19" : mode.color }}>{mode.icon}</span>
            {mode.label}
          </button>
        )
      })}
    </div>
  )
}
