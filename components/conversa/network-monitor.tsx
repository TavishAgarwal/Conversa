"use client"

import { useState, useEffect, useRef } from "react"
import { cn } from "@/lib/utils"

export function NetworkMonitor({ className }: { className?: string }) {
  const [requestCount, setRequestCount] = useState(0)
  const countRef = useRef(0)
  const installedRef = useRef(false)

  useEffect(() => {
    if (typeof window === "undefined" || installedRef.current) return
    installedRef.current = true

    // Intercept fetch
    const originalFetch = window.fetch
    window.fetch = function (...args) {
      const url = typeof args[0] === "string" ? args[0] : args[0] instanceof Request ? args[0].url : ""
      // Only count external requests (not local dev server / HMR)
      if (url && !url.startsWith("/") && !url.startsWith("blob:") && !url.includes("localhost") && !url.includes("127.0.0.1") && !url.includes("_next")) {
        countRef.current++
        setRequestCount(countRef.current)
      }
      return originalFetch.apply(this, args)
    }

    // Intercept XMLHttpRequest
    const originalOpen = XMLHttpRequest.prototype.open
    XMLHttpRequest.prototype.open = function (method: string, url: string | URL, ...rest: any[]) {
      const urlStr = typeof url === "string" ? url : url.toString()
      if (urlStr && !urlStr.startsWith("/") && !urlStr.startsWith("blob:") && !urlStr.includes("localhost") && !urlStr.includes("127.0.0.1") && !urlStr.includes("_next")) {
        this.addEventListener("loadstart", () => {
          countRef.current++
          setRequestCount(countRef.current)
        }, { once: true })
      }
      return (originalOpen as any).apply(this, [method, url, ...rest])
    }

    return () => {
      window.fetch = originalFetch
      XMLHttpRequest.prototype.open = originalOpen
    }
  }, [])

  return (
    <div
      className={cn(
        "flex items-center gap-2 px-3 py-1.5 rounded-xl",
        "bg-card/60 backdrop-blur-md border border-border/40",
        "animate-in fade-in duration-500",
        className
      )}
    >
      <div className="flex items-center gap-1.5">
        <svg
          width="10"
          height="10"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={requestCount === 0 ? "text-emerald-400" : "text-amber-400"}
        >
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
        <span className="text-[10px] font-mono font-semibold text-emerald-400">
          Network: {requestCount} requests
        </span>
      </div>
      <div className="w-px h-3 bg-border/40" />
      <div className="flex items-center gap-1">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
        <span className="text-[10px] font-semibold text-emerald-400/80">
          Running locally
        </span>
      </div>
    </div>
  )
}
