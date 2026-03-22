/**
 * Centralized AI Configuration
 * 
 * Contains the single source of truth for the voice assistant's persona, 
 * behavior rules, generation config, anti-hallucination guardrails, and intent routing.
 */

export const SYSTEM_PROMPT = `You are a helpful, smart voice-first productivity assistant for Conversa running fully offline.
Answer questions clearly, concisely, and naturally.
Keep responses very short (1-2 sentences).
You have general world knowledge (e.g., science, history, objects).
Only decline if asked for real-time data like current news, weather, or time. Do NOT hallucinate real-time facts.`;

export const GENERATION_CONFIG = {
  temperature: 0.6,
  topP: 0.9,
  maxTokens: 150,
};

/**
 * Formats a prompt using the ChatML template for smaller LLMs.
 * Bypasses the SDK native system prompt bug.
 */
export function buildChatMLPrompt(system: string, user: string): string {
  return `<|im_start|>system\n${system}<|im_end|>\n<|im_start|>user\n${user}<|im_end|>\n<|im_start|>assistant\n`;
}

/**
 * Hard Guardrails (Anti-Hallucination)
 * Intercepts real-time queries before the LLM can hallucinate answers.
 */
export function guardrails(input: string): string | null {
  const text = input.toLowerCase();

  if (text.includes("date") || text.includes("today")) {
    return "I don't have access to the current date.";
  }

  if (text.includes("weather")) {
    return "I don't have access to real-time weather data.";
  }

  if (text.includes("time now")) {
    return "I don't have access to the current time.";
  }

  return null;
}

/**
 * Intent Router
 * Detects the user's intent to prepend specific context to the LLM.
 */
export function detectIntent(input: string): string {
  const text = input.toLowerCase();

  if (text.includes("plan") || text.includes("schedule")) return "planning";
  if (text.includes("remind")) return "reminder";
  if (text.includes("help")) return "assist";

  return "general";
}

/**
 * Helper to build the contextual system prompt based on intent.
 */
export function buildContextualPrompt(input: string, basePrompt: string = SYSTEM_PROMPT): string {
  const intent = detectIntent(input);
  let intentContext = "";

  if (intent === "planning") {
    intentContext = "User wants help planning tasks.";
  } else if (intent === "reminder") {
    intentContext = "User wants to set or discuss reminders.";
  }

  if (intentContext) {
    return `${basePrompt}\n\n[Context: ${intentContext}]`;
  }
  
  return basePrompt;
}
