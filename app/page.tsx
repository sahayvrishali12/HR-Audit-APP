"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Check, ShieldCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

const FEATURE_HIGHLIGHTS = ["AI Audit Reports", "Compliance Scoring", "Policy Review"]

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email || !password) {
      setError("Please enter both email and password.")
      return
    }
    setError("")
    setLoading(true)
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: email, password }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setError(data.error || "Invalid username or password.")
        setLoading(false)
        return
      }
      router.push("/dashboard")
    } catch {
      setError("Something went wrong. Please try again.")
      setLoading(false)
    }
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden p-4 sm:p-6">
      <div
        className="absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(75% 65% at 80% 32%, color-mix(in oklch, var(--gradient-blue) 15%, transparent), transparent 78%), radial-gradient(70% 70% at 88% 74%, color-mix(in oklch, var(--gradient-pink) 13%, transparent), transparent 78%), radial-gradient(80% 70% at 12% 88%, color-mix(in oklch, var(--gradient-purple) 12%, transparent), transparent 80%), radial-gradient(65% 60% at 8% 8%, color-mix(in oklch, var(--gradient-orange) 10%, transparent), transparent 78%)",
        }}
        aria-hidden="true"
      />

      <div className="relative z-10 flex w-full max-w-6xl animate-in fade-in-0 flex-col items-center gap-12 duration-500 lg:flex-row lg:items-center lg:justify-between lg:gap-20">
        <div className="flex w-full max-w-lg flex-1 flex-col items-center gap-4 text-center lg:-translate-y-3 lg:items-start lg:text-left">
          <span className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            HR Governance Audit
          </span>
          <div className="h-px w-20 bg-border" />
          <h1 className="text-balance text-2xl font-semibold leading-tight sm:text-3xl">
            Ensure HR compliance with confidence.
          </h1>
          <p className="max-w-[480px] text-balance text-sm leading-[1.6] text-muted-foreground">
            Manage HR policy compliance, audit documentation, and governance reporting in one platform built for HR
            and compliance teams.
          </p>
          <div className="mt-2 flex flex-wrap items-center justify-center gap-2 lg:justify-start">
            {FEATURE_HIGHLIGHTS.map((feature) => (
              <span
                key={feature}
                className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-muted/50 px-3.5 py-1.5 text-xs font-medium text-muted-foreground transition-colors duration-150 hover:bg-muted hover:text-foreground"
              >
                <Check className="size-3 text-primary/70" />
                {feature}
              </span>
            ))}
          </div>
        </div>

        <Card className="login-card-shadow w-full max-w-lg shrink-0 border-foreground/[0.06] bg-card shadow-none">
          <CardHeader className="items-center gap-3 pb-2 text-center">
            <div className="mb-1 flex size-14 items-center justify-center rounded-full border border-primary/15 bg-primary/10">
              <ShieldCheck className="size-7 text-primary" />
            </div>
            <CardTitle className="text-2xl">Welcome Back</CardTitle>
            <CardDescription className="text-base">Access your HR Governance Audit Dashboard.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="flex flex-col gap-6">
              <div className="flex flex-col gap-2">
                <Label htmlFor="email">Corporate Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-[54px] rounded-lg border-border/60 transition-colors duration-150 focus-visible:!border-primary/60 focus-visible:!ring-0"
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-[54px] rounded-lg border-border/60 transition-colors duration-150 focus-visible:!border-primary/60 focus-visible:!ring-0"
                />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button type="submit" size="lg" className="login-submit-button w-full" disabled={loading}>
                {loading ? "Signing in..." : "Sign in"}
              </Button>
              <Button
                type="button"
                variant="link"
                className="h-auto p-0 text-sm text-muted-foreground transition-colors duration-150 hover:text-primary"
              >
                Forgot Password?
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
