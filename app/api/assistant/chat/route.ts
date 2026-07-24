import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { verifySessionToken, SESSION_COOKIE } from "@/lib/server/session"
import { getAuditById } from "@/lib/server/audits-db"
import { getEffectiveAssistantSettings } from "@/lib/server/assistant-settings-db"
import { AUDIT_DOCUMENTS } from "@/lib/documents"
import { computeScore } from "@/lib/scoring"

interface ChatMessage {
  role: "user" | "assistant"
  content: string
}

function buildSystemPrompt(basePrompt: string, audit: Awaited<ReturnType<typeof getAuditById>>): string {
  if (!audit) return basePrompt

  const { scorePct, maturity, availableCount, totalCount } = computeScore(audit.documentStatus)
  const docLines = AUDIT_DOCUMENTS.map(
    (doc) => `${doc.name}: ${audit.documentStatus[doc.id] === "Available" ? "Available" : "Not Available"}`,
  ).join("\n")

  return (
    `${basePrompt}\n\n` +
    "You also have access to the following audit currently open in the application, and should ground your answers in it whenever the question relates to this audit:\n\n" +
    `Organization: ${audit.organizationName || "Not provided"}\n` +
    `Department: ${audit.department || "Not provided"}\n` +
    `Auditor: ${audit.auditorName || "Not provided"} (${audit.auditorDesignation || "Not provided"})\n` +
    `Audit Date: ${audit.auditDate || "Not provided"}\n` +
    `About Organization: ${audit.aboutOrganization || "Not provided"}\n` +
    `Audit Score: ${availableCount} of ${totalCount} required documents confirmed available\n` +
    `Compliance Score: ${scorePct.toFixed(1)} percent, maturity classification of ${maturity}\n\n` +
    `Document status:\n${docLines}`
  )
}

export async function POST(req: Request) {
  const token = (await cookies()).get(SESSION_COOKIE)?.value
  const session = await verifySessionToken(token)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json().catch(() => null)
  const messages = body?.messages as ChatMessage[] | undefined
  if (!Array.isArray(messages) || messages.length === 0) {
    return NextResponse.json({ error: "A message is required." }, { status: 400 })
  }

  const auditId = typeof body?.auditId === "string" ? body.auditId : undefined
  const audit = auditId ? await getAuditById(auditId) : undefined
  const { settings, isOverridden } = await getEffectiveAssistantSettings(auditId)

  if (!settings.assistantEnabled) {
    return NextResponse.json(
      { error: isOverridden ? "The assistant has been disabled by IT for this organization." : "The assistant has been disabled by IT." },
      { status: 503 },
    )
  }

  const apiKey = process.env.NVIDIA_API_KEY
  if (!apiKey) {
    return NextResponse.json(
      { error: "The assistant is not yet configured. Add NVIDIA_API_KEY to .env.local and restart the server." },
      { status: 500 },
    )
  }

  try {
    const res = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: settings.model,
        max_tokens: settings.maxTokens,
        temperature: settings.temperature,
        stream: false,
        messages: [
          { role: "system", content: buildSystemPrompt(settings.systemPrompt, audit) },
          ...messages.map((m) => ({ role: m.role, content: m.content })),
        ],
      }),
    })

    if (!res.ok) {
      const detail = await res.text().catch(() => "")
      return NextResponse.json({ error: `The assistant request failed (${res.status}). ${detail}` }, { status: 502 })
    }

    const data = await res.json()
    const reply = data.choices?.[0]?.message?.content ?? ""
    return NextResponse.json({ reply })
  } catch {
    return NextResponse.json({ error: "Could not reach the assistant. Please try again." }, { status: 502 })
  }
}
