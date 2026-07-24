"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { AuditSummaryView } from "@/components/audit-summary-view"
import { getAudit } from "@/lib/audit-store"
import { useCurrentUser } from "@/lib/use-current-user"
import { canEdit, canEditDocumentStatus } from "@/lib/roles"
import type { AuditRecord } from "@/lib/audit-types"

export default function ViewAuditPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const [audit, setAudit] = useState<AuditRecord | null | undefined>(undefined)
  const user = useCurrentUser()

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
        <button className="text-primary underline" onClick={() => router.push("/dashboard")}>
          Back to Dashboard
        </button>
      </div>
    )
  }

  return (
    <AuditSummaryView
      audit={audit}
      canEditAudit={!!user && canEdit(user.role)}
      canEditDocumentStatus={!!user && canEditDocumentStatus(user.role)}
    />
  )
}
