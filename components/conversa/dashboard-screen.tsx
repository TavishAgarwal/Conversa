"use client"

import { useState, useEffect, useMemo } from "react"
import { useConversationMemory } from "@/hooks/use-conversation-memory"
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts"

const customTooltipStyle = {
  backgroundColor: "oklch(0.13 0.012 260)",
  border: "1px solid oklch(0.22 0.015 260)",
  borderRadius: "12px",
  color: "oklch(0.95 0.005 260)",
  fontSize: "12px",
}

export function DashboardScreen() {
  const { messages } = useConversationMemory()
  const [tasks, setTasks] = useState<any[]>([])
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
    const stored = localStorage.getItem("conversa-tasks")
    if (stored) {
      try {
        setTasks(JSON.parse(stored))
      } catch (e) {
        // ignore
      }
    }
  }, [])

  const tasksCompleted = tasks.filter(t => t.status === "done").length
  const totalMessages = messages.length
  const userMessages = messages.filter(m => m.role === 'user').length
  let usageMinutes = 0
  if (messages.length > 0) {
    const sorted = [...messages].sort((a, b) => a.timestamp - b.timestamp)
    let sessionStart = sorted[0].timestamp
    let previousTime = sorted[0].timestamp

    for (let i = 1; i < sorted.length; i++) {
       const m = sorted[i]
       if (m.timestamp - previousTime > 10 * 60 * 1000) {
          usageMinutes += Math.max(1, Math.round((previousTime - sessionStart) / 60000))
          sessionStart = m.timestamp
       }
       previousTime = m.timestamp
    }
    usageMinutes += Math.max(1, Math.round((previousTime - sessionStart) / 60000))
  }

  const statsCards = [
    {
      label: "Total Messages",
      value: totalMessages.toString(),
      change: isClient && messages.length > 0 ? `Since ${new Date(messages[0].timestamp).toLocaleDateString()}` : "All time",
      positive: true,
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      ),
      color: "#4F8EF7",
    },
    {
      label: "Tasks Completed",
      value: tasksCompleted.toString(),
      change: isClient ? `${tasks.length} Total tasks` : "All time",
      positive: true,
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="9 11 12 14 22 4" />
          <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
        </svg>
      ),
      color: "#34D399",
    },
    {
      label: "Est. Usage Time",
      value: `${usageMinutes}m`,
      change: isClient ? "Active session lengths" : "",
      positive: true,
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
      ),
      color: "#A78BFA",
    },
    {
      label: "Voice Turns",
      value: userMessages.toString(),
      change: isClient ? "Spoken to assistant" : "",
      positive: true,
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z" />
          <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
        </svg>
      ),
      color: "#FBBF24",
    },
  ]

  // Generate activity data for the last 7 days
  const activityData = useMemo(() => {
    const data = []
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today)
      d.setDate(d.getDate() - i)
      
      const dayStr = d.toLocaleDateString('en-US', { weekday: 'short' })
      const startTime = d.getTime()
      const endTime = startTime + 24 * 60 * 60 * 1000

      const convCount = messages.filter(m => m.timestamp && m.timestamp >= startTime && m.timestamp < endTime).length
      const taskCount = tasks.filter(t => {
        const ts = parseInt(t.id)
        return !isNaN(ts) && ts >= startTime && ts < endTime
      }).length

      data.push({
        day: dayStr,
        conversations: convCount,
        tasks: taskCount
      })
    }
    return data
  }, [messages, tasks])

  // Generate Interaction Volume Today
  const interactionData = useMemo(() => {
    const data: any[] = []
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const startTime = today.getTime()
    
    const todaysMessages = messages.filter(m => m.timestamp && m.timestamp >= startTime)
    
    if (todaysMessages.length === 0) {
      return []
    }

    const buckets: Record<string, { totalChars: number }> = {}
    let minHour = 24
    let maxHour = 0
    
    todaysMessages.forEach(m => {
      const d = new Date(m.timestamp)
      const hour = d.getHours()
      if (hour < minHour) minHour = hour
      if (hour > maxHour) maxHour = hour
      
      const ampm = hour >= 12 ? 'pm' : 'am'
      const displayHour = hour > 12 ? hour - 12 : (hour === 0 ? 12 : hour)
      const timeStr = `${displayHour}${ampm}`
      
      if (!buckets[timeStr]) buckets[timeStr] = { totalChars: 0 }
      buckets[timeStr].totalChars += m.content.length
    })
    
    let startH = Math.max(0, minHour - 2)
    let endH = Math.min(23, maxHour + 2)
    
    for (let h = startH; h <= endH; h++) {
       const ampm = h >= 12 ? 'pm' : 'am'
       const displayHour = h > 12 ? h - 12 : (h === 0 ? 12 : h)
       const timeStr = `${displayHour}${ampm}`
       data.push({
           time: timeStr,
           volume: buckets[timeStr] ? buckets[timeStr].totalChars : 0
       })
    }
    
    return data
  }, [messages])

  // Ensure consistent hydration
  if (!isClient) {
    return null;
  }

  return (
    <div className="flex flex-col gap-6 p-6 max-w-5xl mx-auto w-full">
      <div>
        <h2 className="text-xl font-semibold text-foreground">Analytics</h2>
        <p className="text-sm text-muted-foreground mt-0.5">Your activity overview</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statsCards.map((card) => (
          <div
            key={card.label}
            className="rounded-2xl border border-border/50 bg-card/50 backdrop-blur-sm p-4"
            style={{ boxShadow: `0 0 20px ${card.color}11` }}
          >
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center mb-3"
              style={{ backgroundColor: card.color + "22", color: card.color }}
            >
              {card.icon}
            </div>
            <div className="text-2xl font-bold text-foreground">{card.value}</div>
            <div className="text-xs text-muted-foreground mt-1">{card.label}</div>
            <div className="text-xs mt-1" style={{ color: card.color }}>{card.change}</div>
          </div>
        ))}
      </div>

      {/* Activity chart */}
      <div className="rounded-2xl border border-border/50 bg-card/50 backdrop-blur-sm p-5">
        <h3 className="text-sm font-semibold text-foreground mb-4">Activity Over Time</h3>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={activityData}>
            <defs>
              <linearGradient id="colorConv" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#4F8EF7" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#4F8EF7" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorTasks" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#A78BFA" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#A78BFA" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.22 0.015 260)" vertical={false} />
            <XAxis dataKey="day" tick={{ fill: "oklch(0.55 0.02 260)", fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: "oklch(0.55 0.02 260)", fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={customTooltipStyle} cursor={{ stroke: "oklch(0.35 0.02 260)" }} />
            <Area type="monotone" dataKey="conversations" stroke="#4F8EF7" strokeWidth={2} fill="url(#colorConv)" name="Conversations" />
            <Area type="monotone" dataKey="tasks" stroke="#A78BFA" strokeWidth={2} fill="url(#colorTasks)" name="Tasks" />
          </AreaChart>
        </ResponsiveContainer>
        <div className="flex items-center gap-4 mt-2">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: "#4F8EF7" }} />
            Conversations
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: "#A78BFA" }} />
            Tasks
          </div>
        </div>
      </div>

      {/* Interaction Volume */}
      <div className="rounded-2xl border border-border/50 bg-card/50 backdrop-blur-sm p-5">
        <h3 className="text-sm font-semibold text-foreground mb-1">Interaction Volume Today</h3>
        <p className="text-xs text-muted-foreground mb-4">Character count of your messages per hour</p>
        <ResponsiveContainer width="100%" height={160}>
          <LineChart data={interactionData}>
            <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.22 0.015 260)" vertical={false} />
            <XAxis dataKey="time" tick={{ fill: "oklch(0.55 0.02 260)", fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: "oklch(0.55 0.02 260)", fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={customTooltipStyle} cursor={{ stroke: "oklch(0.35 0.02 260)" }} />
            <Line type="monotone" dataKey="volume" stroke="#34D399" strokeWidth={2.5} dot={{ fill: "#34D399", r: 3, strokeWidth: 0 }} name="Characters" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
