"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { LogOut, Plus, ShieldCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { MaturityBadge } from "@/components/maturity-badge"
import { getAudits } from "@/lib/audit-store"
import { computeScore } from "@/lib/scoring"
import type { AuditRecord } from "@/lib/audit-types"

interface CurrentUser {
  username: string
}

export default function DashboardPage() {
  const router = useRouter()
  const [audits, setAudits] = useState<AuditRecord[]>([])
  const [user, setUser] = useState<CurrentUser | null>(null)

  useEffect(() => {
    getAudits().then(setAudits)
    fetch("/api/auth/me")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => data?.user && setUser(data.user))
  }, [])

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" })
    router.push("/")
  }

  return (
    <main className="mx-auto max-w-5xl p-6">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldCheck className="size-6 text-primary" />
          <h1 className="text-2xl font-semibold">Dashboard Overview</h1>
        </div>
        <div className="flex items-center gap-3">
          {user && <span className="text-sm text-muted-foreground">Signed in as {user.username}</span>}
          <Button variant="outline" onClick={handleLogout}>
            <LogOut className="size-4" />
            Logout
          </Button>
          <Button asChild>
            <Link href="/audit/new">
              <Plus className="size-4" />
              New Audit
            </Link>
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Organizations Audited</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Organizations</TableHead>
                <TableHead>Auditor</TableHead>
                <TableHead>Score</TableHead>
                <TableHead>Maturity</TableHead>
                <TableHead className="text-right">View</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {audits.map((audit) => {
                const { scorePct, maturity } = computeScore(audit.documentStatus)
                return (
                  <TableRow key={audit.id}>
                    <TableCell className="font-medium">{audit.organizationName}</TableCell>
                    <TableCell>{audit.auditorName}</TableCell>
                    <TableCell>{scorePct.toFixed(0)}%</TableCell>
                    <TableCell>
                      <MaturityBadge maturity={maturity} />
                    </TableCell>
                    <TableCell className="text-right">
                      <Button asChild variant="outline" size="sm">
                        <Link href={`/audit/${audit.id}`}>View Details</Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                )
              })}
              {audits.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                    No audits yet. Click "New Audit" to get started.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </main>
  )
}
