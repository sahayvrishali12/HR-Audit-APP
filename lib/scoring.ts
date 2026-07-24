import { AUDIT_DOCUMENTS, TOTAL_WEIGHTAGE } from "./documents"
import type { AuditRecord, MaturityThresholds } from "./audit-types"
import { maturityFromScore } from "./audit-types"

export function computeScore(documentStatus: Record<string, string>, thresholds?: MaturityThresholds) {
  const availableCount = AUDIT_DOCUMENTS.reduce((count, doc) => {
    return documentStatus[doc.id] === "Available" ? count + 1 : count
  }, 0)
  const totalCount = AUDIT_DOCUMENTS.length
  const earned = availableCount * (TOTAL_WEIGHTAGE / totalCount)
  const scorePct = (earned / TOTAL_WEIGHTAGE) * 100
  return {
    availableCount,
    totalCount,
    earnedWeightage: earned,
    scorePct,
    maturity: maturityFromScore(scorePct, thresholds),
  }
}

export function missingDocuments(record: AuditRecord) {
  return AUDIT_DOCUMENTS.filter((doc) => record.documentStatus[doc.id] !== "Available")
}
