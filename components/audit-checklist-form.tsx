"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { FileText, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Progress } from "@/components/ui/progress"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { MaturityBadge, PriorityBadge } from "@/components/maturity-badge"
import { AUDIT_DOCUMENTS } from "@/lib/documents"
import { computeScore } from "@/lib/scoring"
import { saveAudit } from "@/lib/audit-store"
import type { AuditRecord, DocStatus } from "@/lib/audit-types"

export function AuditChecklistForm({ initial }: { initial: AuditRecord }) {
  const router = useRouter()
  const [audit, setAudit] = useState<AuditRecord>(initial)
  const [saved, setSaved] = useState(false)

  const { scorePct, maturity } = useMemo(() => computeScore(audit.documentStatus), [audit.documentStatus])

  function updateField<K extends keyof AuditRecord>(key: K, value: AuditRecord[K]) {
    setSaved(false)
    setAudit((prev) => ({ ...prev, [key]: value }))
  }

  function updateDoc(docId: string, status: DocStatus) {
    setSaved(false)
    setAudit((prev) => ({ ...prev, documentStatus: { ...prev.documentStatus, [docId]: status } }))
  }

  async function handleSave() {
    await saveAudit(audit)
    setSaved(true)
    router.push(`/audit/${audit.id}`)
    router.refresh()
  }

  async function handleViewReport() {
    await saveAudit(audit)
    setSaved(true)
    router.push(`/audit/${audit.id}/report`)
  }

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6 p-6">
      <Card>
        <CardHeader>
          <CardTitle>Audit Details</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label>Organization to be Audited</Label>
            <Input
              value={audit.organizationName}
              onChange={(e) => updateField("organizationName", e.target.value)}
              placeholder="Organization name"
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label>Department</Label>
            <Input value={audit.department} onChange={(e) => updateField("department", e.target.value)} />
          </div>
          <div className="flex flex-col gap-2">
            <Label>Auditor</Label>
            <Input value={audit.auditorName} onChange={(e) => updateField("auditorName", e.target.value)} />
          </div>
          <div className="flex flex-col gap-2">
            <Label>Designation of Auditor</Label>
            <Input
              value={audit.auditorDesignation}
              onChange={(e) => updateField("auditorDesignation", e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label>Audit Date</Label>
            <Input type="date" value={audit.auditDate} onChange={(e) => updateField("auditDate", e.target.value)} />
          </div>
          <div className="flex flex-col gap-2 sm:col-span-2">
            <Label>About Organization</Label>
            <Textarea
              rows={4}
              value={audit.aboutOrganization}
              onChange={(e) => updateField("aboutOrganization", e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Compliance Score</span>
            <MaturityBadge maturity={maturity} />
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          <Progress value={scorePct} />
          <p className="text-sm text-muted-foreground">{scorePct.toFixed(1)}% weighted score across 69 documents</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>HR Policy Governance Documents</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">S.No</TableHead>
                <TableHead>Document Name</TableHead>
                <TableHead className="w-20">Priority</TableHead>
                <TableHead className="w-24">Weightage</TableHead>
                <TableHead className="w-48">Available / Not Available</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {AUDIT_DOCUMENTS.map((doc, i) => (
                <TableRow key={doc.id}>
                  <TableCell>{i + 1}</TableCell>
                  <TableCell className="whitespace-normal">{doc.name}</TableCell>
                  <TableCell>
                    <PriorityBadge priority={doc.priority} />
                  </TableCell>
                  <TableCell>{doc.weightage.toFixed(2)}%</TableCell>
                  <TableCell>
                    <Select
                      value={audit.documentStatus[doc.id] ?? "Not Available"}
                      onValueChange={(v) => updateDoc(doc.id, v as DocStatus)}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Available">Available</SelectItem>
                        <SelectItem value="Not Available">Not Available</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between gap-3 pb-6">
        <Button variant="outline" asChild>
          <Link href="/dashboard">Back to Dashboard</Link>
        </Button>
        <div className="flex items-center gap-3">
          <Button onClick={handleSave}>
            <FileText className="size-4" />
            {saved ? "Saved" : "Save Audit"}
          </Button>
          <Button variant="secondary" onClick={handleViewReport}>
            <Sparkles className="size-4" />
            AI Generated Report
          </Button>
        </div>
      </div>
    </div>
  )
}
