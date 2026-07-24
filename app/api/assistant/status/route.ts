import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { verifySessionToken, SESSION_COOKIE } from "@/lib/server/session"
import { getEffectiveAssistantSettings } from "@/lib/server/assistant-settings-db"

export async function GET(req: Request) {
  const token = (await cookies()).get(SESSION_COOKIE)?.value
  const session = await verifySessionToken(token)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const auditId = new URL(req.url).searchParams.get("auditId") ?? undefined
  const { settings } = await getEffectiveAssistantSettings(auditId)
  return NextResponse.json({
    enabled: settings.assistantEnabled,
    configured: !!process.env.NVIDIA_API_KEY,
  })
}
