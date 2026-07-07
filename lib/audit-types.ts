export type DocStatus = "Available" | "Not Available"

export interface AuditRecord {
  id: string
  organizationName: string
  aboutOrganization: string
  department: string
  auditorName: string
  auditorDesignation: string
  auditDate: string
  createdAt: string
  documentStatus: Record<string, DocStatus>
}

export type Maturity = "Non Compliant" | "Partially Compliant" | "Compliant" | "Highly Compliant"

export function maturityFromScore(scorePct: number): Maturity {
  if (scorePct <= 50) return "Non Compliant"
  if (scorePct <= 70) return "Partially Compliant"
  if (scorePct <= 90) return "Compliant"
  return "Highly Compliant"
}
