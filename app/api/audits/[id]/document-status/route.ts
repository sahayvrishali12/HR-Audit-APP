import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { verifySessionToken, SESSION_COOKIE } from "@/lib/server/session"
import { getUserById } from "@/lib/server/users-db"
import { getAuditById, upsertAudit } from "@/lib/server/audits-db"
import { canEditDocumentStatus } from "@/lib/roles"
import { AUDIT_DOCUMENTS } from "@/lib/documents"
import type { DocStatus } from "@/lib/audit-types"

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const token = (await cookies()).get(SESSION_COOKIE)?.value
  const session = await verifySessionToken(token)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const user = await getUserById(session.sub)
  if (!user || !canEditDocumentStatus(user.role)) {
    return NextResponse.json({ error: "Your role does not have permission to edit document status." }, { status: 403 })
  }

  const { id } = await params
  const audit = await getAuditById(id)
  if (!audit) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const body = await req.json().catch(() => null)
  const incoming = body?.documentStatus
  if (!incoming || typeof incoming !== "object") {
    return NextResponse.json({ error: "Invalid document status payload." }, { status: 400 })
  }

  const validIds = new Set(AUDIT_DOCUMENTS.map((d) => d.id))
  const documentStatus: Record<string, DocStatus> = { ...audit.documentStatus }
  for (const [docId, status] of Object.entries(incoming)) {
    if (validIds.has(docId) && (status === "Available" || status === "Not Available")) {
      documentStatus[docId] = status
    }
  }

  await upsertAudit({ ...audit, documentStatus })
  return NextResponse.json({ ok: true })
}
