import { useCallback, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Plus, Rocket, Trash2 } from "lucide-react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ConfirmDialog } from "@/components/ConfirmDialog"
import { DataState } from "@/components/DataState"
import { PaginationFooter } from "@/components/PaginationFooter"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { usePaginatedList } from "@/hooks/usePaginatedList"
import { formatDateTime } from "@/lib/format"
import { CAMPAIGN_TYPES } from "@/features/outreach/campaignTypes"
import { outreachService } from "@/services/outreach.service"
import type {
  CampaignType,
  OutreachRun,
  OutreachRunStatus,
} from "@/types/outreach"

/** What each status means, in the reader's terms rather than the model's. */
const STATUS_LABELS: Record<OutreachRunStatus, string> = {
  draft: "Draft",
  composing: "Writing",
  ready: "Ready to launch",
  launched: "Launched",
  failed: "Needs attention",
}

/** Strategic or Flow, with the same icon the wizard offered it under. Runs
 * started before the choice existed have no type; they are not broken, they
 * were simply never asked. */
function TypeBadge({ type }: { type: CampaignType | null }) {
  const option = CAMPAIGN_TYPES.find((o) => o.value === type)
  if (!option) return <span className="text-muted-foreground">—</span>
  return (
    <Badge variant="outline" className="gap-1.5 font-normal">
      <option.icon className="size-3.5" aria-hidden />
      {option.label}
    </Badge>
  )
}

function StatusBadge({ status }: { status: OutreachRunStatus }) {
  if (status === "launched") return <Badge>{STATUS_LABELS[status]}</Badge>
  if (status === "failed")
    return <Badge variant="destructive">{STATUS_LABELS[status]}</Badge>
  return <Badge variant="outline">{STATUS_LABELS[status]}</Badge>
}

export function CampaignsPage() {
  const navigate = useNavigate()
  const fetchRuns = useCallback(
    (params: { skip?: number; limit?: number }) => outreachService.list(params),
    [],
  )
  const list = usePaginatedList<OutreachRun>(fetchRuns)
  const [toDelete, setToDelete] = useState<OutreachRun | null>(null)
  const [deleting, setDeleting] = useState(false)

  /** A launched run is a record; anything else reopens where it stopped. */
  function open(run: OutreachRun) {
    navigate(`/campaigns/new?resume=${run.id}`)
  }

  async function confirmDelete() {
    if (!toDelete) return
    setDeleting(true)
    try {
      await outreachService.remove(toDelete.id)
      toast.success("Run deleted.")
      list.refetch()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not delete it.")
    } finally {
      setDeleting(false)
      setToDelete(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Campaigns</h1>
          <p className="text-muted-foreground">
            Build a list, pick an angle, and let Paraden write the sequence.
          </p>
        </div>
        <Button onClick={() => navigate("/campaigns/new")}>
          <Plus className="size-4" />
          New campaign
        </Button>
      </div>

      <DataState
        loading={list.loading}
        error={list.error}
        isEmpty={list.items.length === 0}
        emptyMessage="No campaigns yet. Start one and Paraden will research each prospect and draft the outreach for you."
        emptyAction={
          <Button onClick={() => navigate("/campaigns/new")}>
            <Rocket className="size-4" />
            Start a campaign
          </Button>
        }
        onRetry={list.refetch}
      >
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Product</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Prospects</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {list.items.map((run) => (
                <TableRow
                  key={run.id}
                  className="cursor-pointer"
                  onClick={() => open(run)}
                >
                  <TableCell className="font-medium">{run.name}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {run.product_name ?? "—"}
                  </TableCell>
                  <TableCell>
                    <TypeBadge type={run.campaign_type} />
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={run.status} />
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {run.reachable_count} of {run.prospect_count} reachable
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDateTime(run.created_at)}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={`Delete ${run.name}`}
                      onClick={(e) => {
                        e.stopPropagation()
                        setToDelete(run)
                      }}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <PaginationFooter
          page={list.page}
          skip={list.skip}
          count={list.items.length}
          total={list.total}
          hasNextPage={list.hasNextPage}
          onPrev={() => list.setPage((p) => Math.max(0, p - 1))}
          onNext={() => list.setPage((p) => p + 1)}
        />
      </DataState>

      <ConfirmDialog
        open={toDelete !== null}
        onOpenChange={(open) => !open && setToDelete(null)}
        title={`Delete "${toDelete?.name}"?`}
        description={
          toDelete?.status === "launched"
            ? "This run has been launched. Deleting it removes the setup — anything already queued or sent is kept."
            : "This removes the run, its list and everything written for it."
        }
        confirmLabel={deleting ? "Deleting…" : "Delete"}
        onConfirm={() => void confirmDelete()}
      />
    </div>
  )
}
