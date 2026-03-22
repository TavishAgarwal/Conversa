"use client"

import { cn } from "@/lib/utils"
import { DemoGuide } from "@/components/conversa/demo-guide"

type NavTab = "voice" | "dashboard" | "tasks" | "plugins" | "privacy"

interface NavItem {
  id: NavTab
  label: string
  icon: React.ReactNode
}

const NAV_ITEMS: NavItem[] = [
  {
    id: "voice",
    label: "Voice",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z" />
        <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
        <line x1="12" y1="19" x2="12" y2="22" />
      </svg>
    ),
  },
  {
    id: "dashboard",
    label: "Dashboard",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
      </svg>
    ),
  },
  {
    id: "tasks",
    label: "Tasks",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <line x1="8" y1="6" x2="21" y2="6" />
        <line x1="8" y1="12" x2="21" y2="12" />
        <line x1="8" y1="18" x2="21" y2="18" />
        <line x1="3" y1="6" x2="3.01" y2="6" />
        <line x1="3" y1="12" x2="3.01" y2="12" />
        <line x1="3" y1="18" x2="3.01" y2="18" />
      </svg>
    ),
  },
  {
    id: "plugins",
    label: "Plugins",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2l2 7h7l-5.5 4 2 7L12 16l-5.5 4 2-7L3 9h7z" />
      </svg>
    ),
  },
  {
    id: "privacy",
    label: "Privacy",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
    ),
  },
]

interface TopNavProps {
  activeTab: NavTab
  onTabChange: (tab: NavTab) => void
}

export function TopNav({ activeTab, onTabChange }: TopNavProps) {
  return (
    <header className="flex items-center justify-between px-6 py-3 border-b border-border/40 bg-card/30 backdrop-blur-xl sticky top-0 z-50">
      {/* Logo */}
      <div className="flex items-center gap-2.5">
        <div className="w-7 h-7 rounded-lg bg-primary/20 border border-primary/30 flex items-center justify-center">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--color-primary)" }}>
            <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z" />
            <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
          </svg>
        </div>
        <span className="text-sm font-semibold text-foreground tracking-tight">Conversa</span>
      </div>

      {/* Nav tabs */}
      <nav className="flex items-center gap-1" aria-label="Main navigation">
        {NAV_ITEMS.map((item) => {
          const isActive = item.id === activeTab
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={cn(
                "flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-medium transition-all duration-200",
                "focus:outline-none",
                isActive
                  ? "bg-primary/15 text-primary border border-primary/25"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary/60 border border-transparent"
              )}
            >
              {item.icon}
              <span className="hidden sm:inline">{item.label}</span>
            </button>
          )
        })}
      </nav>

      {/* Right side: Demo Guide + Version badge */}
      <div className="flex items-center gap-2.5">
        <DemoGuide />
        <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-950/60 border border-emerald-700/40 text-emerald-400 text-xs font-medium">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          Offline
        </div>
        <div className="text-xs text-muted-foreground/50 hidden lg:block">v1.0.0</div>
      </div>
    </header>
  )
}
