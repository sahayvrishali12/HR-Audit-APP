export type Role = "admin" | "hr_manager" | "hr_employee" | "it_guy"

export const ROLE_LABEL: Record<Role, string> = {
  admin: "Admin",
  hr_manager: "HR Manager",
  hr_employee: "HR Employee",
  it_guy: "IT",
}

export const ALL_ROLES: Role[] = ["admin", "hr_manager", "hr_employee", "it_guy"]

const EDITOR_ROLES: Role[] = ["admin", "hr_manager"]
const DOCUMENT_STATUS_EDITOR_ROLES: Role[] = ["admin", "hr_manager", "hr_employee"]

export function canEdit(role: Role): boolean {
  return EDITOR_ROLES.includes(role)
}

export function canEditDocumentStatus(role: Role): boolean {
  return DOCUMENT_STATUS_EDITOR_ROLES.includes(role)
}

export function canManageUsers(role: Role): boolean {
  return role === "admin"
}
