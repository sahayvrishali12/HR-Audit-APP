import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { verifySessionToken, SESSION_COOKIE } from "@/lib/server/session"
import { getUserById, listUsers, createUser, usernameTaken } from "@/lib/server/users-db"
import { canManageUsers, ALL_ROLES, ROLE_LABEL, type Role } from "@/lib/roles"

async function requireAdmin() {
  const token = (await cookies()).get(SESSION_COOKIE)?.value
  const session = await verifySessionToken(token)
  if (!session) return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) } as const
  const user = await getUserById(session.sub)
  if (!user || !canManageUsers(user.role)) {
    return { error: NextResponse.json({ error: "Your role does not have permission to manage users." }, { status: 403 }) } as const
  }
  return { user } as const
}

export async function GET() {
  const result = await requireAdmin()
  if (result.error) return result.error

  return NextResponse.json({ users: await listUsers(), roles: ALL_ROLES })
}

export async function POST(req: Request) {
  const result = await requireAdmin()
  if (result.error) return result.error

  const body = await req.json().catch(() => null)
  const username = typeof body?.username === "string" ? body.username.trim() : ""
  const password = typeof body?.password === "string" ? body.password : ""
  const name = typeof body?.name === "string" ? body.name.trim() : ""
  const designation = typeof body?.designation === "string" ? body.designation.trim() : ""
  const role = body?.role as Role

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(username)) {
    return NextResponse.json(
      { error: "Enter a valid corporate email address, e.g. name@company.com." },
      { status: 400 },
    )
  }
  if (password.length < 6) {
    return NextResponse.json({ error: "Password must be at least 6 characters." }, { status: 400 })
  }
  if (!name) {
    return NextResponse.json({ error: "Name is required." }, { status: 400 })
  }
  if (!ALL_ROLES.includes(role)) {
    return NextResponse.json({ error: "A valid role is required." }, { status: 400 })
  }

  if (await usernameTaken(username)) {
    return NextResponse.json({ error: "That username is already taken." }, { status: 409 })
  }

  const created = await createUser({ username, password, name, designation: designation || ROLE_LABEL[role], role })
  if (!created) {
    return NextResponse.json({ error: "That username is already taken." }, { status: 409 })
  }
  return NextResponse.json({ user: created }, { status: 201 })
}
