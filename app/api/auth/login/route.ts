import { NextResponse } from "next/server"
import { verifyCredentials } from "@/lib/server/users-db"
import { createSessionToken, SESSION_COOKIE, SESSION_MAX_AGE_SECONDS } from "@/lib/server/session"

export async function POST(req: Request) {
  const { username, password } = await req.json().catch(() => ({}))
  if (!username || !password) {
    return NextResponse.json({ error: "Username and password are required." }, { status: 400 })
  }

  const user = await verifyCredentials(username, password)
  if (!user) {
    return NextResponse.json({ error: "Invalid username or password." }, { status: 401 })
  }

  const token = await createSessionToken(user.id)
  const res = NextResponse.json({ user })
  res.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  })
  return res
}
