import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { verifySessionToken, SESSION_COOKIE } from "@/lib/server/session"
import { getUserById, deleteUser } from "@/lib/server/users-db"
import { canManageUsers } from "@/lib/roles"

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const token = (await cookies()).get(SESSION_COOKIE)?.value
  const session = await verifySessionToken(token)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const user = await getUserById(session.sub)
  if (!user || !canManageUsers(user.role)) {
    return NextResponse.json({ error: "Your role does not have permission to manage users." }, { status: 403 })
  }

  const { id } = await params
  if (id === user.id) {
    return NextResponse.json({ error: "You cannot delete your own account." }, { status: 400 })
  }

  const deleted = await deleteUser(id)
  if (!deleted) {
    return NextResponse.json({ error: "User not found." }, { status: 404 })
  }
  return NextResponse.json({ ok: true })
}
