import { promises as fs } from "fs"
import path from "path"
import { AUDIT_DOCUMENTS } from "@/lib/documents"
import type { AuditRecord, DocStatus } from "@/lib/audit-types"

const DATA_DIR = path.join(process.cwd(), "data")
const FILE = path.join(DATA_DIR, "audits.json")

const GOVERNANCE_SAMPLE_STATUS: Record<string, DocStatus> = {
  "Employee Handbook": "Available",
  "Code of Conduct": "Not Available",
  "Confidentiality Agreement/NDA": "Available",
  "Leave Policy": "Available",
  "Attendance Policy": "Available",
  "POSH Policy": "Available",
  "Information Security Policy": "Available",
  "Data Privacy Policy": "Available",
  "Work From Home Policy": "Available",
  "Disciplinary Policy": "Available",
  "Asset Handover Form": "Available",
  "Software Access Request Form": "Available",
  "HR Governance Policy/Framework": "Available",
  "HR Organization Structure": "Available",
  "HR Roles and Responsibility Matrix": "Available",
  "Background Verification Policy": "Not Available",
  "Compensation and Benefits Policy": "Not Available",
  "Performance Management Policy": "Not Available",
  "Promotion and Increment Policy": "Not Available",
  "Learning and Development Policy": "Not Available",
  "Employee Grievance Policy": "Not Available",
  "Conflict of Interest Policy": "Not Available",
  "Equal Opportunity/DEI Policy": "Available",
  "Retention Policy": "Available",
  "HR Risk & Compliance Register": "Available",
}

function statusMapForScore(targetPct: number, seedNames: Record<string, DocStatus> = {}): Record<string, DocStatus> {
  const target = Math.round((targetPct / 100) * AUDIT_DOCUMENTS.length)
  const map: Record<string, DocStatus> = {}
  let available = 0
  for (const doc of AUDIT_DOCUMENTS) {
    if (seedNames[doc.name]) {
      map[doc.id] = seedNames[doc.name]
      if (seedNames[doc.name] === "Available") available++
      continue
    }
    map[doc.id] = available < target ? "Available" : "Not Available"
    if (map[doc.id] === "Available") available++
  }
  return map
}

function seedAudits(): AuditRecord[] {
  return [
    {
      id: "xxx-audit",
      organizationName: "Meridian Pharmaceuticals",
      aboutOrganization:
        "Meridian Pharmaceuticals is a global pharmaceutical company with annual revenues of approximately USD 1 billion and a strong international presence across 18 countries. The company operates across diverse pharmaceutical markets and is supported by an expanding portfolio of products, capabilities, and strategic partnerships.\n\nWith a focus on quality, innovation, operational excellence, and responsible growth, Meridian Pharmaceuticals serves customers and healthcare stakeholders across multiple geographies. Its global footprint, diversified operations, and commitment to regulatory compliance position the company as a significant participant in the international pharmaceutical industry.\n\nAs the organization continues to scale, effective governance, workforce capability, regulatory readiness, digital transformation, and robust risk management practices remain critical to sustaining growth over time and strengthening organizational resilience.",
      department: "Human Resources",
      auditorName: "Priya Nair",
      auditorDesignation: "HR Manager",
      auditDate: "2026-06-13",
      createdAt: new Date("2026-06-13").toISOString(),
      documentStatus: statusMapForScore(45, GOVERNANCE_SAMPLE_STATUS),
    },
    {
      id: "zzz-audit",
      organizationName: "Solstice Retail Group",
      aboutOrganization:
        "Solstice Retail Group is a medium sized retail organization operating a network of stores across multiple regions. The organization offers a range of consumer products through both physical retail locations and an online sales channel, serving a broad customer base within a competitive retail market.\n\nSolstice Retail Group maintains a workforce distributed across store level and corporate functions, with Human Resources responsible for supporting recruitment, workforce policy, and employee relations across all locations. As the organization continues to expand its retail footprint, consistent HR governance, workforce policy documentation, and regulatory readiness are relevant to supporting operational consistency and sustainable growth across its store network.",
      department: "Human Resources",
      auditorName: "Arjun Mehta",
      auditorDesignation: "HR Manager",
      auditDate: "2026-05-02",
      createdAt: new Date("2026-05-02").toISOString(),
      documentStatus: statusMapForScore(75),
    },
    {
      id: "sss-audit",
      organizationName: "Ashford & Cole Manufacturing",
      aboutOrganization:
        "Ashford & Cole Manufacturing is an established manufacturing organization producing industrial components for commercial and institutional clients. The organization operates production facilities supported by a structured workforce spanning manufacturing, quality assurance, and administrative functions.\n\nAshford & Cole Manufacturing maintains a mature HR governance framework developed over an extended operating history. Continued attention to workforce safety, regulatory compliance, and succession planning remains relevant to sustaining operational continuity and reinforcing the organization's established market position.",
      department: "Human Resources",
      auditorName: "Priya Nair",
      auditorDesignation: "HR Manager",
      auditDate: "2026-04-18",
      createdAt: new Date("2026-04-18").toISOString(),
      documentStatus: statusMapForScore(92),
    },
    {
      id: "ccc-audit",
      organizationName: "Norwood Logistics",
      aboutOrganization:
        "Norwood Logistics is a logistics and freight transportation organization in an early stage of operational development. The organization coordinates transportation and warehousing services for business clients within a limited but expanding regional market.\n\nAs Norwood Logistics establishes its operational base, the organization is in the process of formalizing its Human Resources governance practices, including foundational policy documentation and workforce structure. Development of consistent HR governance, regulatory readiness, and workforce policy is relevant to supporting the organization's continued growth and operational scaling.",
      department: "Human Resources",
      auditorName: "Divya Rao",
      auditorDesignation: "HR Manager",
      auditDate: "2026-03-27",
      createdAt: new Date("2026-03-27").toISOString(),
      documentStatus: statusMapForScore(60),
    },
  ]
}

async function ensureFile(): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true })
  try {
    await fs.access(FILE)
  } catch {
    await fs.writeFile(FILE, JSON.stringify(seedAudits(), null, 2))
  }
}

export async function listAudits(): Promise<AuditRecord[]> {
  await ensureFile()
  const raw = await fs.readFile(FILE, "utf-8")
  const audits = JSON.parse(raw) as AuditRecord[]
  return audits.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
}

export async function getAuditById(id: string): Promise<AuditRecord | undefined> {
  const audits = await listAudits()
  return audits.find((a) => a.id === id)
}

export async function upsertAudit(audit: AuditRecord): Promise<void> {
  await ensureFile()
  const raw = await fs.readFile(FILE, "utf-8")
  const audits = JSON.parse(raw) as AuditRecord[]
  const idx = audits.findIndex((a) => a.id === audit.id)
  if (idx >= 0) audits[idx] = audit
  else audits.push(audit)
  await fs.writeFile(FILE, JSON.stringify(audits, null, 2))
}
