export type Priority = 1 | 2 | 3 | 4 | 5

export interface AuditDocument {
  id: string
  name: string
  priority: Priority
  weightage: number
}

export const PRIORITY_LABEL: Record<Priority, string> = {
  1: "Priority 1 — Critical",
  2: "Priority 2 — Important",
  3: "Priority 3 — Statutory & Admin",
  4: "Priority 4 — Conditional",
  5: "Priority 5 — Assets & Access",
}

const RAW_DOCS: { name: string; priority: Priority }[] = [
  { name: "Aadhaar Card", priority: 1 },
  { name: "Appointment Letter", priority: 1 },
  { name: "Background Verification Policy", priority: 1 },
  { name: "Bank Account Details with Cancelled Cheque/Passbook", priority: 1 },
  { name: "CTC Breakup/Compensation Structure", priority: 1 },
  { name: "Code of Conduct", priority: 1 },
  { name: "Compensation and Benefits Policy", priority: 1 },
  { name: "Confidentiality Agreement/NDA", priority: 1 },
  { name: "Conflict of Interest Policy", priority: 1 },
  { name: "Email ID/Login Credentials", priority: 1 },
  { name: "Emergency Contact Details", priority: 1 },
  { name: "Employee Grievance Policy", priority: 1 },
  { name: "Employee Handbook", priority: 1 },
  { name: "Employee ID Number", priority: 1 },
  { name: "Employment Agreement", priority: 1 },
  { name: "Equal Opportunity/DEI Policy", priority: 1 },
  { name: "HR Governance Policy/Framework", priority: 1 },
  { name: "HR Organization Structure", priority: 1 },
  { name: "HR Risk & Compliance Register", priority: 1 },
  { name: "HR Roles and Responsibility Matrix", priority: 1 },
  { name: "Highest Educational Certificates and Marksheets", priority: 1 },
  { name: "Learning and Development Policy", priority: 1 },
  { name: "Offer Letter", priority: 1 },
  { name: "PAN Card", priority: 1 },
  { name: "Passport-size Photographs", priority: 1 },
  { name: "Performance Management Policy", priority: 1 },
  { name: "Promotion and Increment Policy", priority: 1 },
  { name: "Resume/CV", priority: 1 },
  { name: "Retention Policy", priority: 1 },
  { name: "Signed Employee Information Form", priority: 1 },
  { name: "Attendance Policy", priority: 2 },
  { name: "Data Privacy Policy", priority: 2 },
  { name: "Disciplinary Policy", priority: 2 },
  { name: "Experience Certificates", priority: 2 },
  { name: "Increment Letter (if applicable)", priority: 2 },
  { name: "Information Security Policy", priority: 2 },
  { name: "Last 3 Months Salary Slips", priority: 2 },
  { name: "Leave Policy", priority: 2 },
  { name: "POSH Policy", priority: 2 },
  { name: "Previous Appointment Letter", priority: 2 },
  { name: "Relieving Letter", priority: 2 },
  { name: "Work From Home Policy", priority: 2 },
  { name: "Asset Handover Form", priority: 3 },
  { name: "Bank Details Form", priority: 3 },
  { name: "ESIC Number (if applicable)", priority: 3 },
  { name: "Emergency Contact Form", priority: 3 },
  { name: "Employee Information Form", priority: 3 },
  { name: "Form 12B (if joining during the financial year)", priority: 3 },
  { name: "Form 16 from Previous Employer", priority: 3 },
  { name: "Investment Declaration", priority: 3 },
  { name: "Nomination Details", priority: 3 },
  { name: "Previous Employer Tax Details", priority: 3 },
  { name: "Software Access Request Form", priority: 3 },
  { name: "UAN Number (PF)", priority: 3 },
  { name: "Address Proof (if Aadhaar address differs)", priority: 4 },
  { name: "Driving License/Voter ID", priority: 4 },
  { name: "ESIC Forms", priority: 4 },
  { name: "Form 11 (EPF)", priority: 4 },
  { name: "Gratuity Nomination Form", priority: 4 },
  { name: "PF Nomination Form", priority: 4 },
  { name: "Passport Copy", priority: 4 },
  { name: "Police Verification Documents", priority: 4 },
  { name: "Professional Certifications (if hired on this basis)", priority: 4 },
  { name: "Reference Details (if reference exists)", priority: 4 },
  { name: "Tax Declaration Form", priority: 4 },
  { name: "ID Card", priority: 5 },
  { name: "Laptop/Desktop Allocation Form", priority: 5 },
  { name: "System Login Credentials", priority: 5 },
  { name: "VPN Credentials", priority: 5 },
]

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
}

const equalWeight = 100 / RAW_DOCS.length

export const AUDIT_DOCUMENTS: AuditDocument[] = RAW_DOCS.map((d) => ({
  id: slugify(d.name),
  name: d.name,
  priority: d.priority,
  weightage: equalWeight,
}))

export const TOTAL_WEIGHTAGE = AUDIT_DOCUMENTS.reduce((sum, d) => sum + d.weightage, 0)

export const DOCUMENTS_BY_PRIORITY: Record<Priority, AuditDocument[]> = {
  1: AUDIT_DOCUMENTS.filter((d) => d.priority === 1),
  2: AUDIT_DOCUMENTS.filter((d) => d.priority === 2),
  3: AUDIT_DOCUMENTS.filter((d) => d.priority === 3),
  4: AUDIT_DOCUMENTS.filter((d) => d.priority === 4),
  5: AUDIT_DOCUMENTS.filter((d) => d.priority === 5),
}
