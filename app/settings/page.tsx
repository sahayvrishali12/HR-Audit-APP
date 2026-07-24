"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Settings2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { AssistantSettings } from "@/components/assistant-settings"
import { SummarySettings } from "@/components/summary-settings"
import { useCurrentUser } from "@/lib/use-current-user"

export default function SettingsPage() {
  const user = useCurrentUser()
  const router = useRouter()

  useEffect(() => {
    if (user === null || (user && user.role !== "it_guy")) {
      router.replace("/dashboard")
    }
  }, [user, router])

  if (user === undefined || !user || user.role !== "it_guy") return null

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Settings2 className="size-6 text-primary" />
          <h1 className="text-2xl font-semibold">Assistant &amp; AI Settings</h1>
        </div>
        <Button variant="outline" asChild>
          <Link href="/dashboard">
            <ArrowLeft className="size-4" />
            Back to Dashboard
          </Link>
        </Button>
      </div>
      <p className="-mt-4 text-sm text-muted-foreground">
        These settings apply to the whole application and are visible only to the IT role.
      </p>

      <AssistantSettings />
      <SummarySettings />
    </div>
  )
}
