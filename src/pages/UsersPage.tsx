import { useCallback, useState } from "react"
import { toast } from "sonner"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { DataState } from "@/components/DataState"
import { PaginationFooter } from "@/components/PaginationFooter"
import { usePaginatedList } from "@/hooks/usePaginatedList"
import { userService } from "@/services/user.service"
import { ApiError } from "@/services/http"
import { useAuth } from "@/features/auth/useAuth"
import { USER_ROLES, roleLabel, type UserRole } from "@/lib/roles"
import type { User } from "@/types/auth"

export function UsersPage() {
  const { user: currentUser } = useAuth()
  const isOwner = currentUser?.role === "owner"

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
  } = usePaginatedList<User>(fetchUsers)

  const [savingId, setSavingId] = useState<number | null>(null)

  async function handleRoleChange(target: User, role: UserRole) {
    if (role === target.role) return
    setSavingId(target.id)
    try {
      await userService.setRole(target.id, role)
      toast.success(`${target.full_name} is now ${roleLabel(role)}.`)
      refetch()
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to update role.")
    } finally {
      setSavingId(null)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Users</h1>
        <p className="text-muted-foreground">
          {isOwner
            ? "Manage your team's roles."
            : "Your team and their roles. Only an owner can change roles."}
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
                <TableHead>Status</TableHead>
                <TableHead className="w-48">Role</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((u) => {
                // Owners edit everyone except themselves (guards against
                // accidentally demoting the last owner / self-lockout).
                const editable = isOwner && u.id !== currentUser?.id
                return (
                  <TableRow key={u.id}>
                    <TableCell className="font-medium">{u.full_name}</TableCell>
                    <TableCell className="text-muted-foreground">{u.email}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{u.status}</Badge>
                    </TableCell>
                    <TableCell>
                      {editable ? (
                        <Select
                          value={u.role}
                          onValueChange={(value) =>
                            handleRoleChange(u, value as UserRole)
                          }
                          disabled={savingId === u.id}
                        >
                          <SelectTrigger className="w-40">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {USER_ROLES.map((role) => (
                              <SelectItem key={role} value={role}>
                                {roleLabel(role)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <Badge variant="outline">{roleLabel(u.role)}</Badge>
                      )}
                    </TableCell>
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
    </div>
  )
}
