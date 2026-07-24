import { AUDIT_DOCUMENTS } from "./documents"
import { computeScore, missingDocuments } from "./scoring"
import type { AuditRecord, Maturity, MaturityThresholds } from "./audit-types"

const DOC_INSIGHTS: Record<string, string> = {
  "Employee Handbook":
    "This document functions as the primary reference for workplace policy and employee expectation. Its absence removes a consolidated point of reference for organizational conduct and procedure.",
  "Code of Conduct":
    "This document establishes the expected standard of ethics and behavior within the organization. Its absence increases the likelihood of inconsistent disciplinary outcomes.",
  "Confidentiality Agreement/NDA":
    "This document protects proprietary and client information. Its absence exposes the organization to risk involving unauthorized disclosure of confidential information.",
  "Leave Policy":
    "This document governs leave entitlement and the associated approval procedure. Its absence contributes to inconsistency in leave administration.",
  "Attendance Policy":
    "This document defines expectations regarding working hours and attendance. Its absence introduces ambiguity into performance and payroll determinations.",
  "POSH Policy":
    "This document fulfills a statutory requirement for the prevention of workplace harassment. Its absence constitutes a regulatory compliance gap rather than a procedural gap alone.",
  "Information Security Policy":
    "This document protects organizational systems and data from unauthorized access. Its absence increases exposure to cybersecurity risk and potential compromise of data.",
  "Data Privacy Policy":
    "This document governs the handling of personal data. Its absence creates exposure under applicable data protection regulation.",
  "Work From Home Policy":
    "This document defines eligibility and conduct expectations associated with remote work. Its absence results in inconsistent application of remote work practice.",
  "Disciplinary Policy":
    "This document defines the process for addressing employee misconduct. Its absence increases the likelihood that disciplinary action may be challenged on procedural grounds.",
  "Asset Handover Form":
    "This document records the issuance and return of organizational assets. Its absence creates a gap in asset accountability at the time an employee exits the organization.",
  "Software Access Request Form":
    "This document governs the provisioning of system access to employees. Its absence increases the risk that access may be granted without appropriate authorization.",
  "HR Governance Policy/Framework":
    "This document provides the overarching framework for HR governance within the organization. Its absence indicates that HR practice lacks a documented foundation.",
  "HR Organization Structure":
    "This document defines reporting lines and accountability within the HR function. Its absence introduces ambiguity regarding ownership of HR decisions.",
  "HR Roles and Responsibility Matrix":
    "This document defines ownership of individual HR processes. Its absence creates risk of duplicated or omitted responsibility.",
  "Background Verification Policy":
    "This document defines the standard for verification conducted prior to employment. Its absence increases risk associated with hiring decisions and workplace safety.",
  "Compensation and Benefits Policy":
    "This document defines compensation philosophy and benefit structure. Its absence creates risk of inconsistency in compensation decisions.",
  "Performance Management Policy":
    "This document defines the standard for performance assessment. Its absence removes a consistent basis for review and promotion decisions.",
  "Promotion and Increment Policy":
    "This document defines the criteria applied to career progression. Its absence risks the perception that advancement decisions are made without consistent criteria.",
  "Learning and Development Policy":
    "This document formalizes the organization's investment in and access to training. Its absence risks inconsistent skill development across the workforce.",
  "Employee Grievance Policy":
    "This document provides a formal channel for raising workplace concerns. Its absence leaves employees without a documented avenue for recourse.",
  "Conflict of Interest Policy":
    "This document governs the disclosure of competing interests. Its absence increases the risk that undisclosed conflicts may influence organizational decisions.",
  "Equal Opportunity/DEI Policy":
    "This document documents the organization's commitment to nondiscriminatory practice. Its absence represents both a compliance and reputational exposure.",
  "Retention Policy":
    "This document defines the retention period applicable to organizational records. Its absence risks noncompliance with recordkeeping requirements.",
  "HR Risk & Compliance Register":
    "This document maintains a structured record of HR risk and associated mitigation measures. Its absence indicates the organization lacks a consolidated view of its own compliance position.",
}

export const DEFAULT_CRITICAL_DOCUMENTS: string[] = [
  "POSH Policy",
  "Information Security Policy",
  "Data Privacy Policy",
  "Background Verification Policy",
  "Equal Opportunity/DEI Policy",
  "HR Risk & Compliance Register",
]

const MATURITY_NARRATIVE: Record<Maturity, string> = {
  "Non Compliant":
    "This band indicates substantial gaps in HR governance documentation and represents material exposure to compliance and operational risk.",
  "Partially Compliant":
    "This band indicates a foundational level of HR governance documentation with meaningful gaps that remain to be addressed.",
  Compliant:
    "This band indicates a largely complete HR governance documentation framework with a limited number of gaps remaining.",
  "Highly Compliant": "This band indicates a comprehensive and thoroughly documented HR governance framework.",
}

const MATURITY_CADENCE: Record<Maturity, string> = {
  "Non Compliant": "Immediate remediation is recommended, followed by a subsequent audit within thirty days.",
  "Partially Compliant": "A structured remediation plan over the subsequent quarter is recommended.",
  Compliant: "Routine follow up at the next scheduled audit is considered sufficient.",
  "Highly Compliant":
    "Continued maintenance of current practice is recommended, with monitoring for policy change at the next scheduled review.",
}

export interface AuditSummary {
  executiveSummary: string[]
  strengths: string[]
  improvements: { name: string; note: string }[]
  nextSteps: string[]
}

function joinNames(names: string[]): string {
  if (names.length === 0) return ""
  if (names.length === 1) return names[0]
  if (names.length === 2) return `${names[0]} and ${names[1]}`
  return `${names.slice(0, -1).join(", ")}, and ${names[names.length - 1]}`
}

function firstSentence(text: string): string {
  const trimmed = (text || "").trim()
  if (!trimmed) return ""
  const match = trimmed.match(/^[^.!?\n]*[.!?]/)
  return (match ? match[0] : trimmed.split("\n")[0]).trim()
}

function possessive(name: string): string {
  return name.endsWith("s") ? `${name}'` : `${name}'s`
}

export interface AuditSummaryOptions {
  criticalDocuments?: string[]
  thresholds?: MaturityThresholds
}

export function generateAuditSummary(audit: AuditRecord, options?: AuditSummaryOptions): AuditSummary {
  const criticalDocuments = new Set(options?.criticalDocuments ?? DEFAULT_CRITICAL_DOCUMENTS)
  const { scorePct, maturity, availableCount, totalCount } = computeScore(audit.documentStatus, options?.thresholds)
  const missing = missingDocuments(audit)
  const missingNames = new Set(missing.map((d) => d.name))
  const available = AUDIT_DOCUMENTS.filter((d) => !missingNames.has(d.name))
  const missingCritical = missing.filter((d) => criticalDocuments.has(d.name))
  const missingOther = missing.filter((d) => !criticalDocuments.has(d.name))
  const criticalAvailable = available.filter((d) => criticalDocuments.has(d.name))

  const orgLabel = audit.organizationName || "the organization"
  const auditorLabel = audit.auditorName || "the assigned auditor"
  const designationLabel = audit.auditorDesignation || "HR Manager"

  const executiveSummary: string[] = []

  executiveSummary.push(
    `The Compliance Score represents an objective assessment of ${possessive(orgLabel)} HR governance documentation, based on the availability of ${totalCount} required documents and an assigned weightage of four percent per document. ${orgLabel} was audited by ${auditorLabel}, ${designationLabel}, on ${audit.auditDate || "the recorded date"}. Of the ${totalCount} required documents, ${availableCount} were confirmed available, resulting in an Audit Score of ${availableCount} of ${totalCount} and a Compliance Score of ${scorePct.toFixed(1)} percent. This result places the organization in the ${maturity} band. ${MATURITY_NARRATIVE[maturity]}`,
  )

  if (missing.length > 0) {
    if (missingCritical.length > 0) {
      const verbBe = missingCritical.length === 1 ? "is" : "are"
      const verbRepresent = missingCritical.length === 1 ? "represents" : "represent"
      const gapNoun = missingCritical.length === 1 ? "documentation gap" : "documentation gaps"
      executiveSummary.push(
        `${missingCritical.length} of the documents not confirmed available, specifically ${joinNames(
          missingCritical.map((d) => d.name),
        )}, ${verbBe} associated with statutory obligation or organizational risk and ${verbRepresent} the ${gapNoun} of highest significance identified in this audit.`,
      )
    }
    if (missingOther.length > 0) {
      const verb = missingOther.length === 1 ? "represents" : "represent"
      executiveSummary.push(
        `The remaining ${missingOther.length} document${missingOther.length === 1 ? "" : "s"} not confirmed available, ${joinNames(
          missingOther.map((d) => d.name),
        )}, ${verb} documentation of an operational or administrative nature.`,
      )
    }
  } else {
    executiveSummary.push(
      `All ${totalCount} required documents are confirmed available. No documentation gaps were identified in this audit.`,
    )
  }

  const strengths: string[] = []
  if (available.length > 0) {
    strengths.push(`${available.length} of ${totalCount} required documents are confirmed available.`)
    if (criticalAvailable.length > 0) {
      strengths.push(
        `The following documents, associated with statutory obligation or organizational risk, are confirmed available: ${joinNames(
          criticalAvailable.map((d) => d.name),
        )}.`,
      )
    }
  } else {
    strengths.push("No required documents are confirmed available at this time.")
  }

  const improvements = missing.map((doc) => ({
    name: doc.name,
    note: DOC_INSIGHTS[doc.name] ?? "This document contributes to the organization's overall HR governance framework.",
  }))

  const nextSteps: string[] = []
  if (missingCritical.length > 0) {
    nextSteps.push(
      `Priority should be given to obtaining or formalizing the following documents, associated with statutory obligation or organizational risk: ${joinNames(
        missingCritical.map((d) => d.name),
      )}.`,
    )
  }
  if (missingOther.length > 0) {
    nextSteps.push(
      `The remaining documentation of an operational or administrative nature should be addressed in the subsequent remediation cycle: ${joinNames(
        missingOther.map((d) => d.name),
      )}.`,
    )
  }
  nextSteps.push(MATURITY_CADENCE[maturity])
  if (missing.length > 0) {
    nextSteps.push(
      "A subsequent audit is recommended following remediation to confirm improvement in the maturity rating.",
    )
  } else {
    nextSteps.push("Subsequent periodic audits are recommended to confirm continued compliance.")
  }

  return { executiveSummary, strengths, improvements, nextSteps }
}

/** The organization's own summary text, trimmed to its first paragraph and capped in length, for compact display. */
export function organizationSummarySnippet(aboutOrganization: string): string {
  const trimmed = (aboutOrganization || "").trim()
  if (!trimmed) return "No organization summary has been provided for this audit."
  const firstParagraph = trimmed.split(/\n\s*\n/)[0].trim()
  if (firstParagraph.length <= 280) return firstParagraph
  return `${firstParagraph.slice(0, 277).trim()}...`
}

/** A short, one paragraph blurb for the View Details page: organization context plus audit outcome. */
export function generateQuickSummary(audit: AuditRecord, thresholds?: MaturityThresholds): string {
  const { scorePct, maturity, availableCount, totalCount } = computeScore(audit.documentStatus, thresholds)
  const orgLabel = audit.organizationName || "This organization"
  const about = firstSentence(audit.aboutOrganization)
  const outcome = `${orgLabel} has ${availableCount} of ${totalCount} required HR governance documents confirmed available, resulting in a Compliance Score of ${scorePct.toFixed(
    0,
  )} percent and a maturity classification of ${maturity}.`
  return about ? `${about} ${outcome}` : outcome
}
