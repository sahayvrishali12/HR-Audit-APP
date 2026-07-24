"use client"

import { useEffect, useState } from "react"
import { DEFAULT_MATURITY_THRESHOLDS, type MaturityThresholds } from "@/lib/audit-types"
import { DEFAULT_CRITICAL_DOCUMENTS } from "@/lib/ai-summary"

export interface SummarySettingsValue {
  thresholds: MaturityThresholds
  criticalDocuments: string[]
}

const DEFAULT_VALUE: SummarySettingsValue = {
  thresholds: DEFAULT_MATURITY_THRESHOLDS,
  criticalDocuments: DEFAULT_CRITICAL_DOCUMENTS,
}

/**
 * Starts from the built in defaults and swaps in the configured settings once loaded, so callers never
 * have to handle a loading state. Pass an auditId to get that organization's effective settings (its own
 * override if one exists, otherwise the global default); omit it to always read the global default.
 */
export function useSummarySettings(auditId?: string): SummarySettingsValue {
  const [value, setValue] = useState<SummarySettingsValue>(DEFAULT_VALUE)

  useEffect(() => {
    let active = true
    const url = auditId ? `/api/audits/${encodeURIComponent(auditId)}/summary-settings` : "/api/summary-settings"
    fetch(url)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (active && data?.settings) {
          setValue({ thresholds: data.settings.thresholds, criticalDocuments: data.settings.criticalDocuments })
        }
      })
      .catch(() => {})
    return () => {
      active = false
    }
  }, [auditId])

  return value
}
