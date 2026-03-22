"use client"

import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"

interface Plugin {
  id: string
  name: string
  description: string
  color: string
  icon: React.ReactNode
  component: React.ReactNode
}

function CalculatorPlugin() {
  const [display, setDisplay] = useState("0")
  const [prev, setPrev] = useState<number | null>(null)
  const [op, setOp] = useState<string | null>(null)
  const [waitingForNewValue, setWaitingForNewValue] = useState(false)

  function calculate(a: number, b: number, operation: string) {
    switch (operation) {
      case "+": return a + b
      case "-": return a - b
      case "×": return a * b
      case "÷": return b === 0 ? NaN : a / b
      default: return b
    }
  }

  function handleNum(n: string) {
    if (waitingForNewValue) {
      setDisplay(n === "." ? "0." : n)
      setWaitingForNewValue(false)
    } else {
      if (n === "." && display.includes(".")) return
      setDisplay(display === "0" && n !== "." ? n : display + n)
    }
  }

  function handleOp(nextOp: string) {
    const inputValue = parseFloat(display)

    if (prev === null) {
      setPrev(inputValue)
    } else if (op && !waitingForNewValue) {
      const currentValue = prev || 0
      const newValue = calculate(currentValue, inputValue, op)
      setPrev(newValue)
      setDisplay(String(parseFloat(newValue.toFixed(8))))
    }

    setWaitingForNewValue(true)
    setOp(nextOp)
  }

  function handleEquals() {
    if (op === null || prev === null) return
    const inputValue = parseFloat(display)
    const newValue = calculate(prev, inputValue, op)
    setDisplay(String(parseFloat(newValue.toFixed(8))))
    setPrev(null)
    setOp(null)
    setWaitingForNewValue(true)
  }

  function handleClear() {
    setDisplay("0")
    setPrev(null)
    setOp(null)
    setWaitingForNewValue(false)
  }

  const btns = ["C", "±", "%", "÷", "7", "8", "9", "×", "4", "5", "6", "-", "1", "2", "3", "+", "0", ".", "="]

  return (
    <div className="bg-black/40 rounded-xl p-3 w-full">
      <div className="text-right text-2xl font-light text-foreground mb-3 px-2 py-1 rounded-lg bg-black/30 truncate min-h-[2.5rem]">{display}</div>
      <div className="grid grid-cols-4 gap-1.5">
        {btns.map((b) => (
          <button
            key={b}
            onClick={() => {
              if (b === "C") handleClear()
              else if (b === "=") handleEquals()
              else if (["+", "-", "×", "÷"].includes(b)) handleOp(b)
              else if (b === "±") setDisplay(String(-parseFloat(display)))
              else if (b === "%") setDisplay(String(parseFloat(display) / 100))
              else handleNum(b)
            }}
            className={cn(
              "py-2.5 rounded-lg text-sm font-medium transition-all active:scale-95",
              b === "=" ? "bg-primary text-primary-foreground col-span-1" : "",
              ["÷", "×", "-", "+"].includes(b) ? "bg-amber-500/80 text-white" : "",
              ["C", "±", "%"].includes(b) ? "bg-secondary text-foreground" : "",
              !["=", "÷", "×", "-", "+", "C", "±", "%"].includes(b) ? "bg-muted/60 text-foreground hover:bg-muted" : ""
            )}
          >{b}</button>
        ))}
      </div>
    </div>
  )
}

function TimerPlugin() {
  const [seconds, setSeconds] = useState(0)
  const [running, setRunning] = useState(false)
  const [intervalId, setIntervalId] = useState<NodeJS.Timeout | null>(null)
  const [preset, setPreset] = useState(0)

  function start() {
    if (running) return
    setRunning(true)
    const id = setInterval(() => setSeconds((s) => s + 1), 1000)
    setIntervalId(id)
  }
  function pause() {
    if (intervalId) clearInterval(intervalId)
    setRunning(false)
  }
  function reset() {
    if (intervalId) clearInterval(intervalId)
    setRunning(false); setSeconds(0)
  }
  function setTimer(s: number) {
    reset(); setPreset(s); setSeconds(s)
  }

  const m = Math.floor(seconds / 60).toString().padStart(2, "0")
  const s = (seconds % 60).toString().padStart(2, "0")

  return (
    <div className="flex flex-col items-center gap-3 w-full">
      <div className="text-4xl font-mono font-light text-foreground">{m}:{s}</div>
      <div className="flex gap-2">
        {[60, 300, 600, 1500].map((t) => (
          <button key={t} onClick={() => setTimer(t)} className="text-xs px-2 py-1 rounded-lg bg-secondary text-muted-foreground hover:text-foreground transition-colors">
            {t < 60 ? `${t}s` : `${t/60}m`}
          </button>
        ))}
      </div>
      <div className="flex gap-2 w-full">
        <button onClick={running ? pause : start} className="flex-1 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium transition-opacity hover:opacity-90">
          {running ? "Pause" : "Start"}
        </button>
        <button onClick={reset} className="flex-1 py-2 rounded-xl bg-secondary text-foreground text-sm font-medium transition-opacity hover:opacity-80">
          Reset
        </button>
      </div>
    </div>
  )
}

interface Note {
  id: string
  text: string
  time: string
}

function NotesPlugin() {
  const [notes, setNotes] = useState<Note[]>([])
  const [newNoteText, setNewNoteText] = useState("")
  const [isLoaded, setIsLoaded] = useState(false)

  // Load from localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("conversa-notes")
      if (stored) {
        try {
          setNotes(JSON.parse(stored))
        } catch (e) {
          console.error("Failed to parse notes", e)
        }
      }
      setIsLoaded(true)
    }
  }, [])

  // Save to localStorage
  useEffect(() => {
    if (isLoaded && typeof window !== "undefined") {
      localStorage.setItem("conversa-notes", JSON.stringify(notes))
    }
  }, [notes, isLoaded])

  function addNote() {
    if (!newNoteText.trim()) return
    setNotes((prev) => [
      {
        id: Date.now().toString(),
        text: newNoteText.trim(),
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      },
      ...prev,
    ])
    setNewNoteText("")
  }

  function deleteNote(id: string) {
    setNotes((prev) => prev.filter((n) => n.id !== id))
  }

  return (
    <div className="w-full flex flex-col gap-3">
      {/* Add note */}
      <div className="flex gap-2">
        <input
          type="text"
          value={newNoteText}
          onChange={(e) => setNewNoteText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addNote()}
          placeholder="Jot down a quick note..."
          className={cn(
            "flex-1 px-4 py-2.5 rounded-xl text-sm bg-black/30 border border-border/30",
            "text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary/50",
            "transition-all duration-200"
          )}
        />
        <button
          onClick={addNote}
          className="px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity active:scale-95 flex-shrink-0"
        >
          Add
        </button>
      </div>

      {/* Note list */}
      <div className="flex flex-col gap-2 max-h-48 overflow-y-auto pr-1">
        {notes.map((note) => (
          <div
            key={note.id}
            className="flex items-start gap-3 px-3.5 py-3 rounded-xl border border-border/30 bg-black/20 group transition-all duration-200"
          >
            <div className="flex-1 min-w-0">
              <p className="text-sm text-foreground/90 whitespace-pre-wrap leading-relaxed">{note.text}</p>
              <div className="text-[10px] text-muted-foreground/60 mt-1.5">{note.time}</div>
            </div>
            
            <button
              onClick={() => deleteNote(note.id)}
              className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground/50 hover:text-destructive-foreground p-1 flex-shrink-0"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        ))}

        {notes.length === 0 && (
          <div className="text-center py-6 text-muted-foreground/50 text-xs">
            No notes yet. Add one above.
          </div>
        )}
      </div>
    </div>
  )
}

const PLUGINS: Plugin[] = [
  {
    id: "calculator",
    name: "Calculator",
    description: "Quick math operations",
    color: "#4F8EF7",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="4" y="2" width="16" height="20" rx="2" />
        <line x1="8" y1="6" x2="16" y2="6" /><line x1="8" y1="10" x2="16" y2="10" />
        <line x1="8" y1="14" x2="12" y2="14" /><line x1="8" y1="18" x2="10" y2="18" />
      </svg>
    ),
    component: <CalculatorPlugin />,
  },
  {
    id: "timer",
    name: "Timer",
    description: "Focus & countdown timer",
    color: "#34D399",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="13" r="8" /><path d="M12 9v4l2 2" />
        <path d="M5 3 2 6" /><path d="M22 6l-3-3" /><path d="M6.38 18.7 4 21" /><path d="M17.64 18.67 20 21" />
      </svg>
    ),
    component: <TimerPlugin />,
  },
  {
    id: "notes",
    name: "Notes",
    description: "Voice & text note taking",
    color: "#A78BFA",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" />
      </svg>
    ),
    component: <NotesPlugin />,
  },
]

export function PluginsScreen() {
  const [activePlugin, setActivePlugin] = useState<string | null>(null)

  return (
    <div className="flex flex-col gap-6 p-6 max-w-4xl mx-auto w-full">
      <div>
        <h2 className="text-xl font-semibold text-foreground">Plugins</h2>
        <p className="text-sm text-muted-foreground mt-0.5">Extend Conversa with quick tools</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {PLUGINS.map((plugin) => {
          const isActive = activePlugin === plugin.id
          return (
            <div
              key={plugin.id}
              className={cn(
                "rounded-2xl border transition-all duration-300",
                isActive ? "border-border bg-card/70 backdrop-blur-sm" : "border-border/40 bg-card/30 hover:border-border/70 hover:bg-card/50"
              )}
              style={isActive ? { boxShadow: `0 0 24px ${plugin.color}22` } : {}}
            >
              {/* Header */}
              <button
                onClick={() => setActivePlugin(isActive ? null : plugin.id)}
                className="w-full flex items-center gap-3 p-4 text-left"
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: plugin.color + "22", color: plugin.color }}
                >
                  {plugin.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-foreground">{plugin.name}</div>
                  <div className="text-xs text-muted-foreground">{plugin.description}</div>
                </div>
                <svg
                  width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                  strokeLinecap="round" strokeLinejoin="round"
                  className={cn("text-muted-foreground transition-transform duration-200", isActive && "rotate-180")}
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>

              {/* Expanded panel */}
              {isActive && (
                <div className="px-4 pb-4 border-t border-border/30 pt-3">
                  {plugin.component}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
