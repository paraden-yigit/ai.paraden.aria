import { useCallback, useState } from "react"
import { Plus } from "lucide-react"
import { toast } from "sonner"

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
import { ConfirmDialog } from "@/components/ConfirmDialog"
import { TeamsTable } from "@/features/teams/TeamsTable"
import { TeamForm } from "@/features/teams/TeamForm"
import { usePaginatedList } from "@/hooks/usePaginatedList"
import { teamService } from "@/services/team.service"
import { ApiError } from "@/services/http"
import type { Team, TeamCreate } from "@/types/team"

export function TeamsPage() {
  const fetchTeams = useCallback(
    (params: { skip?: number; limit?: number }) => teamService.list(params),
    [],
  )

  const {
    items: teams,
    total,
    page,
    setPage,
    skip,
    hasNextPage,
    loading,
    error,
    refetch,
  } = usePaginatedList<Team>(fetchTeams)

  const [createOpen, setCreateOpen] = useState(false)
  const [creating, setCreating] = useState(false)
  const [teamToEdit, setTeamToEdit] = useState<Team | null>(null)
  const [saving, setSaving] = useState(false)
  const [teamToDelete, setTeamToDelete] = useState<Team | null>(null)
  const [deleting, setDeleting] = useState(false)

  async function handleCreate(payload: TeamCreate) {
    setCreating(true)
    try {
      await teamService.create(payload)
      toast.success(`Team "${payload.name}" created.`)
      setCreateOpen(false)
      refetch()
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to create team.")
    } finally {
      setCreating(false)
    }
  }

  async function handleUpdate(payload: TeamCreate) {
    if (!teamToEdit) return
    setSaving(true)
    try {
      await teamService.update(teamToEdit.id, payload)
      toast.success(`Team "${payload.name}" updated.`)
      setTeamToEdit(null)
      refetch()
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to update team.")
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!teamToDelete) return
    setDeleting(true)
    try {
      await teamService.remove(teamToDelete.id)
      toast.success(`Team "${teamToDelete.name}" deleted.`)
      setTeamToDelete(null)
      refetch()
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to delete team.")
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Teams</h1>
          <p className="text-muted-foreground">Manage your company's teams.</p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="size-4" />
          New team
        </Button>
      </div>

      <DataState
        loading={loading}
        error={error}
        isEmpty={teams.length === 0}
        emptyMessage="No teams yet."
        onRetry={refetch}
      >
        <TeamsTable teams={teams} onEdit={setTeamToEdit} onDelete={setTeamToDelete} />
        <PaginationFooter
          page={page}
          skip={skip}
          count={teams.length}
          total={total}
          hasNextPage={hasNextPage}
          onPrev={() => setPage((p) => Math.max(0, p - 1))}
          onNext={() => setPage((p) => p + 1)}
        />
      </DataState>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New team</DialogTitle>
            <DialogDescription>Add a team to your company.</DialogDescription>
          </DialogHeader>
          <TeamForm
            onSubmit={handleCreate}
            onCancel={() => setCreateOpen(false)}
            submitting={creating}
            submitLabel="Create team"
          />
        </DialogContent>
      </Dialog>

      <Dialog
        open={teamToEdit !== null}
        onOpenChange={(open) => !open && setTeamToEdit(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit team</DialogTitle>
            <DialogDescription>Update this team's details.</DialogDescription>
          </DialogHeader>
          {teamToEdit && (
            <TeamForm
              team={teamToEdit}
              onSubmit={handleUpdate}
              onCancel={() => setTeamToEdit(null)}
              submitting={saving}
              submitLabel="Save changes"
            />
          )}
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={teamToDelete !== null}
        onOpenChange={(open) => !open && setTeamToDelete(null)}
        title="Delete team?"
        description={
          teamToDelete
            ? `This will permanently delete "${teamToDelete.name}". This action cannot be undone.`
            : ""
        }
        confirmLabel="Delete"
        destructive
        loading={deleting}
        onConfirm={handleDelete}
      />
    </div>
  )
}
