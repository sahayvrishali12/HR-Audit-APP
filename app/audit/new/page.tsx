"use client"

import { useState } from "react"
import { AuditChecklistForm } from "@/components/audit-checklist-form"
import { createEmptyAudit } from "@/lib/audit-store"

export default function NewAuditPage() {
  const [initial] = useState(() => createEmptyAudit())
  return <AuditChecklistForm initial={initial} />
}
