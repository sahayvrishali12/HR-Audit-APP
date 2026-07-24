import type { Role } from "./roles"

export interface DirectoryUser {
  id: string
  username: string
  name: string
  designation: string
  role: Role
}

export async function getUsers(): Promise<DirectoryUser[]> {
  const res = await fetch("/api/users")
  if (!res.ok) return []
  const data = await res.json()
  return data.users as DirectoryUser[]
}

export async function createUser(input: {
  username: string
  password: string
  name: string
  designation: string
  role: Role
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const res = await fetch("/api/users", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) return { ok: false, error: data.error || "Could not create the user." }
  return { ok: true }
}

export async function deleteUser(id: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const res = await fetch(`/api/users/${encodeURIComponent(id)}`, { method: "DELETE" })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) return { ok: false, error: data.error || "Could not delete the user." }
  return { ok: true }
}
