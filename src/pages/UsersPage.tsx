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
import { notifyInvited, resendInvitation } from "@/lib/invite"
import { invitationService } from "@/services/invitation.service"
import { InvitationsCard } from "@/features/users/InvitationsCard"
import type { WorkspaceInvitation } from "@/types/invitation"
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

  // Invitations are a separate list because an invitee is not a member: nobody
  // is on the roster until they have said yes.
  const { data: invitations, refetch: refetchInvitations } = useAsync(
    () =>
      canManage
        ? invitationService.listForWorkspace()
        : Promise.resolve([] as WorkspaceInvitation[]),
    [canManage],
  )

  const [createOpen, setCreateOpen] = useState(false)
  const [creating, setCreating] = useState(false)
  const [userToEdit, setUserToEdit] = useState<ClientUser | null>(null)
  const [saving, setSaving] = useState(false)
  const [userToDelete, setUserToDelete] = useState<ClientUser | null>(null)
  const [deleting, setDeleting] = useState(false)
  // Id of the user whose invitation is currently being re-sent, so only that
  // row's button shows the pending state.
  const [resendingId, setResendingId] = useState<number | null>(null)

  async function handleCreate(payload: UserManageCreate) {
    setCreating(true)
    try {
      const invitation = await userService.create(payload)
      notifyInvited(invitation)
      setCreateOpen(false)
      refetchInvitations()
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.message : "Failed to send the invitation.",
      )
    } finally {
      setCreating(false)
    }
  }

  async function handleResendInvite(invitation: WorkspaceInvitation) {
    setResendingId(invitation.id)
    try {
      // Refetch either way: on success the old row is carrying a dead token, and
      // on failure the person may have answered in the meantime, which the fresh
      // list will show.
      await resendInvitation(invitation)
      refetchInvitations()
    } finally {
      setResendingId(null)
    }
  }

  async function handleRevokeInvite(invitation: WorkspaceInvitation) {
    try {
      await invitationService.revoke(invitation.id)
      toast.success(`Invitation to ${invitation.email} withdrawn.`)
      refetchInvitations()
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.message : "Failed to withdraw the invitation.",
      )
    }
  }

  async function handleSave(payload: UserManageUpdate) {
    if (!userToEdit) return
    setSaving(true)
    try {
      await userService.update(userToEdit.id, payload)
      const renamed = [payload.first_name, payload.last_name]
        .filter(Boolean)
        .join(" ")
      toast.success(`${renamed || userToEdit.display_name} updated.`)
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
      toast.success(`${userToDelete.display_name} removed from this workspace.`)
      setUserToDelete(null)
      // Close the edit modal too — it was opened for the now-deleted user.
      setUserToEdit(null)
      refetch()
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to remove user.")
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
            Invite User
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
                <TableHead className="w-40">Role</TableHead>
                {canManage && <TableHead className="w-56" />}
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((u) => {
                // Managers edit everyone except themselves (guards against
                // accidentally demoting the last owner / self-lockout).
                const editable = canManage && u.id !== currentUser?.id
                const displayName = u.display_name
                // A pending user's display name is their email address, which
                // makes a poor pair of initials — take one letter from it.
                const initials =
                  [u.first_name, u.last_name]
                    .filter(Boolean)
                    .map((part) => part![0]!.toUpperCase())
                    .join("") || displayName[0]?.toUpperCase()
                return (
                  <TableRow key={u.id}>
                    <TableCell>
                      <span className="flex items-center gap-3">
                        <span
                          aria-hidden="true"
                          className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary"
                        >
                          {initials || "?"}
                        </span>
                        <span className="font-medium">{displayName}</span>
                      </span>
                    </TableCell>
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
                        <span className="text-muted-foreground">None</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{roleLabel(u.role)}</Badge>
                    </TableCell>
                    {canManage && (
                      <TableCell>
                        <span className="flex items-center justify-end gap-1">
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
                        </span>
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

      {canManage && (
        <InvitationsCard
          invitations={invitations ?? []}
          resendingId={resendingId}
          onResend={handleResendInvite}
          onRevoke={handleRevokeInvite}
        />
      )}

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite User</DialogTitle>
            <DialogDescription>
              They'll get an email with a link to set their name and password.
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
        title="Remove from workspace?"
        description={
          userToDelete
            ? `${userToDelete.display_name} will lose access to this workspace immediately. Their account and any other workspaces they belong to are unaffected, and you can invite them back.`
            : undefined
        }
        confirmLabel="Remove"
        destructive
        loading={deleting}
        onConfirm={handleDelete}
      />
    </div>
  )
}
