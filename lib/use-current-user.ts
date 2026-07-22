"use client"

import { useEffect, useState } from "react"
import type { Role } from "@/lib/roles"

export interface CurrentUser {
  id: string
  username: string
  name: string
  designation: string
  role: Role
}

/** undefined = still loading, null = not signed in */
export function useCurrentUser(): CurrentUser | null | undefined {
  const [user, setUser] = useState<CurrentUser | null | undefined>(undefined)

  useEffect(() => {
    let active = true
    fetch("/api/auth/me")
      .then((res) => (res.ok ? res.json() : { user: null }))
      .then((data) => {
        if (active) setUser(data.user ?? null)
      })
      .catch(() => {
        if (active) setUser(null)
      })
    return () => {
      active = false
    }
  }, [])

  return user
}
