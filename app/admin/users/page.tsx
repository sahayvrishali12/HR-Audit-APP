"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Trash2, UserPlus, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useCurrentUser } from "@/lib/use-current-user"
import { canManageUsers, ALL_ROLES, ROLE_LABEL, type Role } from "@/lib/roles"
import { getUsers, createUser, deleteUser, type DirectoryUser } from "@/lib/user-store"

const EMPTY_FORM = { username: "", password: "", name: "", designation: "", role: "hr_employee" as Role }

export default function ManageUsersPage() {
  const user = useCurrentUser()
  const router = useRouter()
  const allowed = !!user && canManageUsers(user.role)

  const [users, setUsers] = useState<DirectoryUser[] | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [saving, setSaving] = useState(false)
  const [pendingDelete, setPendingDelete] = useState<DirectoryUser | null>(null)
  const [deleteError, setDeleteError] = useState("")
  const [deleting, setDeleting] = useState(false)

  function load() {
    getUsers().then(setUsers)
  }

  useEffect(() => {
    if (allowed) load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allowed])

  useEffect(() => {
    if (user === null || (user && !canManageUsers(user.role))) {
      router.replace("/dashboard")
    }
  }, [user, router])

  if (user === undefined || !allowed) return null

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setSuccess("")
    setSaving(true)
    const result = await createUser(form)
    setSaving(false)
    if (!result.ok) {
      setError(result.error)
      return
    }
    setSuccess(`Account "${form.username}" created.`)
    setForm({ ...EMPTY_FORM, role: form.role })
    load()
  }

  async function handleDelete() {
    if (!pendingDelete) return
    setDeleteError("")
    setDeleting(true)
    const result = await deleteUser(pendingDelete.id)
    setDeleting(false)
    if (!result.ok) {
      setDeleteError(result.error)
      return
    }
    setPendingDelete(null)
    load()
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="size-6 text-primary" />
          <h1 className="text-2xl font-semibold">Manage Users</h1>
        </div>
        <Button variant="outline" asChild>
          <Link href="/dashboard">
            <ArrowLeft className="size-4" />
            Back to Dashboard
          </Link>
        </Button>
      </div>
      <p className="-mt-4 text-sm text-muted-foreground">
        Create login accounts for HR Managers, HR Employees, IT, and other Admins.
      </p>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="size-5 text-primary" />
            Add New Account
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreate} className="flex flex-col gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-2">
                <Label>Corporate Email</Label>
                <Input
                  type="email"
                  value={form.username}
                  onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))}
                  placeholder="e.g. jordan.lee@company.com"
                  autoComplete="off"
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label>Password</Label>
                <Input
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                  placeholder="At least 6 characters"
                  autoComplete="new-password"
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label>Full Name</Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Jordan Lee"
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label>Designation (optional)</Label>
                <Input
                  value={form.designation}
                  onChange={(e) => setForm((f) => ({ ...f, designation: e.target.value }))}
                  placeholder={ROLE_LABEL[form.role]}
                />
              </div>
            </div>
            <div className="flex flex-col gap-2 sm:w-1/2">
              <Label>Role</Label>
              <Select value={form.role} onValueChange={(v) => setForm((f) => ({ ...f, role: v as Role }))}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ALL_ROLES.map((r) => (
                    <SelectItem key={r} value={r}>
                      {ROLE_LABEL[r]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            {success && <p className="text-sm text-emerald-600">{success}</p>}
            <div>
              <Button type="submit" disabled={saving}>
                {saving ? "Creating..." : "Create Account"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Existing Accounts</CardTitle>
          <CardDescription>
            {users ? `${users.length} account${users.length === 1 ? "" : "s"}` : "Loading..."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Corporate Email</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Designation</TableHead>
                <TableHead>Role</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users?.map((u) => {
                const isSelf = u.id === user?.id
                return (
                  <TableRow key={u.id}>
                    <TableCell className="font-medium">{u.username}</TableCell>
                    <TableCell>{u.name}</TableCell>
                    <TableCell>{u.designation}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{ROLE_LABEL[u.role]}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                        disabled={isSelf}
                        title={isSelf ? "You cannot delete your own account." : `Delete ${u.username}`}
                        onClick={() => {
                          setDeleteError("")
                          setPendingDelete(u)
                        }}
                      >
                        <Trash2 className="size-4" />
                        <span className="sr-only">Delete {u.username}</span>
                      </Button>
                    </TableCell>
                  </TableRow>
                )
              })}
              {users && users.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="py-6 text-center text-muted-foreground">
                    No accounts yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={!!pendingDelete} onOpenChange={(open) => !open && setPendingDelete(null)}>
        <DialogContent>
          {pendingDelete && (
            <>
              <DialogHeader>
                <DialogTitle>Delete account?</DialogTitle>
                <DialogDescription>
                  This permanently removes {pendingDelete.username}&rsquo;s ({pendingDelete.name}) login access. This
                  cannot be undone.
                </DialogDescription>
              </DialogHeader>
              {deleteError && <p className="text-sm text-destructive">{deleteError}</p>}
            </>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setPendingDelete(null)} disabled={deleting}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting ? "Deleting..." : "Delete Account"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
