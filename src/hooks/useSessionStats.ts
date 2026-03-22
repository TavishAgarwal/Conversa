import { useState, useCallback } from 'react';

export function useSessionStats() {
  const [wordsSpoken, setWordsSpoken] = useState(0);
  const [aiResponses, setAiResponses] = useState(0);

  const addWords = useCallback((text: string) => {
    const count = text.trim().split(/\s+/).filter(w => w.length > 0).length;
    setWordsSpoken(prev => prev + count);
  }, []);

  const addResponse = useCallback(() => {
    setAiResponses(prev => prev + 1);
  }, []);

  return { wordsSpoken, aiResponses, addWords, addResponse };
}
