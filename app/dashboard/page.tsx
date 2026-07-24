"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { FileText, LogOut, Plus, Settings2, ShieldCheck, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { MaturityBadge } from "@/components/maturity-badge"
import { GradientBlob } from "@/components/gradient-blob"
import { getAudits } from "@/lib/audit-store"
import { computeScore } from "@/lib/scoring"
import { organizationSummarySnippet } from "@/lib/ai-summary"
import { useCurrentUser } from "@/lib/use-current-user"
import { useSummarySettings } from "@/lib/use-summary-settings"
import { canEdit, canManageUsers, ROLE_LABEL } from "@/lib/roles"
import type { AuditRecord } from "@/lib/audit-types"

export default function DashboardPage() {
  const router = useRouter()
  const [audits, setAudits] = useState<AuditRecord[]>([])
  const [previewAudit, setPreviewAudit] = useState<AuditRecord | null>(null)
  const user = useCurrentUser()
  const { thresholds } = useSummarySettings(previewAudit?.id)

  useEffect(() => {
    getAudits().then(setAudits)
  }, [])

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" })
    router.push("/")
  }

  const canCreate = !!user && canEdit(user.role)
  const isItGuy = user?.role === "it_guy"
  const isAdmin = !!user && canManageUsers(user.role)
  const preview = previewAudit ? computeScore(previewAudit.documentStatus, thresholds) : null

  return (
    <main className="relative mx-auto max-w-5xl overflow-hidden p-6">
      <GradientBlob className="-right-16 -top-20 h-64 w-64 opacity-25" />
      <div className="relative z-10 mb-6 flex items-center justify-between">
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
          {isAdmin && (
            <Button variant="outline" asChild>
              <Link href="/admin/users">
                <Users className="size-4" />
                Manage Users
              </Link>
            </Button>
          )}
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
              {audits.map((audit) => (
                <DashboardAuditRow key={audit.id} audit={audit} isItGuy={isItGuy} onPreview={setPreviewAudit} />
              ))}
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

      <Dialog open={!!previewAudit} onOpenChange={(open) => !open && setPreviewAudit(null)}>
        <DialogContent>
          {previewAudit && preview && (
            <>
              <DialogHeader>
                <DialogTitle>
                  <button
                    type="button"
                    className="text-left text-primary underline-offset-4 hover:underline"
                    onClick={() => router.push(`/audit/${previewAudit.id}`)}
                  >
                    {previewAudit.organizationName || "Untitled Organization"}
                  </button>
                </DialogTitle>
                <DialogDescription>{organizationSummarySnippet(previewAudit.aboutOrganization)}</DialogDescription>
              </DialogHeader>
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-lg border p-3">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Audit Score</p>
                  <p className="text-2xl font-semibold">
                    {preview.availableCount} <span className="text-sm font-normal text-muted-foreground">/ {preview.totalCount}</span>
                  </p>
                </div>
                <div className="rounded-lg border p-3">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Compliance Score</p>
                  <div className="flex items-center gap-2">
                    <p className="text-2xl font-semibold">{preview.scorePct.toFixed(0)}%</p>
                    <MaturityBadge maturity={preview.maturity} />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button onClick={() => router.push(`/audit/${previewAudit.id}`)}>
                  <FileText className="size-4" />
                  Open Document Page
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </main>
  )
}

function DashboardAuditRow({
  audit,
  isItGuy,
  onPreview,
}: {
  audit: AuditRecord
  isItGuy: boolean
  onPreview: (audit: AuditRecord) => void
}) {
  const { thresholds } = useSummarySettings(audit.id)
  const { scorePct, maturity, availableCount, totalCount } = computeScore(audit.documentStatus, thresholds)

  return (
    <TableRow>
      <TableCell className="font-medium">
        <Link href={`/audit/${audit.id}`} className="underline-offset-4 hover:text-primary hover:underline">
          {audit.organizationName || "Untitled Organization"}
        </Link>
      </TableCell>
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
        <div className="flex items-center justify-end gap-2">
          {isItGuy && (
            <Button variant="outline" size="sm" asChild>
              <Link href={`/audit/${audit.id}/settings`}>
                <Settings2 className="size-4" />
                AI Settings
              </Link>
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={() => onPreview(audit)}>
            View Details
          </Button>
        </div>
      </TableCell>
    </TableRow>
  )
}
