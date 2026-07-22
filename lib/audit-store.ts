import { AUDIT_DOCUMENTS } from "./documents"
import type { AuditRecord, DocStatus } from "./audit-types"

export async function getAudits(): Promise<AuditRecord[]> {
  const res = await fetch("/api/audits")
  if (!res.ok) return []
  const data = await res.json()
  return data.audits as AuditRecord[]
}

export async function getAudit(id: string): Promise<AuditRecord | undefined> {
  const res = await fetch(`/api/audits/${id}`)
  if (!res.ok) return undefined
  const data = await res.json()
  return data.audit as AuditRecord
}

export async function saveAudit(audit: AuditRecord): Promise<boolean> {
  const res = await fetch("/api/audits", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(audit),
  })
  return res.ok
}

export function createEmptyAudit(): AuditRecord {
  const documentStatus: Record<string, DocStatus> = {}
  for (const doc of AUDIT_DOCUMENTS) {
    documentStatus[doc.id] = "Not Available"
  }
  return {
    id: `audit-${Date.now()}`,
    organizationName: "",
    aboutOrganization: "",
    department: "Human Resources",
    auditorName: "",
    auditorDesignation: "",
    auditDate: new Date().toISOString().slice(0, 10),
    createdAt: new Date().toISOString(),
    documentStatus,
  }
}
