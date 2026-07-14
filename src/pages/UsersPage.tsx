import { useCallback, useState } from "react"
import { Pencil } from "lucide-react"
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
import { PaginationFooter } from "@/components/PaginationFooter"
import { EditUserForm } from "@/features/users/EditUserForm"
import { usePaginatedList } from "@/hooks/usePaginatedList"
import { useAsync } from "@/hooks/useAsync"
import { userService } from "@/services/user.service"
import { teamService } from "@/services/team.service"
import { ApiError } from "@/services/http"
import { useAuth } from "@/features/auth/useAuth"
import { roleLabel } from "@/lib/roles"
import { PERMISSIONS } from "@/lib/permissions"
import type { ClientUser, UserManageUpdate } from "@/types/user"

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

  const [userToEdit, setUserToEdit] = useState<ClientUser | null>(null)
  const [saving, setSaving] = useState(false)

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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Users</h1>
        <p className="text-muted-foreground">
          {canManage
            ? "Manage your users' names, teams and roles."
            : "Your team and their roles."}
        </p>
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
              submitting={saving}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
