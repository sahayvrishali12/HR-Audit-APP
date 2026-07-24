import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { verifySessionToken, SESSION_COOKIE } from "@/lib/server/session"
import { getUserById } from "@/lib/server/users-db"
import { AUDIT_DOCUMENTS } from "@/lib/documents"
import {
  getSummarySettings,
  saveSummarySettings,
  isValidThresholds,
  isValidCriticalDocuments,
} from "@/lib/server/summary-settings-db"

export async function GET() {
  const token = (await cookies()).get(SESSION_COOKIE)?.value
  const session = await verifySessionToken(token)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  return NextResponse.json({
    settings: await getSummarySettings(),
    allDocuments: AUDIT_DOCUMENTS.map((d) => d.name),
  })
}

export async function POST(req: Request) {
  const token = (await cookies()).get(SESSION_COOKIE)?.value
  const session = await verifySessionToken(token)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const user = await getUserById(session.sub)
  if (!user || user.role !== "it_guy") {
    return NextResponse.json({ error: "This feature is only available to the IT role." }, { status: 403 })
  }

  const body = await req.json().catch(() => null)
  if (!body || !isValidThresholds(body.thresholds)) {
    return NextResponse.json(
      { error: "Maturity thresholds must be increasing percentages between 0 and 100." },
      { status: 400 },
    )
  }
  if (!isValidCriticalDocuments(body.criticalDocuments)) {
    return NextResponse.json({ error: "Compliance critical documents must be a list of known document names." }, { status: 400 })
  }

  await saveSummarySettings({ thresholds: body.thresholds, criticalDocuments: body.criticalDocuments })
  return NextResponse.json({ ok: true })
}
