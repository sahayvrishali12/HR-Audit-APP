"use client"

import { useEffect, useState } from "react"
import { SlidersHorizontal } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { DEFAULT_MATURITY_THRESHOLDS, type MaturityThresholds } from "@/lib/audit-types"
import { DEFAULT_CRITICAL_DOCUMENTS } from "@/lib/ai-summary"

interface Settings {
  thresholds: MaturityThresholds
  criticalDocuments: string[]
}

export function SummarySettings({ auditId }: { auditId?: string } = {}) {
  const settingsUrl = auditId ? `/api/audits/${encodeURIComponent(auditId)}/summary-settings` : "/api/summary-settings"

  const [open, setOpen] = useState(false)
  const [settings, setSettings] = useState<Settings | null>(null)
  const [allDocuments, setAllDocuments] = useState<string[]>([])
  const [isOverridden, setIsOverridden] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  function load() {
    fetch(settingsUrl)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) {
          setSettings(data.settings)
          setAllDocuments(data.allDocuments)
          setIsOverridden(!!data.isOverridden)
        }
      })
  }

  useEffect(load, [settingsUrl])

  function updateThreshold(key: keyof MaturityThresholds, value: number) {
    setSaved(false)
    setSettings((prev) => (prev ? { ...prev, thresholds: { ...prev.thresholds, [key]: value } } : prev))
  }

  function toggleCritical(name: string) {
    setSaved(false)
    setSettings((prev) => {
      if (!prev) return prev
      const has = prev.criticalDocuments.includes(name)
      return {
        ...prev,
        criticalDocuments: has ? prev.criticalDocuments.filter((n) => n !== name) : [...prev.criticalDocuments, name],
      }
    })
  }

  function handleRestoreDefaults() {
    setSaved(false)
    setError("")
    setSettings({ thresholds: DEFAULT_MATURITY_THRESHOLDS, criticalDocuments: DEFAULT_CRITICAL_DOCUMENTS })
  }

  async function handleSave() {
    if (!settings) return
    setError("")
    setLoading(true)
    try {
      const res = await fetch(settingsUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || "Could not save settings.")
        return
      }
      setSaved(true)
      setIsOverridden(true)
    } catch {
      setError("Could not save settings.")
    } finally {
      setLoading(false)
    }
  }

  async function handleRevertToGlobal() {
    setError("")
    setLoading(true)
    try {
      const res = await fetch(settingsUrl, { method: "DELETE" })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || "Could not revert to the global default.")
        return
      }
      setSaved(false)
      load()
    } catch {
      setError("Could not revert to the global default.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <SlidersHorizontal className="size-5 text-primary" />
            AI Summary Settings
          </span>
          <Button variant="outline" size="sm" onClick={() => setOpen((v) => !v)}>
            {open ? "Hide" : "Configure"}
          </Button>
        </CardTitle>
      </CardHeader>
      {open && (
        <CardContent className="flex flex-col gap-4">
          {!settings ? (
            <p className="text-sm text-muted-foreground">Loading settings.</p>
          ) : (
            <>
              {auditId && (
                <div className="flex flex-wrap items-center justify-between gap-2 rounded-md border bg-muted/30 p-3 text-sm">
                  <span className="text-muted-foreground">
                    {isOverridden
                      ? "This organization has custom AI summary settings that override the global default."
                      : "This organization is currently using the global default AI summary settings. Saving below creates an override just for it."}
                  </span>
                  {isOverridden && (
                    <Button variant="outline" size="sm" onClick={handleRevertToGlobal} disabled={loading}>
                      Revert to Global Default
                    </Button>
                  )}
                </div>
              )}

              <div className="flex flex-col gap-2">
                <Label>Maturity Band Cutoffs (percent)</Label>
                <p className="text-xs text-muted-foreground">
                  A compliance score at or below each cutoff falls into that band. Anything above the highest cutoff is
                  classified Highly Compliant.
                </p>
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="flex flex-col gap-2">
                    <Label className="text-xs font-normal text-muted-foreground">Non Compliant up to</Label>
                    <Input
                      type="number"
                      min={1}
                      max={98}
                      value={settings.thresholds.nonCompliantMax}
                      onChange={(e) => updateThreshold("nonCompliantMax", Number(e.target.value))}
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label className="text-xs font-normal text-muted-foreground">Partially Compliant up to</Label>
                    <Input
                      type="number"
                      min={2}
                      max={99}
                      value={settings.thresholds.partiallyCompliantMax}
                      onChange={(e) => updateThreshold("partiallyCompliantMax", Number(e.target.value))}
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label className="text-xs font-normal text-muted-foreground">Compliant up to</Label>
                    <Input
                      type="number"
                      min={3}
                      max={99}
                      value={settings.thresholds.compliantMax}
                      onChange={(e) => updateThreshold("compliantMax", Number(e.target.value))}
                    />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Non Compliant 0 to {settings.thresholds.nonCompliantMax}%. Partially Compliant{" "}
                  {settings.thresholds.nonCompliantMax + 1} to {settings.thresholds.partiallyCompliantMax}%. Compliant{" "}
                  {settings.thresholds.partiallyCompliantMax + 1} to {settings.thresholds.compliantMax}%. Highly Compliant
                  above {settings.thresholds.compliantMax}%.
                </p>
              </div>

              <div className="flex flex-col gap-2">
                <Label>Compliance Critical Documents</Label>
                <p className="text-xs text-muted-foreground">
                  These documents are treated as tied to statutory obligation or organizational risk throughout the AI
                  Generated Report.
                </p>
                <div className="grid max-h-64 gap-2 overflow-y-auto rounded-md border p-3 sm:grid-cols-2">
                  {allDocuments.map((name) => (
                    <label key={name} className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        className="size-4 accent-primary"
                        checked={settings.criticalDocuments.includes(name)}
                        onChange={() => toggleCritical(name)}
                      />
                      {name}
                    </label>
                  ))}
                </div>
              </div>

              {error && <p className="text-sm text-destructive">{error}</p>}
              <div className="flex items-center gap-3">
                <Button onClick={handleSave} disabled={loading}>
                  {saved ? "Saved" : auditId ? "Save Override" : "Save Settings"}
                </Button>
                <Button variant="outline" onClick={handleRestoreDefaults} disabled={loading}>
                  Restore Defaults
                </Button>
              </div>
            </>
          )}
        </CardContent>
      )}
    </Card>
  )
}
