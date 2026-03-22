"use client"

import { useState, useEffect, useRef } from "react"
import { VoiceOrb } from "./voice-orb"
import { SubtitlesPanel } from "./subtitles-panel"
import { ModeSelector, MODES, type AssistantMode } from "./mode-selector"
import { StatusBar } from "./status-bar"
import { FloatingControls } from "./floating-controls"
import { ModelLoader } from "./model-loader"
import { useConversationMemory } from "@/hooks/use-conversation-memory"
import {
  initializeAI,
  loadVoiceModels,
  areVoiceModelsLoaded,
  VoiceActivityDetector,
  processVoiceTurn,
} from "@/lib/ai-service"

type OrbState = "idle" | "listening" | "thinking" | "speaking"

interface ModelStatus {
  id: string;
  name: string;
  progress: number;
  status: 'pending' | 'loading' | 'loaded' | 'error';
}

const MODE_SYSTEM_PROMPTS: Record<AssistantMode, string> = {
  productivity: "You are a productivity assistant. Help users focus, prioritize tasks, and manage their time effectively. Keep responses concise and actionable.",
  learning: "You are an educational assistant. Explain concepts clearly and simply, using analogies when helpful. Encourage curiosity and understanding.",
  wellness: "You are a wellness coach. Provide supportive, calming guidance for stress, mindfulness, and self-care. Be empathetic and encouraging.",
  language: "You are a language tutor. Help users learn and practice languages with clear pronunciation guides and cultural context.",
  cooking: "You are a cooking assistant. Provide clear recipes, techniques, and culinary tips. Be practical and encouraging.",
}

export function VoiceAssistantScreen() {
  const [orbState, setOrbState] = useState<OrbState>("idle")
  const [mode, setMode] = useState<AssistantMode>("productivity")
  const [userText, setUserText] = useState("")
  const [aiText, setAiText] = useState("")
  const [isStreaming, setIsStreaming] = useState(false)
  const [isInitialized, setIsInitialized] = useState(false)
  const [isLoadingModels, setIsLoadingModels] = useState(false)
  const [modelStatuses, setModelStatuses] = useState<ModelStatus[]>([
    { id: 'lfm2-350m-q4_k_m', name: 'LFM2 350M (LLM)', progress: 0, status: 'pending' },
    { id: 'sherpa-onnx-whisper-tiny.en', name: 'Whisper Tiny (STT)', progress: 0, status: 'pending' },
    { id: 'vits-piper-en_US-lessac-medium', name: 'Piper TTS', progress: 0, status: 'pending' },
    { id: 'silero-vad-v5', name: 'Silero VAD', progress: 0, status: 'pending' },
  ])
  const [error, setError] = useState<string>("")

  const vadRef = useRef<VoiceActivityDetector | null>(null)
  const { addUserMessage, addAssistantMessage, getRecentContext } = useConversationMemory()

  const currentMode = MODES.find((m) => m.id === mode)!
  const modeColor = currentMode.color

  // Initialize SDK and load models on mount
  useEffect(() => {
    async function init() {
      try {
        setIsLoadingModels(true)
        setError("") // Clear any previous error
        
        console.log('[VoiceAssistant] Starting initialization...')
        
        // Step 1: Initialize SDK
        console.log('[VoiceAssistant] Step 1: Initializing AI SDK...')
        await initializeAI()
        console.log('[VoiceAssistant] SDK initialized successfully')
        
        // Step 2: Load models
        console.log('[VoiceAssistant] Step 2: Loading voice models...')
        await loadVoiceModels((modelId, progress) => {
          console.log(`[VoiceAssistant] Model ${modelId}: ${progress}%`)
          setModelStatuses(prev => 
            prev.map(m => 
              m.id === modelId 
                ? { ...m, progress, status: progress >= 100 ? 'loaded' : 'loading' }
                : m
            )
          )
        })

        // Mark all as loaded
        console.log('[VoiceAssistant] All models loaded successfully')
        setModelStatuses(prev => prev.map(m => ({ ...m, status: 'loaded', progress: 100 })))
        setIsInitialized(true)
        setIsLoadingModels(false)
      } catch (err) {
        console.error('[VoiceAssistant] Initialization failed:', err)
        console.error('[VoiceAssistant] Error stack:', err instanceof Error ? err.stack : 'No stack trace')
        
        const errorMessage = err instanceof Error ? err.message : 'Failed to load models'
        console.error('[VoiceAssistant] Error message:', errorMessage)
        
        setError(errorMessage)
        setModelStatuses(prev => prev.map(m => ({ ...m, status: 'error' })))
        setIsLoadingModels(false)
      }
    }

    init()
  }, [])

  async function handleOrbClick() {
    if (!isInitialized || isLoadingModels) return

    if (orbState === "idle") {
      await startListening()
    } else if (orbState === "listening") {
      stopListening()
    }
  }

  async function startListening() {
    setOrbState("listening")
    setUserText("")
    setAiText("")
    setError("")

    try {
      if (!vadRef.current) {
        vadRef.current = new VoiceActivityDetector()
      }

      await vadRef.current.start({
        onSpeechStart: () => {
          console.log('Speech detected')
        },
        onSpeechEnd: async (audioData) => {
          console.log('Speech ended, processing...')
          setOrbState("thinking")
          
          try {
            // Get system prompt for current mode
            const systemPrompt = MODE_SYSTEM_PROMPTS[mode] + 
              " Keep responses concise — 1-2 sentences max for voice interaction.";

            // Process the voice turn
            await processVoiceTurn(audioData, systemPrompt, {
              onTranscription: (text) => {
                setUserText(text)
                addUserMessage(text)
              },
              onGenerationStart: () => {
                setOrbState("speaking")
                setIsStreaming(true)
                setAiText("")
              },
              onGenerationToken: (token) => {
                setAiText(prev => prev + token)
              },
              onGenerationComplete: (text) => {
                addAssistantMessage(text)
                setIsStreaming(false)
              },
              onSynthesisComplete: () => {
                setOrbState("idle")
              },
              onError: (err) => {
                console.error('Voice processing error:', err)
                setError(err.message)
                setOrbState("idle")
              },
            })
          } catch (err) {
            console.error('Failed to process voice turn:', err)
            setError(err instanceof Error ? err.message : 'Failed to process speech')
            setOrbState("idle")
          }
        },
        onError: (err) => {
          console.error('VAD error:', err)
          setError(err.message)
          setOrbState("idle")
        },
      })
    } catch (err) {
      console.error('Failed to start listening:', err)
      setError(err instanceof Error ? err.message : 'Failed to access microphone')
      setOrbState("idle")
    }
  }

  function stopListening() {
    if (vadRef.current) {
      vadRef.current.stop()
    }
    setOrbState("idle")
  }

  function handleInterrupt() {
    stopListening()
    setIsStreaming(false)
  }

  function handleReset() {
    stopListening()
    setUserText("")
    setAiText("")
    setIsStreaming(false)
    setError("")
  }

  return (
    <div className="flex flex-col items-center gap-8 py-6 px-4 min-h-full">
      {/* Model loading overlay */}
      {(isLoadingModels || !isInitialized) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <ModelLoader 
            isLoading={isLoadingModels}
            models={modelStatuses}
            error={error}
          />
        </div>
      )}

      {/* Status bar */}
      <StatusBar
        micActive={orbState === "listening"}
        isThinking={orbState === "thinking"}
        isOffline
      />

      {/* Mode selector */}
      <ModeSelector activeMode={mode} onChange={setMode} />

      {/* Voice Orb — centerpiece */}
      <div className="flex-1 flex items-center justify-center py-6">
        <VoiceOrb 
          state={orbState} 
          modeColor={modeColor} 
          onClick={handleOrbClick}
          disabled={!isInitialized || isLoadingModels}
        />
      </div>

      {/* Error message - detailed for debugging */}
      {error && (
        <div className="w-full max-w-xl p-4 bg-destructive/10 text-destructive rounded-lg text-sm space-y-2">
          <div className="font-semibold">Error loading AI models:</div>
          <div className="text-xs font-mono whitespace-pre-wrap">{error}</div>
          <div className="text-xs opacity-70">
            Check browser console (F12) for detailed logs
          </div>
        </div>
      )}

      {/* Subtitles */}
      <SubtitlesPanel
        userText={userText}
        aiText={aiText}
        isStreaming={isStreaming}
        className="w-full max-w-xl"
      />

      {/* Floating controls */}
      <FloatingControls
        orbState={orbState}
        onToggleListen={handleOrbClick}
        onInterrupt={handleInterrupt}
        onReset={handleReset}
        modeColor={modeColor}
      />
    </div>
  )
}
