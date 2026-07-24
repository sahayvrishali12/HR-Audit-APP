import { promises as fs } from "fs"
import path from "path"
import { AUDIT_DOCUMENTS } from "@/lib/documents"
import { DEFAULT_MATURITY_THRESHOLDS, type MaturityThresholds } from "@/lib/audit-types"
import { DEFAULT_CRITICAL_DOCUMENTS } from "@/lib/ai-summary"
import { readJsonDict, writeJsonDict } from "./json-store"

export type { MaturityThresholds }
export { DEFAULT_CRITICAL_DOCUMENTS }

export interface SummarySettings {
  thresholds: MaturityThresholds
  criticalDocuments: string[]
}

export const DEFAULT_THRESHOLDS: MaturityThresholds = DEFAULT_MATURITY_THRESHOLDS

export const DEFAULT_SUMMARY_SETTINGS: SummarySettings = {
  thresholds: DEFAULT_THRESHOLDS,
  criticalDocuments: DEFAULT_CRITICAL_DOCUMENTS,
}

const DATA_DIR = path.join(process.cwd(), "data")
const FILE = path.join(DATA_DIR, "summary-settings.json")
const OVERRIDES_FILE = "summary-settings-overrides.json"

export function isValidThresholds(value: unknown): value is MaturityThresholds {
  if (!value || typeof value !== "object") return false
  const t = value as Partial<MaturityThresholds>
  if (![t.nonCompliantMax, t.partiallyCompliantMax, t.compliantMax].every((n) => typeof n === "number" && Number.isFinite(n))) {
    return false
  }
  const { nonCompliantMax, partiallyCompliantMax, compliantMax } = t as MaturityThresholds
  return nonCompliantMax > 0 && nonCompliantMax < partiallyCompliantMax && partiallyCompliantMax < compliantMax && compliantMax < 100
}

export function isValidCriticalDocuments(value: unknown): value is string[] {
  if (!Array.isArray(value)) return false
  const validNames = new Set(AUDIT_DOCUMENTS.map((d) => d.name))
  return value.every((name) => typeof name === "string" && validNames.has(name))
}

export async function getSummarySettings(): Promise<SummarySettings> {
  try {
    const raw = await fs.readFile(FILE, "utf-8")
    const parsed = JSON.parse(raw) as Partial<SummarySettings>
    return {
      thresholds: isValidThresholds(parsed.thresholds) ? parsed.thresholds : DEFAULT_THRESHOLDS,
      criticalDocuments: isValidCriticalDocuments(parsed.criticalDocuments) ? parsed.criticalDocuments : DEFAULT_CRITICAL_DOCUMENTS,
    }
  } catch {
    return DEFAULT_SUMMARY_SETTINGS
  }
}

export async function saveSummarySettings(settings: SummarySettings): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true })
  await fs.writeFile(FILE, JSON.stringify(settings, null, 2))
}

export async function getSummarySettingsOverride(auditId: string): Promise<SummarySettings | null> {
  const overrides = await readJsonDict<SummarySettings>(OVERRIDES_FILE)
  return overrides[auditId] ?? null
}

export async function saveSummarySettingsOverride(auditId: string, settings: SummarySettings): Promise<void> {
  const overrides = await readJsonDict<SummarySettings>(OVERRIDES_FILE)
  overrides[auditId] = settings
  await writeJsonDict(OVERRIDES_FILE, overrides)
}

export async function clearSummarySettingsOverride(auditId: string): Promise<void> {
  const overrides = await readJsonDict<SummarySettings>(OVERRIDES_FILE)
  delete overrides[auditId]
  await writeJsonDict(OVERRIDES_FILE, overrides)
}

export async function getEffectiveSummarySettings(
  auditId?: string,
): Promise<{ settings: SummarySettings; isOverridden: boolean }> {
  if (auditId) {
    const override = await getSummarySettingsOverride(auditId)
    if (override) return { settings: override, isOverridden: true }
  }
  return { settings: await getSummarySettings(), isOverridden: false }
}
