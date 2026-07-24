export type AssistantModel = "meta/llama-3.1-8b-instruct" | "meta/llama-3.1-70b-instruct" | "mistralai/mixtral-8x7b-instruct-v0.1"

export interface AssistantSettings {
  model: AssistantModel
  temperature: number
  maxTokens: number
  systemPrompt: string
  assistantEnabled: boolean
}

export const ALLOWED_MODELS: AssistantModel[] = [
  "meta/llama-3.1-8b-instruct",
  "meta/llama-3.1-70b-instruct",
  "mistralai/mixtral-8x7b-instruct-v0.1",
]

export const DEFAULT_SYSTEM_PROMPT =
  "You are the HR governance assistant embedded in an HR Governance Audit application, used here by employees, HR managers, and administrators. " +
  "You answer general questions about HR governance, compliance, and workplace policy. " +
  "Be concise, factual, and professional. Do not use hyphens in your responses; prefer complete words or alternative phrasing."

export const DEFAULT_SETTINGS: AssistantSettings = {
  model: "meta/llama-3.1-8b-instruct",
  temperature: 0.5,
  maxTokens: 1024,
  systemPrompt: DEFAULT_SYSTEM_PROMPT,
  assistantEnabled: true,
}

export function isValidModel(model: unknown): model is AssistantModel {
  return typeof model === "string" && (ALLOWED_MODELS as string[]).includes(model)
}
