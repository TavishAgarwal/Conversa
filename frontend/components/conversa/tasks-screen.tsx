"use client"

import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"

type TaskStatus = "pending" | "done"

interface Task {
  id: string
  text: string
  status: TaskStatus
  voiceAdded: boolean
  time: string
}

export function TasksScreen() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [isLoaded, setIsLoaded] = useState(false)

  // Load tasks from localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("conversa-tasks")
      if (stored) {
        try {
          setTasks(JSON.parse(stored))
        } catch (e) {
          console.error("Failed to parse tasks", e)
        }
      }
      setIsLoaded(true)
    }
  }, [])

  // Save tasks to localStorage
  useEffect(() => {
    if (isLoaded && typeof window !== "undefined") {
      localStorage.setItem("conversa-tasks", JSON.stringify(tasks))
    }
  }, [tasks, isLoaded])
  const [newTaskText, setNewTaskText] = useState("")
  const [filter, setFilter] = useState<"all" | "pending" | "done">("all")

  const filteredTasks = tasks.filter((t) => filter === "all" || t.status === filter)
  const pending = tasks.filter((t) => t.status === "pending").length
  const done = tasks.filter((t) => t.status === "done").length

  function toggleTask(id: string) {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status: t.status === "done" ? "pending" : "done" } : t))
    )
  }

  function addTask() {
    if (!newTaskText.trim()) return
    setTasks((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        text: newTaskText.trim(),
        status: "pending",
        voiceAdded: false,
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      },
    ])
    setNewTaskText("")
  }

  function deleteTask(id: string) {
    setTasks((prev) => prev.filter((t) => t.id !== id))
  }

  return (
    <div className="flex flex-col gap-6 p-6 max-w-2xl mx-auto w-full">
      {/* Header */}
      <div>
        <h2 className="text-xl font-semibold text-foreground">Tasks</h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          <span className="text-primary">{pending}</span> pending &middot; <span className="text-emerald-400">{done}</span> completed
        </p>
      </div>

      {/* Add task */}
      <div className="flex gap-2">
        <input
          type="text"
          value={newTaskText}
          onChange={(e) => setNewTaskText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addTask()}
          placeholder="Add a task manually..."
          className={cn(
            "flex-1 px-4 py-2.5 rounded-xl text-sm bg-input border border-border/50",
            "text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/60",
            "transition-colors duration-200"
          )}
        />
        <button
          onClick={addTask}
          className="px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity active:scale-95"
        >
          Add
        </button>
        <button
          className="px-3 py-2.5 rounded-xl border border-border/50 bg-secondary/60 text-muted-foreground hover:text-foreground transition-colors"
          title="Add via voice"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z" />
            <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
          </svg>
        </button>
      </div>

      {/* Filter pills */}
      <div className="flex gap-2">
        {(["all", "pending", "done"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              "px-3.5 py-1.5 rounded-full text-xs font-semibold capitalize transition-all duration-200 border",
              filter === f
                ? "bg-primary/20 border-primary/50 text-primary"
                : "border-border/40 text-muted-foreground hover:text-foreground"
            )}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Task list */}
      <div className="flex flex-col gap-2">
        {filteredTasks.map((task) => (
          <div
            key={task.id}
            className={cn(
              "flex items-center gap-3 px-4 py-3.5 rounded-2xl border transition-all duration-200 group",
              task.status === "done"
                ? "border-border/30 bg-card/20 opacity-60"
                : "border-border/50 bg-card/50 hover:border-border"
            )}
          >
            {/* Checkbox */}
            <button
              onClick={() => toggleTask(task.id)}
              className={cn(
                "w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all duration-200",
                task.status === "done"
                  ? "bg-emerald-500/80 border-emerald-500"
                  : "border-border hover:border-primary"
              )}
            >
              {task.status === "done" && (
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              )}
            </button>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <p className={cn("text-sm text-foreground leading-relaxed", task.status === "done" && "line-through text-muted-foreground")}>
                {task.text}
              </p>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xs text-muted-foreground/60">{task.time}</span>
                {task.voiceAdded && (
                  <span className="flex items-center gap-1 text-xs text-primary/70">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z" />
                    </svg>
                    Voice
                  </span>
                )}
              </div>
            </div>

            {/* Delete */}
            <button
              onClick={() => deleteTask(task.id)}
              className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground/50 hover:text-destructive-foreground p-1"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
              </svg>
            </button>
          </div>
        ))}

        {filteredTasks.length === 0 && (
          <div className="text-center py-12 text-muted-foreground/50 text-sm">
            No {filter === "all" ? "" : filter} tasks
          </div>
        )}
      </div>
    </div>
  )
}
