import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { verifySessionToken, SESSION_COOKIE } from "@/lib/server/session"
import { getUserById } from "@/lib/server/users-db"
import { isValidModel } from "@/lib/server/assistant-settings-db"

export async function POST(req: Request) {
  const token = (await cookies()).get(SESSION_COOKIE)?.value
  const session = await verifySessionToken(token)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const user = await getUserById(session.sub)
  if (!user || user.role !== "it_guy") {
    return NextResponse.json({ error: "This feature is only available to the IT role." }, { status: 403 })
  }

  const apiKey = process.env.NVIDIA_API_KEY
  if (!apiKey) {
    return NextResponse.json({ ok: false, error: "NVIDIA_API_KEY is not set in .env.local." }, { status: 200 })
  }

  const body = await req.json().catch(() => null)
  if (!body || !isValidModel(body.model)) {
    return NextResponse.json({ error: "A valid model is required." }, { status: 400 })
  }

  const temperature = Number(body.temperature)
  const safeTemperature = Number.isFinite(temperature) ? Math.min(Math.max(temperature, 0), 1) : 0.5

  try {
    const res = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: body.model,
        max_tokens: 16,
        temperature: safeTemperature,
        stream: false,
        messages: [{ role: "user", content: "Reply with only the word OK." }],
      }),
    })

    if (!res.ok) {
      const detail = await res.text().catch(() => "")
      return NextResponse.json({ ok: false, error: `Request failed (${res.status}). ${detail}`.trim() })
    }

    const data = await res.json()
    const reply = data.choices?.[0]?.message?.content ?? ""
    return NextResponse.json({ ok: true, reply })
  } catch {
    return NextResponse.json({ ok: false, error: "Could not reach the NVIDIA API." })
  }
}
