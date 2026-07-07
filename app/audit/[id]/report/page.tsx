"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { MaturityBadge, PriorityBadge } from "@/components/maturity-badge"
import { PRIORITY_LABEL } from "@/lib/documents"
import { getAudit } from "@/lib/audit-store"
import { computeScore, missingDocumentsByPriority } from "@/lib/scoring"
import type { AuditRecord } from "@/lib/audit-types"

export default function AiReportPage() {
  const params = useParams<{ id: string }>()
  const [audit, setAudit] = useState<AuditRecord | null | undefined>(undefined)

  useEffect(() => {
    let active = true
    getAudit(params.id).then((found) => {
      if (active) setAudit(found ?? null)
    })
    return () => {
      active = false
    }
  }, [params.id])

  if (audit === undefined) return null

  if (audit === null) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center gap-4 p-10 text-center">
        <p className="text-muted-foreground">Audit not found.</p>
        <Link href="/dashboard" className="text-primary underline">
          Back to Dashboard
        </Link>
      </div>
    )
  }

  const { scorePct, maturity } = computeScore(audit.documentStatus)
  const missing = missingDocumentsByPriority(audit)
  const missingByPriority = [1, 2, 3, 4, 5].map((p) => ({
    priority: p,
    docs: missing.filter((d) => d.priority === p),
  }))

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="size-6 text-primary" />
          <h1 className="text-2xl font-semibold">AI Generated Report</h1>
        </div>
        <Button variant="outline" asChild>
          <Link href={`/audit/${audit.id}`}>
            <ArrowLeft className="size-4" />
            Back to Audit
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Executive Summary
            <MaturityBadge maturity={maturity} />
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 text-sm leading-relaxed text-muted-foreground">
          <p>
            <span className="font-medium text-foreground">{audit.organizationName}</span> was audited by{" "}
            {audit.auditorName || "the assigned auditor"} ({audit.auditorDesignation || "HR Manager"}) on{" "}
            {audit.auditDate}. Across the unified 69-document HR governance and onboarding checklist, the
            organization achieved a weighted compliance score of{" "}
            <span className="font-medium text-foreground">{scorePct.toFixed(1)}%</span>, placing it in the{" "}
            <span className="font-medium text-foreground">{maturity}</span> maturity band.
          </p>
          {missing.length > 0 ? (
            <p>
              {missing.length} of 69 documents are currently marked Not Available, including{" "}
              {missingByPriority[0].docs.length} Priority 1 (critical) item
              {missingByPriority[0].docs.length === 1 ? "" : "s"}. Closing these gaps, starting with the highest
              priority tier, is the fastest path to improving the maturity rating.
            </p>
          ) : (
            <p>All 69 documents in the checklist are marked Available — no outstanding gaps were identified.</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Improvements</CardTitle>
        </CardHeader>
        <CardContent>
          {missing.length === 0 ? (
            <p className="text-sm text-muted-foreground">No missing documents — no improvements required.</p>
          ) : (
            <div className="flex flex-col gap-4">
              {missingByPriority
                .filter((g) => g.docs.length > 0)
                .map((g) => (
                  <div key={g.priority} className="flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                      <PriorityBadge priority={g.priority} />
                      <span className="text-sm font-medium">{PRIORITY_LABEL[g.priority as 1 | 2 | 3 | 4 | 5]}</span>
                    </div>
                    <ul className="ml-1 list-inside list-disc space-y-1 text-sm text-muted-foreground">
                      {g.docs.map((doc) => (
                        <li key={doc.id}>{doc.name} is missing and should be sourced or issued.</li>
                      ))}
                    </ul>
                  </div>
                ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Next Steps</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="ml-1 list-inside list-decimal space-y-2 text-sm text-muted-foreground">
            {missingByPriority[0].docs.length > 0 && (
              <li>Immediately resolve all Priority 1 (critical) gaps — these block onboarding and core governance.</li>
            )}
            {missingByPriority.slice(1).some((g) => g.docs.length > 0) && (
              <li>Schedule remediation of Priority 2–3 items within the next audit cycle.</li>
            )}
            {missingByPriority.slice(3).some((g) => g.docs.length > 0) && (
              <li>Track remaining Priority 4–5 conditional and asset/access items for closure before the next review.</li>
            )}
            <li>Re-run this audit after remediation to confirm the maturity rating has improved.</li>
          </ol>
        </CardContent>
      </Card>
    </div>
  )
}
