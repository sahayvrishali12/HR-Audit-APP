"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { FileText, Sparkles, Wand2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Progress } from "@/components/ui/progress"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { MaturityBadge } from "@/components/maturity-badge"
import { AUDIT_DOCUMENTS } from "@/lib/documents"
import { computeScore } from "@/lib/scoring"
import { saveAudit, saveDocumentStatus } from "@/lib/audit-store"
import { generateOrgSummaryDraft } from "@/lib/org-summary"
import { useSummarySettings } from "@/lib/use-summary-settings"
import type { AuditRecord, DocStatus } from "@/lib/audit-types"

export function AuditChecklistForm({
  initial,
  backHref = "/dashboard",
  canEditDetails = true,
}: {
  initial: AuditRecord
  backHref?: string
  canEditDetails?: boolean
}) {
  const router = useRouter()
  const [audit, setAudit] = useState<AuditRecord>(initial)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState("")
  const { thresholds } = useSummarySettings(audit.id)

  const { scorePct, maturity, availableCount, totalCount } = useMemo(
    () => computeScore(audit.documentStatus, thresholds),
    [audit.documentStatus, thresholds],
  )

  function updateField<K extends keyof AuditRecord>(key: K, value: AuditRecord[K]) {
    setSaved(false)
    setAudit((prev) => ({ ...prev, [key]: value }))
  }

  function updateDoc(docId: string, status: DocStatus) {
    setSaved(false)
    setAudit((prev) => ({ ...prev, documentStatus: { ...prev.documentStatus, [docId]: status } }))
  }

  function handleGenerateAbout() {
    updateField("aboutOrganization", generateOrgSummaryDraft(audit.organizationName, audit.department))
  }

  async function persist() {
    return canEditDetails ? saveAudit(audit) : saveDocumentStatus(audit.id, audit.documentStatus)
  }

  async function handleSave() {
    setError("")
    const ok = await persist()
    if (!ok) {
      setError("Could not save. You may not have permission to edit this audit.")
      return
    }
    setSaved(true)
    router.push(`/audit/${audit.id}`)
    router.refresh()
  }

  async function handleViewReport() {
    setError("")
    const ok = await persist()
    if (!ok) {
      setError("Could not save. You may not have permission to edit this audit.")
      return
    }
    setSaved(true)
    router.push(`/audit/${audit.id}/report`)
  }

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6 p-6">
      <Card>
        <CardHeader>
          <CardTitle>Audit Details</CardTitle>
          {!canEditDetails && (
            <CardDescription>
              Organization details are managed by HR Manager or Admin. You can update document availability below.
            </CardDescription>
          )}
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label>Organization to be Audited</Label>
            <Input
              value={audit.organizationName}
              onChange={(e) => updateField("organizationName", e.target.value)}
              placeholder="Organization name"
              disabled={!canEditDetails}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label>Department</Label>
            <Input
              value={audit.department}
              onChange={(e) => updateField("department", e.target.value)}
              disabled={!canEditDetails}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label>Auditor</Label>
            <Input
              value={audit.auditorName}
              onChange={(e) => updateField("auditorName", e.target.value)}
              disabled={!canEditDetails}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label>Designation of Auditor</Label>
            <Input
              value={audit.auditorDesignation}
              onChange={(e) => updateField("auditorDesignation", e.target.value)}
              disabled={!canEditDetails}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label>Audit Date</Label>
            <Input
              type="date"
              value={audit.auditDate}
              onChange={(e) => updateField("auditDate", e.target.value)}
              disabled={!canEditDetails}
            />
          </div>
          <div className="flex flex-col gap-2 sm:col-span-2">
            <div className="flex items-center justify-between">
              <Label>About Organization</Label>
              {canEditDetails && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleGenerateAbout}
                  disabled={!audit.organizationName.trim()}
                  title={!audit.organizationName.trim() ? "Enter an organization name first" : "Draft a starting paragraph"}
                >
                  <Wand2 className="size-3.5" />
                  Generate with AI
                </Button>
              )}
            </div>
            <Textarea
              rows={4}
              value={audit.aboutOrganization}
              onChange={(e) => updateField("aboutOrganization", e.target.value)}
              disabled={!canEditDetails}
            />
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Audit Score</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-1">
            <p className="text-3xl font-semibold">
              {availableCount} <span className="text-lg font-normal text-muted-foreground">/ {totalCount}</span>
            </p>
            <p className="text-sm text-muted-foreground">Documents available</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-base">
              Compliance Score
              <MaturityBadge maturity={maturity} />
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            <Progress value={scorePct} />
            <p className="text-sm text-muted-foreground">{scorePct.toFixed(1)}% weighted compliance</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>HR Policy Governance Documents</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">S.No</TableHead>
                <TableHead>Document Name</TableHead>
                <TableHead className="w-24">Weightage</TableHead>
                <TableHead className="w-48">Available / Not Available</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {AUDIT_DOCUMENTS.map((doc, i) => (
                <TableRow key={doc.id}>
                  <TableCell>{i + 1}</TableCell>
                  <TableCell className="whitespace-normal">{doc.name}</TableCell>
                  <TableCell>{doc.weightage.toFixed(0)}%</TableCell>
                  <TableCell>
                    <Select
                      value={audit.documentStatus[doc.id] ?? "Not Available"}
                      onValueChange={(v) => updateDoc(doc.id, v as DocStatus)}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Available">Available</SelectItem>
                        <SelectItem value="Not Available">Not Available</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between gap-3 pb-6">
        <Button variant="outline" asChild>
          <Link href={backHref}>Cancel</Link>
        </Button>
        <div className="flex items-center gap-3">
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button onClick={handleSave}>
            <FileText className="size-4" />
            {saved ? "Saved" : "Save Audit"}
          </Button>
          <Button variant="secondary" onClick={handleViewReport}>
            <Sparkles className="size-4" />
            AI Generated Report
          </Button>
        </div>
      </div>
    </div>
  )
}
