"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { AuditChecklistForm } from "@/components/audit-checklist-form"
import { createEmptyAudit } from "@/lib/audit-store"
import { useCurrentUser } from "@/lib/use-current-user"
import { canEdit } from "@/lib/roles"

export default function NewAuditPage() {
  const [initial] = useState(() => createEmptyAudit())
  const user = useCurrentUser()
  const router = useRouter()

  useEffect(() => {
    if (user === null || (user && !canEdit(user.role))) {
      router.replace("/dashboard")
    }
  }, [user, router])

  if (user === undefined || !user || !canEdit(user.role)) return null

  return <AuditChecklistForm initial={initial} />
}
