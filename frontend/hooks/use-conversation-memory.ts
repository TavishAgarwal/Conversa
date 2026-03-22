/**
 * Hook for managing conversation history with the AI assistant.
 * Stores messages in memory with optional persistence to localStorage.
 */

'use client';

import { useState, useEffect, useCallback } from 'react';

export interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

const STORAGE_KEY = 'conversa-conversation-history';
const MAX_HISTORY_LENGTH = 20; // Keep last 20 messages

export function useConversationMemory() {
  const [messages, setMessages] = useState<Message[]>([]);

  // Load from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        try {
          setMessages(JSON.parse(stored));
        } catch (error) {
          console.error('Failed to load conversation history:', error);
        }
      }
    }
  }, []);

  // Save to localStorage whenever messages change
  useEffect(() => {
    if (typeof window !== 'undefined' && messages.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    }
  }, [messages]);

  /** Add a user message */
  const addUserMessage = useCallback((content: string) => {
    setMessages((prev) => {
      const newMessages = [
        ...prev,
        { role: 'user' as const, content, timestamp: Date.now() },
      ];
      // Trim to max length
      return newMessages.slice(-MAX_HISTORY_LENGTH);
    });
  }, []);

  /** Add an assistant message */
  const addAssistantMessage = useCallback((content: string) => {
    setMessages((prev) => {
      const newMessages = [
        ...prev,
        { role: 'assistant' as const, content, timestamp: Date.now() },
      ];
      // Trim to max length
      return newMessages.slice(-MAX_HISTORY_LENGTH);
    });
  }, []);

  /** Clear all messages */
  const clearHistory = useCallback(() => {
    setMessages([]);
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  /** Get recent context for LLM (last N messages) */
  const getRecentContext = useCallback((count: number = 6) => {
    return messages.slice(-count);
  }, [messages]);

  return {
    messages,
    addUserMessage,
    addAssistantMessage,
    clearHistory,
    getRecentContext,
  };
}
