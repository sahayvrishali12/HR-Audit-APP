"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { MaturityBadge } from "@/components/maturity-badge"
import { getAudit } from "@/lib/audit-store"
import { computeScore } from "@/lib/scoring"
import { generateAuditSummary } from "@/lib/ai-summary"
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

  const { scorePct, maturity, availableCount, totalCount } = computeScore(audit.documentStatus)
  const { executiveSummary, strengths, improvements, nextSteps } = generateAuditSummary(audit)

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
          <div className="flex items-center gap-6 rounded-lg border bg-muted/40 p-3">
            <div>
              <p className="text-xs uppercase tracking-wide">Audit Score</p>
              <p className="text-lg font-semibold text-foreground">
                {availableCount} / {totalCount}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide">Compliance Score</p>
              <p className="text-lg font-semibold text-foreground">{scorePct.toFixed(1)}%</p>
            </div>
          </div>
          {executiveSummary.map((para, i) => (
            <p key={i}>{para}</p>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Strengths</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="ml-1 list-inside list-disc space-y-1 text-sm text-muted-foreground">
            {strengths.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Improvements</CardTitle>
        </CardHeader>
        <CardContent>
          {improvements.length === 0 ? (
            <p className="text-sm text-muted-foreground">No missing documents — no improvements required.</p>
          ) : (
            <ul className="ml-1 list-inside list-disc space-y-2 text-sm text-muted-foreground">
              {improvements.map((item) => (
                <li key={item.name}>
                  <span className="font-medium text-foreground">{item.name}</span> is missing — {item.note}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Next Steps</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="ml-1 list-inside list-decimal space-y-2 text-sm text-muted-foreground">
            {nextSteps.map((step, i) => (
              <li key={i}>{step}</li>
            ))}
          </ol>
        </CardContent>
      </Card>
    </div>
  )
}
