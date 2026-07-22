export interface AuditDocument {
  id: string
  name: string
  weightage: number
}

const RAW_DOCS: string[] = [
  "Employee Handbook",
  "Code of Conduct",
  "Confidentiality Agreement/NDA",
  "Leave Policy",
  "Attendance Policy",
  "POSH Policy",
  "Information Security Policy",
  "Data Privacy Policy",
  "Work From Home Policy",
  "Disciplinary Policy",
  "Asset Handover Form",
  "Software Access Request Form",
  "HR Governance Policy/Framework",
  "HR Organization Structure",
  "HR Roles and Responsibility Matrix",
  "Background Verification Policy",
  "Compensation and Benefits Policy",
  "Performance Management Policy",
  "Promotion and Increment Policy",
  "Learning and Development Policy",
  "Employee Grievance Policy",
  "Conflict of Interest Policy",
  "Equal Opportunity/DEI Policy",
  "Retention Policy",
  "HR Risk & Compliance Register",
]

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
}

export const AUDIT_DOCUMENTS: AuditDocument[] = RAW_DOCS.map((name) => ({
  id: slugify(name),
  name,
  weightage: 4,
}))

export const TOTAL_WEIGHTAGE = AUDIT_DOCUMENTS.reduce((sum, d) => sum + d.weightage, 0)
