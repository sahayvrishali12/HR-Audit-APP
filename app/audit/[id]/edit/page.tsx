"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { AuditChecklistForm } from "@/components/audit-checklist-form"
import { getAudit } from "@/lib/audit-store"
import { useCurrentUser } from "@/lib/use-current-user"
import { canEdit } from "@/lib/roles"
import type { AuditRecord } from "@/lib/audit-types"

export default function EditAuditPage() {
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

  useEffect(() => {
    if (user === null || (user && !canEdit(user.role))) {
      router.replace(`/audit/${params.id}`)
    }
  }, [user, params.id, router])

  if (audit === undefined || user === undefined) return null

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

  if (!user || !canEdit(user.role)) return null

  return <AuditChecklistForm initial={audit} backHref={`/audit/${audit.id}`} />
}
