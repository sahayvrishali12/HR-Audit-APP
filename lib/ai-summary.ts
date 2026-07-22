import { AUDIT_DOCUMENTS } from "./documents"
import { computeScore, missingDocuments } from "./scoring"
import type { AuditRecord, Maturity } from "./audit-types"

const DOC_INSIGHTS: Record<string, string> = {
  "Employee Handbook":
    "the foundational reference for workplace policies and expectations — without it, employees lack a single source of truth.",
  "Code of Conduct":
    "sets expected standards of ethics and behavior; its absence increases the risk of inconsistent disciplinary outcomes.",
  "Confidentiality Agreement/NDA":
    "protects proprietary and client information; missing this exposes the organization to data-leakage and IP risk.",
  "Leave Policy": "governs entitlements and approval workflow; gaps here lead to inconsistent leave administration.",
  "Attendance Policy":
    "defines working-hour expectations; its absence creates ambiguity in performance and payroll decisions.",
  "POSH Policy":
    "a statutory requirement for workplace harassment prevention — this is a legal compliance gap, not just a best practice.",
  "Information Security Policy":
    "protects systems and data from unauthorized access; absence raises cybersecurity and data-breach exposure.",
  "Data Privacy Policy": "governs handling of personal data; missing this creates regulatory exposure.",
  "Work From Home Policy":
    "sets expectations for remote-work eligibility and conduct; absence causes inconsistent remote practices.",
  "Disciplinary Policy":
    "defines the process for handling misconduct; without it, disciplinary actions risk being legally challengeable.",
  "Asset Handover Form": "tracks company asset issuance and return; missing this creates accountability gaps at exit.",
  "Software Access Request Form":
    "governs provisioning of system access; absence increases the risk of unauthorized or excessive access grants.",
  "HR Governance Policy/Framework":
    "the overarching framework tying HR governance together; without it, HR practices lack a documented backbone.",
  "HR Organization Structure":
    "clarifies reporting lines and accountability; missing this creates ambiguity in ownership of HR decisions.",
  "HR Roles and Responsibility Matrix":
    "defines who owns which HR process; absence risks duplicated or dropped responsibilities.",
  "Background Verification Policy":
    "sets standards for pre-employment screening; missing this increases hiring and workplace-safety risk.",
  "Compensation and Benefits Policy":
    "documents pay philosophy and benefits structure; absence risks inconsistent or inequitable decisions.",
  "Performance Management Policy":
    "defines how performance is assessed; without it, reviews and promotions lack a consistent standard.",
  "Promotion and Increment Policy":
    "governs career-progression criteria; missing this risks a perception of unfairness in advancement decisions.",
  "Learning and Development Policy":
    "formalizes training investment and access; absence risks inconsistent skill development across the organization.",
  "Employee Grievance Policy":
    "provides a formal channel for raising concerns; missing this leaves employees without recourse.",
  "Conflict of Interest Policy":
    "governs disclosure of competing interests; absence increases the risk of undisclosed conflicts affecting decisions.",
  "Equal Opportunity/DEI Policy":
    "documents commitment to non-discriminatory practices; missing this is both a compliance and reputational risk.",
  "Retention Policy":
    "defines document and record retention periods; absence risks non-compliance with record-keeping requirements.",
  "HR Risk & Compliance Register":
    "the running log of HR risks and mitigations; without it, there is no structured view of the organization's own compliance posture.",
}

const COMPLIANCE_CRITICAL = new Set<string>([
  "POSH Policy",
  "Information Security Policy",
  "Data Privacy Policy",
  "Background Verification Policy",
  "Equal Opportunity/DEI Policy",
  "HR Risk & Compliance Register",
])

const MATURITY_NARRATIVE: Record<Maturity, string> = {
  "Non Compliant":
    "significant, urgent gaps in HR governance documentation that expose the organization to compliance and operational risk",
  "Partially Compliant": "a foundational governance base with meaningful gaps still to close",
  Compliant: "a solid, largely complete HR governance framework with a handful of gaps remaining",
  "Highly Compliant": "a mature, well-documented HR governance framework",
}

const MATURITY_CADENCE: Record<Maturity, string> = {
  "Non Compliant": "Immediate remediation is recommended before proceeding further; re-audit within 30 days.",
  "Partially Compliant": "A focused remediation plan over the next quarter is recommended.",
  Compliant: "Routine follow-up at the next scheduled audit should be sufficient.",
  "Highly Compliant": "Maintain current practices and monitor for policy drift at the next scheduled review.",
}

export interface AuditSummary {
  executiveSummary: string[]
  strengths: string[]
  improvements: { name: string; note: string }[]
  nextSteps: string[]
}

function firstSentence(text: string): string {
  const trimmed = (text || "").trim()
  if (!trimmed) return ""
  const match = trimmed.match(/^[^.!?\n]*[.!?]/)
  return (match ? match[0] : trimmed.split("\n")[0]).trim()
}

/** A short, one-paragraph blurb for the View Details page — organization gist + audit outcome. */
export function generateQuickSummary(audit: AuditRecord): string {
  const { scorePct, maturity, availableCount, totalCount } = computeScore(audit.documentStatus)
  const orgLabel = audit.organizationName || "This organization"
  const about = firstSentence(audit.aboutOrganization)
  const outcome = `${orgLabel} has ${availableCount} of ${totalCount} HR governance documents in place — a Compliance Score of ${scorePct.toFixed(0)}% (${maturity}).`
  return about ? `${about} ${outcome}` : outcome
}

export function generateAuditSummary(audit: AuditRecord): AuditSummary {
  const { scorePct, maturity, availableCount, totalCount } = computeScore(audit.documentStatus)
  const missing = missingDocuments(audit)
  const missingNames = new Set(missing.map((d) => d.name))
  const available = AUDIT_DOCUMENTS.filter((d) => !missingNames.has(d.name))
  const missingCritical = missing.filter((d) => COMPLIANCE_CRITICAL.has(d.name))
  const missingOther = missing.filter((d) => !COMPLIANCE_CRITICAL.has(d.name))

  const orgLabel = audit.organizationName || "the organization"
  const auditorLabel = audit.auditorName || "the assigned auditor"
  const designationLabel = audit.auditorDesignation || "HR Manager"

  const executiveSummary: string[] = []

  executiveSummary.push(
    `${orgLabel} was audited by ${auditorLabel} (${designationLabel}) on ${audit.auditDate || "the recorded date"}. ` +
      `Across the ${totalCount}-document HR policy governance checklist, the organization scored an Audit Score of ` +
      `${availableCount} / ${totalCount} documents available, translating to a Compliance Score of ${scorePct.toFixed(1)}% — ` +
      `the ${maturity} band. This reflects ${MATURITY_NARRATIVE[maturity]}.`,
  )

  if (missing.length > 0) {
    if (missingCritical.length > 0) {
      executiveSummary.push(
        `${missingCritical.length} of the missing document${missingCritical.length === 1 ? "" : "s"} — ` +
          `${missingCritical.map((d) => d.name).join(", ")} — ${
            missingCritical.length === 1 ? "carries" : "carry"
          } statutory or risk-critical weight and should be treated ` +
          `as the top remediation priority regardless of equal scoring weight.`,
      )
    }
    if (missingOther.length > 0) {
      executiveSummary.push(
        `The remaining ${missingOther.length} gap${missingOther.length === 1 ? "" : "s"} (${missingOther
          .map((d) => d.name)
          .join(", ")}) ${
          missingOther.length === 1 ? "is" : "are"
        } operational or administrative in nature and can be scheduled after the critical items above.`,
      )
    }
  } else {
    executiveSummary.push(`All ${totalCount} documents in the checklist are marked Available — no outstanding gaps were identified.`)
  }

  const strengths: string[] = []
  if (available.length > 0) {
    strengths.push(
      `${available.length} of ${totalCount} documents are in place, giving ${orgLabel} a working foundation to build on.`,
    )
    const criticalAvailable = available.filter((d) => COMPLIANCE_CRITICAL.has(d.name))
    if (criticalAvailable.length > 0) {
      strengths.push(
        `Statutory/risk-critical documents already in place: ${criticalAvailable.map((d) => d.name).join(", ")}.`,
      )
    }
  } else {
    strengths.push("No documents are currently marked Available — governance documentation should be established from the ground up.")
  }

  const improvements = missing.map((doc) => ({
    name: doc.name,
    note: DOC_INSIGHTS[doc.name] ?? "supports the organization's overall HR governance framework.",
  }))

  const nextSteps: string[] = []
  if (missingCritical.length > 0) {
    nextSteps.push(
      `Prioritize sourcing or issuing the statutory/risk-critical gaps first: ${missingCritical.map((d) => d.name).join(", ")}.`,
    )
  }
  if (missingOther.length > 0) {
    nextSteps.push(`Schedule the remaining operational documents for the next remediation cycle: ${missingOther.map((d) => d.name).join(", ")}.`)
  }
  nextSteps.push(MATURITY_CADENCE[maturity])
  nextSteps.push("Re-run this audit after remediation to confirm the maturity rating has improved.")

  return { executiveSummary, strengths, improvements, nextSteps }
}
