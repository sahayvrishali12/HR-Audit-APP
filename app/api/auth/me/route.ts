import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { verifySessionToken, SESSION_COOKIE } from "@/lib/server/session"
import { getUserById } from "@/lib/server/users-db"

export async function GET() {
  const token = (await cookies()).get(SESSION_COOKIE)?.value
  const session = await verifySessionToken(token)
  if (!session) return NextResponse.json({ user: null }, { status: 401 })

  const user = await getUserById(session.sub)
  return NextResponse.json({ user })
}
