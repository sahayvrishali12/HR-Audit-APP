"use client"

import { useEffect, useState } from "react"
import { Settings2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DEFAULT_SETTINGS, type AssistantSettings as Settings } from "@/lib/assistant-config"

const MODEL_LABELS: Record<string, string> = {
  "meta/llama-3.1-8b-instruct": "Llama 3.1 8B (fastest, lowest cost)",
  "meta/llama-3.1-70b-instruct": "Llama 3.1 70B (highest quality)",
  "mistralai/mixtral-8x7b-instruct-v0.1": "Mixtral 8x7B (balanced quality and cost)",
}

export function AssistantSettings({ auditId }: { auditId?: string } = {}) {
  const settingsUrl = auditId ? `/api/audits/${encodeURIComponent(auditId)}/assistant-settings` : "/api/assistant/settings"

  const [open, setOpen] = useState(false)
  const [settings, setSettings] = useState<Settings | null>(null)
  const [allowedModels, setAllowedModels] = useState<string[]>([])
  const [isOverridden, setIsOverridden] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null)

  function load() {
    fetch(settingsUrl)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) {
          setSettings(data.settings)
          setAllowedModels(data.allowedModels)
          setIsOverridden(!!data.isOverridden)
        }
      })
  }

  useEffect(load, [settingsUrl])

  function update<K extends keyof Settings>(key: K, value: Settings[K]) {
    setSaved(false)
    setTestResult(null)
    setSettings((prev) => (prev ? { ...prev, [key]: value } : prev))
  }

  function handleRestoreDefaults() {
    setSaved(false)
    setError("")
    setTestResult(null)
    setSettings(DEFAULT_SETTINGS)
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

  async function handleTestConnection() {
    if (!settings) return
    setTestResult(null)
    setTesting(true)
    try {
      const res = await fetch("/api/assistant/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: settings.model, temperature: settings.temperature }),
      })
      const data = await res.json()
      if (!res.ok || !data.ok) {
        setTestResult({ ok: false, message: data.error || "Connection test failed." })
        return
      }
      setTestResult({ ok: true, message: `Connected successfully using ${MODEL_LABELS[settings.model] ?? settings.model}.` })
    } catch {
      setTestResult({ ok: false, message: "Could not reach the NVIDIA API." })
    } finally {
      setTesting(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Settings2 className="size-5 text-primary" />
            Assistant Settings
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
                      ? "This organization has custom assistant settings that override the global default."
                      : "This organization is currently using the global default assistant settings. Saving below creates an override just for it."}
                  </span>
                  {isOverridden && (
                    <Button variant="outline" size="sm" onClick={handleRevertToGlobal} disabled={loading}>
                      Revert to Global Default
                    </Button>
                  )}
                </div>
              )}

              <label className="flex items-center gap-2 text-sm font-medium">
                <input
                  type="checkbox"
                  className="size-4 accent-primary"
                  checked={settings.assistantEnabled}
                  onChange={(e) => update("assistantEnabled", e.target.checked)}
                />
                Enable assistant chat {auditId ? "for this organization" : "for all users"}
              </label>
              <p className="-mt-2 text-xs text-muted-foreground">
                {auditId
                  ? "When turned off, \"Ask the Assistant\" is hidden on every page for this organization."
                  : "When turned off, \"Ask the Assistant\" is hidden everywhere in the application for every role."}
              </p>

              <div className="flex flex-col gap-2">
                <Label>Model</Label>
                <Select value={settings.model} onValueChange={(v) => update("model", v as Settings["model"])}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {allowedModels.map((m) => (
                      <SelectItem key={m} value={m}>
                        {MODEL_LABELS[m] ?? m}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-2">
                  <Label>Temperature (0 to 1)</Label>
                  <Input
                    type="number"
                    min={0}
                    max={1}
                    step={0.1}
                    value={settings.temperature}
                    onChange={(e) => update("temperature", Number(e.target.value))}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label>Max Tokens</Label>
                  <Input
                    type="number"
                    min={100}
                    max={4096}
                    step={100}
                    value={settings.maxTokens}
                    onChange={(e) => update("maxTokens", Number(e.target.value))}
                  />
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <Label>System Prompt</Label>
                <Textarea
                  rows={6}
                  value={settings.systemPrompt}
                  onChange={(e) => update("systemPrompt", e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  This defines the assistant's base instructions. Audit specific details are appended automatically
                  when a report is open.
                </p>
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              {testResult && (
                <p className={testResult.ok ? "text-sm text-emerald-600" : "text-sm text-destructive"}>
                  {testResult.message}
                </p>
              )}
              <div className="flex flex-wrap items-center gap-3">
                <Button onClick={handleSave} disabled={loading}>
                  {saved ? "Saved" : auditId ? "Save Override" : "Save Settings"}
                </Button>
                <Button variant="outline" onClick={handleTestConnection} disabled={testing}>
                  {testing ? "Testing..." : "Test Connection"}
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
