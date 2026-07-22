const TEMPLATES: ((org: string, dept: string) => string)[] = [
  (org, dept) =>
    `${org} is an organization currently undergoing an HR governance and compliance review. This audit evaluates its ${dept} function against a 25-point HR policy governance checklist covering documentation such as employee handbooks, codes of conduct, statutory policies, and risk registers. The findings will help ${org} recognize existing strengths in its HR governance framework and prioritize closing any gaps to strengthen compliance and workforce practices going forward.`,
  (org, dept) =>
    `${org} operates a ${dept} function that is the subject of this HR governance audit. The review assesses the organization's HR policy documentation, from foundational governance frameworks to statutory and risk-management policies, to establish a clear picture of its current compliance posture. Outcomes from this audit are intended to guide ${org} in prioritizing remediation and maturing its HR governance practices over time.`,
  (org, dept) =>
    `This audit examines the HR governance practices of ${org}, with a focus on the organization's ${dept} function. It benchmarks existing HR policy documentation against a standardized 25-document governance checklist to identify both strengths and gaps. The resulting Audit Score and Compliance Score are intended to support ${org} in strengthening its HR governance framework and workforce compliance over time.`,
]

/** Drafts a starting "About Organization" paragraph from just the org name + department. No API call — pick and rotate through templates. */
export function generateOrgSummaryDraft(organizationName: string, department: string): string {
  const org = organizationName.trim() || "This organization"
  const dept = department.trim() || "Human Resources"
  const template = TEMPLATES[Math.floor(Math.random() * TEMPLATES.length)]
  return template(org, dept)
}
