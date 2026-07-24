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

export interface MaturityThresholds {
  nonCompliantMax: number
  partiallyCompliantMax: number
  compliantMax: number
}

export const DEFAULT_MATURITY_THRESHOLDS: MaturityThresholds = {
  nonCompliantMax: 50,
  partiallyCompliantMax: 70,
  compliantMax: 90,
}

export function maturityFromScore(scorePct: number, thresholds: MaturityThresholds = DEFAULT_MATURITY_THRESHOLDS): Maturity {
  if (scorePct <= thresholds.nonCompliantMax) return "Non Compliant"
  if (scorePct <= thresholds.partiallyCompliantMax) return "Partially Compliant"
  if (scorePct <= thresholds.compliantMax) return "Compliant"
  return "Highly Compliant"
}
