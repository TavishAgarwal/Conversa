/**
 * Model loading progress component.
 * Shows download/initialization progress for AI models.
 */

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Loader2, AlertCircle } from 'lucide-react';

interface ModelStatus {
  id: string;
  name: string;
  progress: number;
  status: 'pending' | 'loading' | 'loaded' | 'error';
}

interface ModelLoaderProps {
  isLoading: boolean;
  models: ModelStatus[];
  error?: string;
}

export function ModelLoader({ isLoading, models, error }: ModelLoaderProps) {
  if (!isLoading && models.every(m => m.status === 'loaded')) {
    return null; // Don't show if all models are loaded
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {isLoading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : error ? (
            <AlertCircle className="h-5 w-5 text-destructive" />
          ) : (
            <CheckCircle2 className="h-5 w-5 text-green-500" />
          )}
          Loading AI Models
        </CardTitle>
        <CardDescription>
          {error
            ? 'Failed to load models'
            : isLoading
            ? 'Downloading models for offline use...'
            : 'All models loaded successfully'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <div className="p-3 text-sm bg-destructive/10 text-destructive rounded-md">
            {error}
          </div>
        )}
        
        {models.map((model) => (
          <div key={model.id} className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">{model.name}</span>
                {model.status === 'loaded' && (
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                )}
                {model.status === 'loading' && (
                  <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                )}
                {model.status === 'error' && (
                  <AlertCircle className="h-4 w-4 text-destructive" />
                )}
              </div>
              <Badge variant={model.status === 'loaded' ? 'default' : 'secondary'}>
                {model.status === 'loaded'
                  ? 'Ready'
                  : model.status === 'loading'
                  ? `${Math.round(model.progress)}%`
                  : model.status === 'error'
                  ? 'Error'
                  : 'Pending'}
              </Badge>
            </div>
            <Progress value={model.progress} className="h-2" />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
