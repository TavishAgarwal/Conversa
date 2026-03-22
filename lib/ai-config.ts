/**
 * Centralized AI Configuration
 * 
 * Contains the single source of truth for the voice assistant's persona, 
 * behavior rules, generation config, anti-hallucination guardrails, and intent routing.
 */

export const SYSTEM_PROMPT = `You are a voice-first productivity assistant running fully offline.

You help users with:
- daily tasks
- planning
- quick explanations

You do NOT have:
- real-time data
- internet access

Rules:
- Never hallucinate
- If unknown, say: "I don’t have access to that information"
- Keep responses short (max 2–3 sentences)
- Use simple, natural spoken language
- Avoid long paragraphs`;

export const GENERATION_CONFIG = {
  temperature: 0.2,
  topP: 0.9,
  maxTokens: 150,
};

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
