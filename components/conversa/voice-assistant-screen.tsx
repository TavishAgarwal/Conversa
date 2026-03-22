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
  VoiceActivityDetector,
  processVoiceTurn,
} from "@/lib/ai-service"
import { SYSTEM_PROMPT, buildContextualPrompt } from "@/lib/ai-config"
import { useModelContext } from "@/components/context/ModelContext"

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
  
  const { 
    modelStatuses, 
    error: contextError, 
    isInitialized, 
    modelStatus 
  } = useModelContext()
  
  const [localError, setLocalError] = useState<string>("")
  const error = localError || contextError;
  const isLoadingModels = modelStatus === 'downloading' || modelStatus === 'loading' || modelStatus === 'checking';

  const vadRef = useRef<VoiceActivityDetector | null>(null)
  const { addUserMessage, addAssistantMessage, getRecentContext } = useConversationMemory()

  const currentMode = MODES.find((m) => m.id === mode)!
  const modeColor = currentMode.color

  // SDK initialization and model loading is now handled globally by ModelContext

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
    setLocalError("")

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
            const history = getRecentContext(10);
            let contextualPrompt = buildContextualPrompt(userText || "", SYSTEM_PROMPT);
            if (history.length > 0) {
              const historyText = history
                .map(msg => `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`)
                .join('\n');
              contextualPrompt += `\n\nRecent Conversation History:\n${historyText}`;
            }

            // Process the voice turn
            await processVoiceTurn(audioData, contextualPrompt, {
              onTranscription: (text) => {
                console.log("LLM INPUT:", text)
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
                setLocalError(err.message)
                setOrbState("idle")
              },
            })
          } catch (err) {
            console.error('Failed to process voice turn:', err)
            setLocalError(err instanceof Error ? err.message : 'Failed to process speech')
            setOrbState("idle")
          }
        },
        onError: (err) => {
          console.error('VAD error:', err)
          setLocalError(err.message)
          setOrbState("idle")
        },
      })
    } catch (err) {
      console.error('Failed to start listening:', err)
      setLocalError(err instanceof Error ? err.message : 'Failed to access microphone')
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
    setLocalError("")
  }

  return (
    <div className="flex flex-col items-center gap-8 py-6 px-4 min-h-full">
      {/* Model loading overlay */}
      {(isLoadingModels && !isInitialized) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <ModelLoader 
            isLoading={isLoadingModels}
            models={modelStatuses as any}
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
