import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { verifySessionToken, SESSION_COOKIE } from "@/lib/server/session"
import { getUserById } from "@/lib/server/users-db"
import { listAudits, upsertAudit } from "@/lib/server/audits-db"
import { canEdit } from "@/lib/roles"

async function requireSession() {
  const token = (await cookies()).get(SESSION_COOKIE)?.value
  return verifySessionToken(token)
}

export async function GET() {
  const session = await requireSession()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  return NextResponse.json({ audits: await listAudits() })
}

export async function POST(req: Request) {
  const session = await requireSession()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const user = await getUserById(session.sub)
  if (!user || !canEdit(user.role)) {
    return NextResponse.json({ error: "Your role does not have permission to edit audits." }, { status: 403 })
  }

  const audit = await req.json().catch(() => null)
  if (!audit?.id) return NextResponse.json({ error: "Invalid audit payload." }, { status: 400 })

  await upsertAudit(audit)
  return NextResponse.json({ ok: true })
}
