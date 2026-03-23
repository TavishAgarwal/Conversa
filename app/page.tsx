"use client"

import { useState, useEffect } from "react"
import { TopNav } from "@/components/conversa/top-nav"
import { VoiceUI } from "@/frontend/ui/VoiceUI"
import { DashboardScreen } from "@/components/conversa/dashboard-screen"
import { TasksScreen } from "@/components/conversa/tasks-screen"
import { PluginsScreen } from "@/components/conversa/plugins-screen"
import { PrivacyScreen } from "@/components/conversa/privacy-screen"
import { isLLMLoaded, loadLLM } from "@/frontend/llm/model"

type NavTab = "voice" | "dashboard" | "tasks" | "plugins" | "privacy"

export default function ConversaApp() {
  const [activeTab, setActiveTab] = useState<NavTab>("voice")
  const [modelsReady, setModelsReady] = useState(false)
  const [loadProgress, setLoadProgress] = useState(0)
  const [loadError, setLoadError] = useState<string | null>(null)

  // Load models ONCE at the page level — survives all tab switches
  useEffect(() => {
    if (isLLMLoaded()) {
      setModelsReady(true)
      setLoadProgress(100)
      return
    }

    loadLLM((progress) => setLoadProgress(progress))
      .then(() => setModelsReady(true))
      .catch(err => {
        console.error(err)
        setLoadError(err.message || String(err))
      })
  }, [])

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Ambient background glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden" aria-hidden>
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] rounded-full opacity-10"
          style={{
            background: "radial-gradient(ellipse at center, oklch(0.65 0.22 258) 0%, transparent 70%)",
            filter: "blur(80px)",
          }}
        />
        <div
          className="absolute bottom-0 right-1/4 w-[400px] h-[300px] rounded-full opacity-8"
          style={{
            background: "radial-gradient(ellipse at center, oklch(0.55 0.28 290) 0%, transparent 70%)",
            filter: "blur(80px)",
          }}
        />
      </div>

      {/* Navigation */}
      <TopNav activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Screen content */}
      <main className="flex-1 relative overflow-auto">
        {!modelsReady ? (
          <div className="flex flex-col h-full items-center justify-center min-h-[500px] p-4 relative z-50">
            <div className="w-full max-w-md p-8 bg-background/80 backdrop-blur-sm rounded-2xl border border-border/50 text-center shadow-lg">
              {loadError ? (
                <>
                  <div className="text-red-500 font-bold mb-4 text-xl">Failed to load models.</div>
                  <div className="text-xs font-mono bg-red-500/10 text-red-500 p-4 rounded-xl text-left overflow-auto max-h-40 border border-red-500/20">{loadError}</div>
                  <div className="mt-4 text-sm text-foreground opacity-80">Ensure internet is connected for the initial weights download, then refresh.</div>
                </>
              ) : (
                <>
                  <div className="text-lg font-medium mb-6 animate-pulse">Initializing Local AI Pipeline...</div>
                  <div className="w-full bg-muted rounded-full h-2 mb-3 overflow-hidden">
                    <div className="bg-primary h-full rounded-full transition-all duration-300 shadow-[0_0_10px_rgba(var(--primary),0.5)]" style={{ width: `${loadProgress}%` }} />
                  </div>
                  <div className="text-xs text-muted-foreground font-mono">{Math.round(loadProgress)}% initialized</div>
                </>
              )}
            </div>
          </div>
        ) : (
          <>
            {/* VoiceUI stays mounted — hidden when not active to preserve state */}
            <div style={{ display: activeTab === "voice" ? "block" : "none" }}>
              <VoiceUI />
            </div>
            {activeTab === "dashboard" && <DashboardScreen />}
            {activeTab === "tasks" && <TasksScreen />}
            {activeTab === "plugins" && <PluginsScreen />}
            {activeTab === "privacy" && <PrivacyScreen />}
          </>
        )}
      </main>
    </div>
  )
}
