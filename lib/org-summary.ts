const TEMPLATES: ((org: string, dept: string) => string)[] = [
  (org, dept) =>
    `${org} is undergoing an HR governance audit conducted with respect to its ${dept} function. The audit assesses the availability of required HR policy documentation against a standardized governance checklist of 25 documents, covering workplace policy, statutory compliance, and risk management. Results from this audit establish an objective basis for the organization's compliance posture and inform priorities relevant to HR governance, workforce management, and regulatory readiness.`,
  (org, dept) =>
    `This audit examines the HR governance documentation of ${org}, with particular focus on its ${dept} function. The review benchmarks existing policy documentation against a standardized checklist of 25 required governance documents to establish the organization's current compliance position. Outcomes from this audit are intended to support ${org} in strengthening workforce policy, regulatory readiness, and operational continuity.`,
  (org, dept) =>
    `${org} is the subject of this HR governance audit, which evaluates HR policy documentation associated with its ${dept} function against a standardized checklist of 25 required documents. The audit provides an objective basis for assessing the organization's compliance posture and identifies priorities relevant to HR governance, workforce management, and regulatory readiness going forward.`,
]

/**
 * Drafts a starting About Organization paragraph from the organization name and department only.
 * Deliberately does not assert industry, scale, or geography, since the tool has no factual basis for them.
 */
export function generateOrgSummaryDraft(organizationName: string, department: string): string {
  const org = organizationName.trim() || "This organization"
  const dept = department.trim() || "Human Resources"
  const template = TEMPLATES[Math.floor(Math.random() * TEMPLATES.length)]
  return template(org, dept)
}
