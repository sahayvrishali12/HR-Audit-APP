"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { LogOut, Plus, ShieldCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { MaturityBadge } from "@/components/maturity-badge"
import { getAudits } from "@/lib/audit-store"
import { computeScore } from "@/lib/scoring"
import { useCurrentUser } from "@/lib/use-current-user"
import { canEdit, ROLE_LABEL } from "@/lib/roles"
import type { AuditRecord } from "@/lib/audit-types"

export default function DashboardPage() {
  const router = useRouter()
  const [audits, setAudits] = useState<AuditRecord[]>([])
  const user = useCurrentUser()

  useEffect(() => {
    getAudits().then(setAudits)
  }, [])

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" })
    router.push("/")
  }

  const canCreate = !!user && canEdit(user.role)

  return (
    <main className="mx-auto max-w-5xl p-6">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldCheck className="size-6 text-primary" />
          <h1 className="text-2xl font-semibold">Dashboard Overview</h1>
        </div>
        <div className="flex items-center gap-3">
          {user && (
            <span className="text-sm text-muted-foreground">
              Signed in as {user.username}{" "}
              <Badge variant="outline" className="ml-1 align-middle">
                {ROLE_LABEL[user.role]}
              </Badge>
            </span>
          )}
          <Button variant="outline" onClick={handleLogout}>
            <LogOut className="size-4" />
            Logout
          </Button>
          {canCreate && (
            <Button asChild>
              <Link href="/audit/new">
                <Plus className="size-4" />
                New Audit
              </Link>
            </Button>
          )}
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
                <TableHead>Audit Score</TableHead>
                <TableHead>Compliance Score</TableHead>
                <TableHead className="text-right">View</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {audits.map((audit) => {
                const { scorePct, maturity, availableCount, totalCount } = computeScore(audit.documentStatus)
                return (
                  <TableRow key={audit.id}>
                    <TableCell className="font-medium">{audit.organizationName}</TableCell>
                    <TableCell>{audit.auditorName}</TableCell>
                    <TableCell>
                      {availableCount} / {totalCount}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span>{scorePct.toFixed(0)}%</span>
                        <MaturityBadge maturity={maturity} />
                      </div>
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
                    No audits yet. {canCreate ? 'Click "New Audit" to get started.' : "Check back once an audit has been created."}
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
