'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { initializeAI, areVoiceModelsLoaded, loadVoiceModels } from '@/lib/ai-service';

export type ModelStatusType = 'idle' | 'checking' | 'downloading' | 'loading' | 'ready' | 'error';

export interface ModelStatusDetails {
  id: string;
  name: string;
  progress: number;
  status: 'pending' | 'loading' | 'loaded' | 'error';
}

interface ModelContextState {
  modelStatus: ModelStatusType;
  modelStatuses: ModelStatusDetails[];
  error: string;
  isDownloading: boolean;
  isInitialized: boolean;
  retryDownload: () => void;
}

const ModelContext = createContext<ModelContextState | null>(null);

export function ModelProvider({ children }: { children: React.ReactNode }) {
  const [modelStatus, setModelStatus] = useState<ModelStatusType>('idle');
  const [error, setError] = useState('');
  const [isDownloading, setIsDownloading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [modelStatuses, setModelStatuses] = useState<ModelStatusDetails[]>([
    { id: 'lfm2-350m-q4_k_m', name: 'LFM2 350M (LLM)', progress: 0, status: 'pending' },
    { id: 'sherpa-onnx-whisper-tiny.en', name: 'Whisper Tiny (STT)', progress: 0, status: 'pending' },
    { id: 'vits-piper-en_US-lessac-medium', name: 'Piper TTS', progress: 0, status: 'pending' },
    { id: 'silero-vad-v5', name: 'Silero VAD', progress: 0, status: 'pending' },
  ]);

  const loadModels = async () => {
    if (isDownloading || modelStatus === 'ready' || modelStatus === 'downloading' || modelStatus === 'loading') return;
    
    setIsDownloading(true);
    setModelStatus('checking');
    setError('');

    try {
      console.log('[ModelContext] Initializing AI SDK...');
      await initializeAI();
      
      setModelStatus('loading');
      
      let wasAnyDownloaded = false;
      await loadVoiceModels((modelId, progress, isDownloadingModel) => {
        if (isDownloadingModel) {
          wasAnyDownloaded = true;
          setModelStatus('downloading');
        }
        
        setModelStatuses(prev => 
          prev.map(m => {
            if (m.id === modelId) {
              const newStatus = progress >= 100 ? 'loaded' : (isDownloadingModel ? 'loading' : 'pending');
              return { ...m, progress, status: newStatus };
            }
            return m;
          })
        );
      });
      
      setModelStatuses(prev => prev.map(m => ({ ...m, status: 'loaded', progress: 100 })));
      setModelStatus('ready');
      setIsInitialized(true);
    } catch (err) {
      console.error('[ModelContext] Error loading models:', err);
      setError(err instanceof Error ? err.message : 'Failed to load models');
      setModelStatus('error');
      setModelStatuses(prev => prev.map(m => m.status === 'loaded' ? m : { ...m, status: 'error' }));
    } finally {
      setIsDownloading(false);
    }
  };

  useEffect(() => {
    loadModels();
  }, []); // Run ONCE on mount

  return (
    <ModelContext.Provider value={{
      modelStatus,
      modelStatuses,
      error,
      isDownloading,
      isInitialized,
      retryDownload: loadModels
    }}>
      {children}
    </ModelContext.Provider>
  );
}

export function useModelContext() {
  const context = useContext(ModelContext);
  if (!context) throw new Error('useModelContext must be used within ModelProvider');
  return context;
}
