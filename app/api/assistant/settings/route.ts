import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { verifySessionToken, SESSION_COOKIE } from "@/lib/server/session"
import { getUserById } from "@/lib/server/users-db"
import {
  ALLOWED_MODELS,
  getAssistantSettings,
  isValidModel,
  saveAssistantSettings,
} from "@/lib/server/assistant-settings-db"

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

export async function GET() {
  const result = await requireItUser()
  if (result.error) return result.error

  return NextResponse.json({ settings: await getAssistantSettings(), allowedModels: ALLOWED_MODELS })
}

export async function POST(req: Request) {
  const result = await requireItUser()
  if (result.error) return result.error

  const body = await req.json().catch(() => null)
  if (!body || !isValidModel(body.model)) {
    return NextResponse.json({ error: "A valid model is required." }, { status: 400 })
  }

  const temperature = Number(body.temperature)
  if (!Number.isFinite(temperature) || temperature < 0 || temperature > 1) {
    return NextResponse.json({ error: "Temperature must be between 0 and 1." }, { status: 400 })
  }

  const maxTokens = Number(body.maxTokens)
  if (!Number.isFinite(maxTokens) || maxTokens < 100 || maxTokens > 4096) {
    return NextResponse.json({ error: "Max tokens must be between 100 and 4096." }, { status: 400 })
  }

  const systemPrompt = typeof body.systemPrompt === "string" ? body.systemPrompt.trim() : ""
  if (!systemPrompt) {
    return NextResponse.json({ error: "System prompt cannot be empty." }, { status: 400 })
  }

  const assistantEnabled = body.assistantEnabled !== false

  await saveAssistantSettings({ model: body.model, temperature, maxTokens, systemPrompt, assistantEnabled })
  return NextResponse.json({ ok: true })
}
