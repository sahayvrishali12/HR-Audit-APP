import { AUDIT_DOCUMENTS, TOTAL_WEIGHTAGE } from "./documents"
import type { AuditRecord } from "./audit-types"
import { maturityFromScore } from "./audit-types"

export function computeScore(documentStatus: Record<string, string>) {
  const earned = AUDIT_DOCUMENTS.reduce((sum, doc) => {
    return documentStatus[doc.id] === "Available" ? sum + doc.weightage : sum
  }, 0)
  const scorePct = (earned / TOTAL_WEIGHTAGE) * 100
  return {
    earnedWeightage: earned,
    scorePct,
    maturity: maturityFromScore(scorePct),
  }
}

export function missingDocumentsByPriority(record: AuditRecord) {
  const missing = AUDIT_DOCUMENTS.filter((doc) => record.documentStatus[doc.id] !== "Available")
  return missing.sort((a, b) => a.priority - b.priority)
}
