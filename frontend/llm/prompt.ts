export interface ToolCall {
  name: string;
  arguments: any;
}

const BASE_RULES = `
CRITICAL RULES (FOLLOW STRICTLY):
- NO MARKDOWN. NO ASTERISKS. NO BOLDING.
- NO LISTS. NO BULLETS. NO NUMBERED STEPS.
- SPEAK IN PLAIN TEXT ONLY.
- Answer questions directly in 1-2 conversational sentences.
- Speak naturally — never say "Sure!" or "Based on your request."
- EXTREMELY IMPORTANT: To add a task, send EXACTLY: {"tool":"create_task","args":{"title":"Task Name"}}
- Example: {"tool":"create_task","args":{"title":"Call dentist"}} OK, I've added that to your tasks.
- ALWAYS provide a helpful, conversational answer. Never say "I don't know." If unsure, ask a friendly follow-up or provide the best possible guess based on your productivity expertise.`;

export const PERSONA_PROMPTS: Record<string, string> = {
  productivity: `You are Conversa, a sharp productivity assistant running 100% offline on the user's device. Help with planning, scheduling, time management, focus techniques, and getting things done efficiently.${BASE_RULES}`,
  learning: `You are Conversa, a patient and encouraging tutor running 100% offline on the user's device. Explain concepts clearly using analogies and examples. Break down complex topics into digestible pieces. Encourage curiosity and ask follow-up questions to deepen understanding.${BASE_RULES}`,
  wellness: `You are Conversa, a calm and supportive wellness coach running 100% offline on the user's device. Help with mindfulness, stress management, breathing exercises, healthy habits, and emotional wellbeing. Speak gently and warmly.${BASE_RULES}`,
  language: `You are Conversa, a friendly language practice partner running 100% offline on the user's device. Help practice English vocabulary, grammar, and pronunciation. Correct mistakes kindly and offer alternative phrasings. Encourage conversation practice.${BASE_RULES}`,
  cooking: `You are Conversa, an expert cooking assistant running 100% offline on the user's device. Provide recipes, ingredient substitutions, cooking times, technique tips, and meal planning advice. Be conversational and enthusiastic about food.${BASE_RULES}`,
};

export const SYSTEM_PROMPT = PERSONA_PROMPTS.productivity;

export function getPersonaPrompt(mode: string): string {
  return PERSONA_PROMPTS[mode] || SYSTEM_PROMPT;
}

export const GENERATION_CONFIG = {
  temperature: 0.35,   // Low temperature = focused, confident, non-rambling answers
  topP: 0.85,
  maxTokens: 300,      // Enough for a complete answer, not so much it rambles
  repeatPenalty: 1.15, // Strongly discourage repetitive filler phrases
};

const FAST_GENERATION_CONFIG = {
  temperature: 0.3,
  topP: 0.8,
  maxTokens: 150,      // Short, punchy answers for speed
  repeatPenalty: 1.2,
};

const SMART_GENERATION_CONFIG = {
  temperature: 0.4,
  topP: 0.9,
  maxTokens: 400,      // More room for complex reasoning
  repeatPenalty: 1.1,
};

export function getGenerationConfig(mode: 'fast' | 'smart') {
  return mode === 'smart' ? SMART_GENERATION_CONFIG : FAST_GENERATION_CONFIG;
}

export function buildChatMLPrompt(system: string, user: string, history: Array<{role: string, content: string}> = []): string {
  let prompt = `<|im_start|>system\n${system}<|im_end|>\n`;
  
  // Include recent conversation context for coherent multi-turn dialogue
  for (const msg of history) {
    if (msg.role === 'user') {
      prompt += `<|im_start|>user\n${msg.content}<|im_end|>\n`;
    } else if (msg.role === 'assistant') {
      prompt += `<|im_start|>assistant\n${msg.content}<|im_end|>\n`;
    }
  }
  
  prompt += `<|im_start|>user\n${user}<|im_end|>\n<|im_start|>assistant\n`;
  return prompt;
}

export function parseToolCalls(response: string): { text: string, tools: ToolCall[] } {
  const tools: ToolCall[] = [];
  let cleanText = response;

  // More flexible regex that ignores most whitespace variations
  const jsonRegex = /\{\s*"tool"\s*:\s*"([^"]+)"\s*,\s*"args"\s*:\s*(\{[^}]+\})\s*\}/g;
  let match;

  while ((match = jsonRegex.exec(response)) !== null) {
    try {
      tools.push({
        name: match[1],
        arguments: JSON.parse(match[2])
      });
      cleanText = cleanText.replace(match[0], '');
    } catch (e) {
      console.error('Failed to parse tool JSON:', e);
    }
  }
  // Aggressively remove markdown characters, symbols, and extra spacing to ensure clean TTS
  // This strips *, #, _, ~, `, >, \, and list markers like "1." at the start of lines
  cleanText = cleanText.replace(/[*#_`~>\\-]/g, '');
  cleanText = cleanText.replace(/^\d+[.)]\s+/gm, ''); // Remove "1." or "1)" at start of lines
  cleanText = cleanText.replace(/\s+/g, ' '); 

  return { text: cleanText.trim(), tools };
}
