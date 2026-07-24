import { promises as fs } from "fs"
import path from "path"
import { DEFAULT_SETTINGS, type AssistantSettings } from "@/lib/assistant-config"
import { readJsonDict, writeJsonDict } from "./json-store"

export type { AssistantModel, AssistantSettings } from "@/lib/assistant-config"
export { ALLOWED_MODELS, DEFAULT_SYSTEM_PROMPT, DEFAULT_SETTINGS, isValidModel } from "@/lib/assistant-config"

const DATA_DIR = path.join(process.cwd(), "data")
const FILE = path.join(DATA_DIR, "assistant-settings.json")
const OVERRIDES_FILE = "assistant-settings-overrides.json"

export async function getAssistantSettings(): Promise<AssistantSettings> {
  try {
    const raw = await fs.readFile(FILE, "utf-8")
    const parsed = JSON.parse(raw) as Partial<AssistantSettings>
    return { ...DEFAULT_SETTINGS, ...parsed }
  } catch {
    return DEFAULT_SETTINGS
  }
}

export async function saveAssistantSettings(settings: AssistantSettings): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true })
  await fs.writeFile(FILE, JSON.stringify(settings, null, 2))
}

export async function getAssistantSettingsOverride(auditId: string): Promise<AssistantSettings | null> {
  const overrides = await readJsonDict<AssistantSettings>(OVERRIDES_FILE)
  return overrides[auditId] ?? null
}

export async function saveAssistantSettingsOverride(auditId: string, settings: AssistantSettings): Promise<void> {
  const overrides = await readJsonDict<AssistantSettings>(OVERRIDES_FILE)
  overrides[auditId] = settings
  await writeJsonDict(OVERRIDES_FILE, overrides)
}

export async function clearAssistantSettingsOverride(auditId: string): Promise<void> {
  const overrides = await readJsonDict<AssistantSettings>(OVERRIDES_FILE)
  delete overrides[auditId]
  await writeJsonDict(OVERRIDES_FILE, overrides)
}

export async function getEffectiveAssistantSettings(
  auditId?: string,
): Promise<{ settings: AssistantSettings; isOverridden: boolean }> {
  if (auditId) {
    const override = await getAssistantSettingsOverride(auditId)
    if (override) return { settings: override, isOverridden: true }
  }
  return { settings: await getAssistantSettings(), isOverridden: false }
}
