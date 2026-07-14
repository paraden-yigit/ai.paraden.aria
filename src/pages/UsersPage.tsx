import { useCallback, useState } from "react"
import { Pencil, Plus } from "lucide-react"
import { toast } from "sonner"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { DataState } from "@/components/DataState"
import { ConfirmDialog } from "@/components/ConfirmDialog"
import { PaginationFooter } from "@/components/PaginationFooter"
import { EditUserForm } from "@/features/users/EditUserForm"
import { CreateUserForm } from "@/features/users/CreateUserForm"
import { usePaginatedList } from "@/hooks/usePaginatedList"
import { useAsync } from "@/hooks/useAsync"
import { userService } from "@/services/user.service"
import { teamService } from "@/services/team.service"
import { ApiError } from "@/services/http"
import { useAuth } from "@/features/auth/useAuth"
import { roleLabel } from "@/lib/roles"
import { PERMISSIONS } from "@/lib/permissions"
import { notifyUserCreated } from "@/lib/invite"
import type {
  ClientUser,
  UserManageCreate,
  UserManageUpdate,
} from "@/types/user"

export function UsersPage() {
  const { user: currentUser, hasPermission } = useAuth()
  const canManage = hasPermission(PERMISSIONS.usersManage)

  const fetchUsers = useCallback(
    (params: { skip?: number; limit?: number }) => userService.list(params),
    [],
  )

  const {
    items: users,
    total,
    page,
    setPage,
    skip,
    hasNextPage,
    loading,
    error,
    refetch,
  } = usePaginatedList<ClientUser>(fetchUsers)

  // Teams populate the edit modal's Team select. Only managers open the modal,
  // and only they have the "teams" permission, so fetch lazily for them.
  const { data: teamsResult } = useAsync(
    () =>
      canManage
        ? teamService.list({ limit: 200 })
        : Promise.resolve({ items: [], total: 0 }),
    [canManage],
  )
  const teams = teamsResult?.items ?? []

  const [createOpen, setCreateOpen] = useState(false)
  const [creating, setCreating] = useState(false)
  const [userToEdit, setUserToEdit] = useState<ClientUser | null>(null)
  const [saving, setSaving] = useState(false)
  const [userToDelete, setUserToDelete] = useState<ClientUser | null>(null)
  const [deleting, setDeleting] = useState(false)

  async function handleCreate(payload: UserManageCreate) {
    setCreating(true)
    try {
      const created = await userService.create(payload)
      notifyUserCreated(created)
      setCreateOpen(false)
      refetch()
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to create user.")
    } finally {
      setCreating(false)
    }
  }

  async function handleSave(payload: UserManageUpdate) {
    if (!userToEdit) return
    setSaving(true)
    try {
      await userService.update(userToEdit.id, payload)
      toast.success(`${payload.full_name ?? userToEdit.full_name} updated.`)
      setUserToEdit(null)
      refetch()
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to update user.")
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!userToDelete) return
    setDeleting(true)
    try {
      await userService.remove(userToDelete.id)
      toast.success(`${userToDelete.full_name} deleted.`)
      setUserToDelete(null)
      // Close the edit modal too — it was opened for the now-deleted user.
      setUserToEdit(null)
      refetch()
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to delete user.")
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Users</h1>
          <p className="text-muted-foreground">
            {canManage
              ? "Manage your users' names, teams and roles."
              : "Your team and their roles."}
          </p>
        </div>
        {canManage && (
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="size-4" />
            New user
          </Button>
        )}
      </div>

      <DataState
        loading={loading}
        error={error}
        isEmpty={users.length === 0}
        emptyMessage="No users yet."
        onRetry={refetch}
      >
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Teams</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-40">Role</TableHead>
                {canManage && <TableHead className="w-12" />}
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((u) => {
                // Managers edit everyone except themselves (guards against
                // accidentally demoting the last owner / self-lockout).
                const editable = canManage && u.id !== currentUser?.id
                return (
                  <TableRow key={u.id}>
                    <TableCell className="font-medium">{u.full_name}</TableCell>
                    <TableCell className="text-muted-foreground">{u.email}</TableCell>
                    <TableCell>
                      {u.teams.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {u.teams.map((team) => (
                            <Badge key={team.id} variant="secondary">
                              {team.name}
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{u.status}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{roleLabel(u.role)}</Badge>
                    </TableCell>
                    {canManage && (
                      <TableCell>
                        {editable && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8"
                            onClick={() => setUserToEdit(u)}
                          >
                            <Pencil className="size-4" />
                            <span className="sr-only">Edit user</span>
                          </Button>
                        )}
                      </TableCell>
                    )}
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
        <PaginationFooter
          page={page}
          skip={skip}
          count={users.length}
          total={total}
          hasNextPage={hasNextPage}
          onPrev={() => setPage((p) => Math.max(0, p - 1))}
          onNext={() => setPage((p) => p + 1)}
        />
      </DataState>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New user</DialogTitle>
            <DialogDescription>
              Invite a user to your company. They'll get a link to set their
              password.
            </DialogDescription>
          </DialogHeader>
          <CreateUserForm
            teams={teams}
            onSubmit={handleCreate}
            onCancel={() => setCreateOpen(false)}
            submitting={creating}
          />
        </DialogContent>
      </Dialog>

      <Dialog
        open={userToEdit !== null}
        onOpenChange={(open) => !open && setUserToEdit(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit user</DialogTitle>
            <DialogDescription>
              Update this user's name, team and role.
            </DialogDescription>
          </DialogHeader>
          {userToEdit && (
            <EditUserForm
              user={userToEdit}
              teams={teams}
              onSubmit={handleSave}
              onCancel={() => setUserToEdit(null)}
              // Managers can delete anyone but themselves; the edit modal only
              // ever opens for that case, but guard here too for safety.
              onDelete={
                userToEdit.id !== currentUser?.id
                  ? () => setUserToDelete(userToEdit)
                  : undefined
              }
              submitting={saving}
            />
          )}
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={userToDelete !== null}
        onOpenChange={(open) => !open && setUserToDelete(null)}
        title="Delete user?"
        description={
          userToDelete
            ? `${userToDelete.full_name} will lose access immediately and be removed from your users. This can't be undone.`
            : undefined
        }
        confirmLabel="Delete"
        destructive
        loading={deleting}
        onConfirm={handleDelete}
      />
    </div>
  )
}
