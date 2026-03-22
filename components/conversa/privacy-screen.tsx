"use client"

import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"

export function PrivacyScreen() {
  const [cleared, setCleared] = useState(false)
  const [lsSize, setLsSize] = useState<string>("Calculating...")
  const [opfsSize, setOpfsSize] = useState<string>("Calculating...")
  const [activeModels, setActiveModels] = useState<any[]>([])

  useEffect(() => {
    if (typeof window !== 'undefined') {
      import('@runanywhere/web').then(({ ModelManager }) => {
        const models = ModelManager.getModels() || []
        setActiveModels(models)
      }).catch(e => console.error(e))
    }
  }, [])

  useEffect(() => {
    if (typeof window !== 'undefined') {
      let size = 0
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key) size += localStorage.getItem(key)?.length || 0
      }
      setLsSize(size > 1024 ? `${(size / 1024).toFixed(1)} KB` : `${size} B`)

      if (navigator.storage && navigator.storage.estimate) {
        navigator.storage.estimate().then(({ usage }) => {
          if (usage !== undefined) {
            setOpfsSize(`${(usage / (1024 * 1024)).toFixed(1)} MB`)
          } else {
            setOpfsSize("Unknown")
          }
        })
      } else {
        setOpfsSize("Unsupported")
      }
    }
  }, [])

  function handleClearData() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('conversa-conversation-history')
      localStorage.removeItem('conversa-tasks')
      localStorage.clear()
      setLsSize("0 B")
    }
    setCleared(true)
    setTimeout(() => setCleared(false), 3000)
  }

  return (
    <div className="flex flex-col gap-6 p-6 max-w-2xl mx-auto w-full">
      <div>
        <h2 className="text-xl font-semibold text-foreground">Privacy</h2>
        <p className="text-sm text-muted-foreground mt-0.5">Your data never leaves your device</p>
      </div>

      {/* Offline banner */}
      <div className="rounded-2xl border border-emerald-700/40 bg-emerald-950/30 p-5 flex gap-4">
        <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center flex-shrink-0">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-emerald-300">Runs Fully Offline</h3>
          <p className="text-xs text-emerald-500/80 mt-1 leading-relaxed">
            Conversa processes all audio and text entirely on your device. No data is ever sent to any server. No internet connection required after initial model download.
          </p>
        </div>
      </div>

      {/* Local storage breakdown */}
      <div className="rounded-2xl border border-border/50 bg-card/50 backdrop-blur-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-border/30">
          <h3 className="text-sm font-semibold text-foreground">Local Storage Breakdown</h3>
          <p className="text-xs text-muted-foreground mt-0.5">All data stored locally in your browser</p>
        </div>
        <div className="divide-y divide-border/20">
          <div className="flex items-center justify-between px-5 py-3.5">
            <div>
              <div className="text-sm text-foreground">App Data & Settings</div>
              <div className="text-xs text-muted-foreground mt-0.5">localStorage</div>
            </div>
            <div className="text-sm text-muted-foreground font-mono">{lsSize}</div>
          </div>
          <div className="flex items-center justify-between px-5 py-3.5">
            <div>
              <div className="text-sm text-foreground">AI Model Weights</div>
              <div className="text-xs text-muted-foreground mt-0.5">OPFS (Origin Private File System)</div>
            </div>
            <div className="text-sm text-muted-foreground font-mono">{opfsSize}</div>
          </div>
        </div>
      </div>

      {/* Model info */}
      <div className="rounded-2xl border border-border/50 bg-card/50 backdrop-blur-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-border/30">
          <h3 className="text-sm font-semibold text-foreground">On-Device Models</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Models registered with the SDK context</p>
        </div>
        <div className="divide-y divide-border/20">
          {activeModels.length > 0 ? activeModels.map((model, i) => (
            <div key={i} className="px-5 py-3.5 flex items-start justify-between gap-4">
              <div>
                <div className="text-xs text-muted-foreground uppercase tracking-wide">{model.status || "Unknown"}</div>
                <div className="text-sm font-semibold text-foreground mt-0.5">{model.name || model.id}</div>
              </div>
              <div className="text-xs text-muted-foreground text-right max-w-[180px] leading-relaxed break-all">
                {model.id}
              </div>
            </div>
          )) : (
            <div className="px-5 py-4 text-sm text-muted-foreground">Loading SDK...</div>
          )}
        </div>
      </div>

      {/* Privacy highlights */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { icon: "🔒", label: "End-to-end local", desc: "All processing stays on your device" },
          { icon: "🌐", label: "No tracking", desc: "Zero analytics, zero telemetry" },
          { icon: "🗑️", label: "Ephemeral sessions", desc: "Clear all data with one click" },
          { icon: "📦", label: "Open source", desc: "Audit the code any time" },
        ].map((item) => (
          <div key={item.label} className="rounded-xl border border-border/40 bg-card/30 p-3.5">
            <div className="text-lg mb-1.5">{item.icon}</div>
            <div className="text-xs font-semibold text-foreground">{item.label}</div>
            <div className="text-xs text-muted-foreground mt-0.5">{item.desc}</div>
          </div>
        ))}
      </div>

      {/* Offline Benchmark */}
      <OfflineBenchmark />

      {/* Clear data */}
      <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-5 flex items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Clear All Data</h3>
          <p className="text-xs text-muted-foreground mt-1">
            Permanently remove all conversations, tasks, and settings stored locally.
          </p>
        </div>
        <button
          onClick={handleClearData}
          className={cn(
            "flex-shrink-0 px-4 py-2 rounded-xl text-sm font-medium border transition-all duration-300 active:scale-95",
            cleared
              ? "bg-emerald-950/50 border-emerald-700/50 text-emerald-400"
              : "bg-destructive/20 border-destructive/40 text-destructive-foreground hover:bg-destructive/30"
          )}
        >
          {cleared ? "Cleared" : "Clear Data"}
        </button>
      </div>
    </div>
  )
}

function OfflineBenchmark() {
  const [status, setStatus] = useState<'idle' | 'running' | 'done'>('idle')
  const [result, setResult] = useState<{ llmMs: number; tokPerSec: number; isOffline: boolean } | null>(null)

  async function runBenchmark() {
    setStatus('running')
    setResult(null)

    try {
      const isOffline = !navigator.onLine
      const { ExtensionPoint } = await import('@runanywhere/web')
      const textGen: any = ExtensionPoint.requireProvider('llm', '@runanywhere/web-llamacpp')
      
      const prompt = '<|im_start|>system\nYou are a helpful assistant.\n<|im_end|>\n<|im_start|>user\nWhat is 2 + 2?\n<|im_end|>\n<|im_start|>assistant\n'
      
      const start = performance.now()
      let tokenCount = 0
      const { stream } = await textGen.generateStream(prompt, { temperature: 0.3, maxTokens: 50 })
      
      for await (const _token of stream) {
        tokenCount++
      }
      
      const elapsed = performance.now() - start
      const tokPerSec = elapsed > 0 ? Math.round((tokenCount / elapsed) * 1000 * 10) / 10 : 0

      setResult({ llmMs: Math.round(elapsed), tokPerSec, isOffline })
      setStatus('done')
    } catch (e) {
      console.error('Benchmark failed:', e)
      setStatus('idle')
    }
  }

  return (
    <div className="rounded-2xl border border-blue-700/30 bg-blue-950/20 p-5">
      <div className="flex items-center justify-between gap-4 mb-3">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Offline Benchmark</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Verify the AI pipeline works without internet. Disconnect WiFi and run!
          </p>
        </div>
        <button
          onClick={runBenchmark}
          disabled={status === 'running'}
          className={cn(
            "flex-shrink-0 px-4 py-2 rounded-xl text-sm font-medium border transition-all duration-300 active:scale-95",
            status === 'running'
              ? "bg-blue-950/50 border-blue-700/50 text-blue-400 animate-pulse cursor-wait"
              : "bg-blue-500/20 border-blue-500/40 text-blue-400 hover:bg-blue-500/30"
          )}
        >
          {status === 'running' ? 'Running...' : status === 'done' ? 'Run Again' : 'Run Benchmark'}
        </button>
      </div>
      {result && (
        <div className="grid grid-cols-3 gap-3 mt-3">
          <div className="rounded-lg bg-card/40 p-3 text-center">
            <div className="text-xs text-muted-foreground">Network</div>
            <div className={cn("text-sm font-bold mt-0.5", result.isOffline ? "text-emerald-400" : "text-amber-400")}>
              {result.isOffline ? "✓ Offline" : "Online"}
            </div>
          </div>
          <div className="rounded-lg bg-card/40 p-3 text-center">
            <div className="text-xs text-muted-foreground">Latency</div>
            <div className="text-sm font-bold text-blue-400 mt-0.5">{(result.llmMs / 1000).toFixed(1)}s</div>
          </div>
          <div className="rounded-lg bg-card/40 p-3 text-center">
            <div className="text-xs text-muted-foreground">Speed</div>
            <div className="text-sm font-bold text-purple-400 mt-0.5">{result.tokPerSec} tok/s</div>
          </div>
        </div>
      )}
    </div>
  )
}
