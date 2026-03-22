/**
 * Hook to initialize and monitor RunAnywhere SDK
 * Provides detailed error reporting for debugging
 */

'use client';

import { useState, useEffect } from 'react';
import { initializeAI, loadVoiceModels } from '@/lib/ai-service';

export interface InitStatus {
  stage: 'idle' | 'sdk-init' | 'model-load' | 'complete' | 'error';
  progress: number;
  message: string;
  error?: string;
}

export function useSDKInitialization() {
  const [status, setStatus] = useState<InitStatus>({
    stage: 'idle',
    progress: 0,
    message: 'Starting...',
  });

  useEffect(() => {
    let cancelled = false;

    async function initialize() {
      try {
        // Stage 1: SDK Initialization
        setStatus({
          stage: 'sdk-init',
          progress: 10,
          message: 'Initializing SDK...',
        });

        await initializeAI();
        
        if (cancelled) return;
        
        setStatus({
          stage: 'sdk-init',
          progress: 30,
          message: 'SDK initialized, loading models...',
        });

        // Stage 2: Model Loading
        setStatus({
          stage: 'model-load',
          progress: 40,
          message: 'Loading AI models...',
        });

        await loadVoiceModels((modelId, progress) => {
          if (cancelled) return;
          
          const overallProgress = 40 + (progress * 0.6);
          setStatus({
            stage: 'model-load',
            progress: overallProgress,
            message: `Loading ${modelId}: ${Math.round(progress)}%`,
          });
        });

        if (cancelled) return;

        // Complete
        setStatus({
          stage: 'complete',
          progress: 100,
          message: 'All models loaded successfully!',
        });

      } catch (error) {
        if (cancelled) return;

        console.error('[useSDKInitialization] Error:', error);
        
        setStatus({
          stage: 'error',
          progress: 0,
          message: 'Failed to initialize',
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    // Only run in browser
    if (typeof window !== 'undefined') {
      initialize();
    }

    return () => {
      cancelled = true;
    };
  }, []);

  return status;
}
