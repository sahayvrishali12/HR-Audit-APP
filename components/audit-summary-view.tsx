"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowLeft, Pencil, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { MaturityBadge, DocStatusBadge } from "@/components/maturity-badge"
import { AssistantChat } from "@/components/assistant-chat"
import { AUDIT_DOCUMENTS } from "@/lib/documents"
import { computeScore } from "@/lib/scoring"
import { generateQuickSummary } from "@/lib/ai-summary"
import { useSummarySettings } from "@/lib/use-summary-settings"
import { saveDocumentStatus } from "@/lib/audit-store"
import type { AuditRecord, DocStatus } from "@/lib/audit-types"

export function AuditSummaryView({
  audit,
  canEditAudit,
  canEditDocumentStatus,
}: {
  audit: AuditRecord
  canEditAudit: boolean
  canEditDocumentStatus: boolean
}) {
  const { thresholds } = useSummarySettings(audit.id)
  const [documentStatus, setDocumentStatus] = useState<Record<string, DocStatus>>(audit.documentStatus)
  const [savingId, setSavingId] = useState<string | null>(null)
  const [error, setError] = useState("")

  const { scorePct, maturity, availableCount, totalCount } = computeScore(documentStatus, thresholds)
  const quickSummary = generateQuickSummary({ ...audit, documentStatus }, thresholds)

  async function handleToggleStatus(docId: string) {
    const previous = documentStatus
    const next: DocStatus = previous[docId] === "Available" ? "Not Available" : "Available"
    setError("")
    setDocumentStatus((prev) => ({ ...prev, [docId]: next }))
    setSavingId(docId)
    const ok = await saveDocumentStatus(audit.id, { [docId]: next })
    setSavingId(null)
    if (!ok) {
      setDocumentStatus(previous)
      setError("Could not save the change. Please try again.")
    }
  }

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6 p-6">
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold text-balance">{audit.organizationName || "Untitled Organization"}</h1>
            <p className="text-sm text-muted-foreground">Audit summary</p>
          </div>
          <div className="flex items-center gap-2">
            {(canEditAudit || canEditDocumentStatus) && (
              <Button asChild>
                <Link href={`/audit/${audit.id}/edit`}>
                  <Pencil className="size-4" />
                  Edit Audit
                </Link>
              </Button>
            )}
            <Button variant="outline" asChild>
              <Link href="/dashboard">
                <ArrowLeft className="size-4" />
                Back to Dashboard
              </Link>
            </Button>
          </div>
        </div>
        <p className="text-sm leading-relaxed text-muted-foreground">{quickSummary}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Audit Details</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Department</p>
            <p className="text-sm font-medium">{audit.department || "Not provided"}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Auditor</p>
            <p className="text-sm font-medium">
              {audit.auditorName || "Not provided"}
              {audit.auditorDesignation && ` (${audit.auditorDesignation})`}
            </p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Audit Date</p>
            <p className="text-sm font-medium">{audit.auditDate || "Not provided"}</p>
          </div>
          {audit.aboutOrganization && (
            <div className="sm:col-span-2">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">About Organization</p>
              <p className="text-sm leading-relaxed text-muted-foreground">{audit.aboutOrganization}</p>
            </div>
          )}
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
          {canEditDocumentStatus && (
            <CardDescription>Click a status badge to mark a document available or not available.</CardDescription>
          )}
        </CardHeader>
        <CardContent>
          {error && <p className="mb-3 text-sm text-destructive">{error}</p>}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">S.No</TableHead>
                <TableHead>Document Name</TableHead>
                <TableHead className="w-24">Weightage</TableHead>
                <TableHead className="w-40 text-right">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {AUDIT_DOCUMENTS.map((doc, i) => (
                <TableRow key={doc.id}>
                  <TableCell>{i + 1}</TableCell>
                  <TableCell className="whitespace-normal">{doc.name}</TableCell>
                  <TableCell>{doc.weightage.toFixed(0)}%</TableCell>
                  <TableCell className="text-right">
                    {canEditDocumentStatus ? (
                      <button
                        type="button"
                        onClick={() => handleToggleStatus(doc.id)}
                        disabled={savingId === doc.id}
                        className="inline-flex cursor-pointer rounded-md transition-opacity hover:opacity-80 disabled:cursor-wait disabled:opacity-60"
                      >
                        <DocStatusBadge available={documentStatus[doc.id] === "Available"} />
                      </button>
                    ) : (
                      <DocStatusBadge available={documentStatus[doc.id] === "Available"} />
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <AssistantChat auditId={audit.id} />

      <div className="flex items-center justify-between gap-3 pb-6">
        <Button variant="outline" asChild>
          <Link href="/dashboard">Back to Dashboard</Link>
        </Button>
        <div className="flex items-center gap-3">
          <Button variant="secondary" asChild>
            <Link href={`/audit/${audit.id}/report`}>
              <Sparkles className="size-4" />
              AI Generated Report
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
