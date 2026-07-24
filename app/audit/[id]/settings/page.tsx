"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Settings2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { AssistantSettings } from "@/components/assistant-settings"
import { SummarySettings } from "@/components/summary-settings"
import { getAudit } from "@/lib/audit-store"
import { useCurrentUser } from "@/lib/use-current-user"
import type { AuditRecord } from "@/lib/audit-types"

export default function AuditSettingsPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const user = useCurrentUser()
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

  useEffect(() => {
    if (user === null || (user && user.role !== "it_guy")) {
      router.replace("/dashboard")
    }
  }, [user, router])

  if (user === undefined || !user || user.role !== "it_guy") return null
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

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Settings2 className="size-6 text-primary" />
          <div>
            <h1 className="text-2xl font-semibold">Assistant &amp; AI Settings</h1>
            <p className="text-sm text-muted-foreground">{audit.organizationName || "Untitled Organization"}</p>
          </div>
        </div>
        <Button variant="outline" asChild>
          <Link href="/dashboard">
            <ArrowLeft className="size-4" />
            Back to Dashboard
          </Link>
        </Button>
      </div>
      <p className="-mt-4 text-sm text-muted-foreground">
        These settings apply only to {audit.organizationName || "this organization"}. Leave them untouched to keep
        following the global default.
      </p>

      <AssistantSettings auditId={audit.id} />
      <SummarySettings auditId={audit.id} />
    </div>
  )
}
