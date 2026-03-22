"use client"

import { useState } from "react"
import { TopNav } from "@/components/conversa/top-nav"
import { VoiceAssistantScreen } from "@/components/conversa/voice-assistant-screen"
import { DashboardScreen } from "@/components/conversa/dashboard-screen"
import { TasksScreen } from "@/components/conversa/tasks-screen"
import { PluginsScreen } from "@/components/conversa/plugins-screen"
import { PrivacyScreen } from "@/components/conversa/privacy-screen"

type NavTab = "voice" | "dashboard" | "tasks" | "plugins" | "privacy"

export default function ConversaApp() {
  const [activeTab, setActiveTab] = useState<NavTab>("voice")

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
        {activeTab === "voice" && <VoiceAssistantScreen />}
        {activeTab === "dashboard" && <DashboardScreen />}
        {activeTab === "tasks" && <TasksScreen />}
        {activeTab === "plugins" && <PluginsScreen />}
        {activeTab === "privacy" && <PrivacyScreen />}
      </main>
    </div>
  )
}
