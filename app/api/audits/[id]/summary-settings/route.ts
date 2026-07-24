import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { verifySessionToken, SESSION_COOKIE } from "@/lib/server/session"
import { getUserById } from "@/lib/server/users-db"
import { AUDIT_DOCUMENTS } from "@/lib/documents"
import {
  getEffectiveSummarySettings,
  isValidThresholds,
  isValidCriticalDocuments,
  saveSummarySettingsOverride,
  clearSummarySettingsOverride,
} from "@/lib/server/summary-settings-db"

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const token = (await cookies()).get(SESSION_COOKIE)?.value
  const session = await verifySessionToken(token)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const { settings, isOverridden } = await getEffectiveSummarySettings(id)
  return NextResponse.json({ settings, isOverridden, allDocuments: AUDIT_DOCUMENTS.map((d) => d.name) })
}

async function requireItUser() {
  const token = (await cookies()).get(SESSION_COOKIE)?.value
  const session = await verifySessionToken(token)
  if (!session) return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) } as const
  const user = await getUserById(session.sub)
  if (!user || user.role !== "it_guy") {
    return { error: NextResponse.json({ error: "This feature is only available to the IT role." }, { status: 403 }) } as const
  }
  return { user } as const
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const result = await requireItUser()
  if (result.error) return result.error

  const { id } = await params
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

  await saveSummarySettingsOverride(id, { thresholds: body.thresholds, criticalDocuments: body.criticalDocuments })
  return NextResponse.json({ ok: true })
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const result = await requireItUser()
  if (result.error) return result.error

  const { id } = await params
  await clearSummarySettingsOverride(id)
  return NextResponse.json({ ok: true })
}
