import { useCallback, useState } from "react"
import { Link, useParams } from "react-router-dom"
import { ArrowLeft, Loader2, Plus, Trash2 } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
import { ConfirmDialog } from "@/components/ConfirmDialog"
import { DataState } from "@/components/DataState"
import { useAsync } from "@/hooks/useAsync"
import { teamService } from "@/services/team.service"
import { ApiError } from "@/services/http"
import type { User } from "@/types/auth"

export function TeamDetailPage() {
  const { id } = useParams<{ id: string }>()
  const teamId = Number(id)

  const loadTeam = useCallback(() => teamService.get(teamId), [teamId])
  const { data: team, loading, error, refetch: refetchTeam } = useAsync(loadTeam, [
    teamId,
  ])

  const loadMembers = useCallback(() => teamService.listMembers(teamId), [teamId])
  const {
    data: members,
    loading: membersLoading,
    error: membersError,
    refetch: refetchMembers,
  } = useAsync(loadMembers, [teamId])

  const loadAvailable = useCallback(
    () => teamService.listAvailableUsers(teamId),
    [teamId],
  )
  const { data: available, refetch: refetchAvailable } = useAsync(loadAvailable, [
    teamId,
  ])

  const [selectedUserId, setSelectedUserId] = useState("")
  const [adding, setAdding] = useState(false)
  const [removingId, setRemovingId] = useState<number | null>(null)

  const availableUsers = available ?? []

  async function handleAdd() {
    if (!selectedUserId) return
    setAdding(true)
    try {
      await teamService.addMember(teamId, Number(selectedUserId))
      toast.success("Member added.")
      setSelectedUserId("")
      refetchMembers()
      refetchAvailable()
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to add member.")
    } finally {
      setAdding(false)
    }
  }

  // Removal confirms first, like every other destructive action in the app.
  const [pendingRemoval, setPendingRemoval] = useState<User | null>(null)

  async function handleRemove(member: User) {
    setRemovingId(member.id)
    try {
      await teamService.removeMember(teamId, member.id)
      toast.success(`${member.display_name} removed from the team.`)
      refetchMembers()
      refetchAvailable()
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to remove member.")
    } finally {
      setRemovingId(null)
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <Button variant="ghost" size="sm" asChild className="-ml-2">
        <Link to="/workspace/teams">
          <ArrowLeft className="size-4" />
          Back to teams
        </Link>
      </Button>

      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          {team?.name ?? "Team"}
        </h1>
        <p className="text-muted-foreground">Manage who belongs to this team.</p>
      </div>

      <DataState
        loading={loading}
        error={error}
        isEmpty={!team}
        emptyMessage="Team not found."
        onRetry={refetchTeam}
        skeletonRows={4}
      >
        {team && (
          <Card>
            <CardHeader>
              <CardTitle>Members</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <Select
                  value={selectedUserId}
                  onValueChange={setSelectedUserId}
                  disabled={adding || availableUsers.length === 0}
                >
                  <SelectTrigger className="w-full max-w-xs">
                    <SelectValue
                      placeholder={
                        availableUsers.length === 0
                          ? "No users available to add"
                          : "Select a user…"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {availableUsers.map((u) => (
                      <SelectItem key={u.id} value={String(u.id)}>
                        {u.display_name} ({u.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button onClick={handleAdd} disabled={!selectedUserId || adding}>
                  {adding ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Plus className="size-4" />
                  )}
                  Add member
                </Button>
              </div>

              <DataState
                loading={membersLoading}
                error={membersError}
                isEmpty={(members ?? []).length === 0}
                emptyMessage="No members yet. Add one above."
                onRetry={refetchMembers}
                skeletonRows={3}
              >
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead className="w-12" />
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(members ?? []).map((member) => (
                        <TableRow key={member.id}>
                          <TableCell className="font-medium">
                            {member.display_name}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {member.email}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-8"
                              disabled={removingId === member.id}
                              onClick={() => setPendingRemoval(member)}
                            >
                              {removingId === member.id ? (
                                <Loader2 className="size-4 animate-spin" />
                              ) : (
                                <Trash2 className="size-4" />
                              )}
                              <span className="sr-only">Remove member</span>
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </DataState>
            </CardContent>
          </Card>
        )}
      </DataState>

      <ConfirmDialog
        open={pendingRemoval != null}
        onOpenChange={(open) => {
          if (!open) setPendingRemoval(null)
        }}
        title="Remove from this team?"
        description={
          pendingRemoval
            ? `${pendingRemoval.display_name} will be removed from this team. Their account and their work are not affected, and you can add them back at any time.`
            : ""
        }
        confirmLabel="Remove"
        destructive
        loading={removingId != null}
        onConfirm={async () => {
          if (!pendingRemoval) return
          await handleRemove(pendingRemoval)
          setPendingRemoval(null)
        }}
      />
    </div>
  )
}
