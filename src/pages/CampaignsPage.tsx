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
import { CampaignsTable } from "@/features/campaigns/CampaignsTable"
import { CampaignForm } from "@/features/campaigns/CampaignForm"
import { usePaginatedList } from "@/hooks/usePaginatedList"
import { campaignService } from "@/services/campaign.service"
import { ApiError } from "@/services/http"
import type { Campaign, CampaignCreate } from "@/types/campaign"

export function CampaignsPage() {
  const fetchCampaigns = useCallback(
    (params: { skip?: number; limit?: number }) => campaignService.list(params),
    [],
  )

  const {
    items: campaigns,
    total,
    page,
    setPage,
    skip,
    hasNextPage,
    loading,
    error,
    refetch,
  } = usePaginatedList<Campaign>(fetchCampaigns)

  const [createOpen, setCreateOpen] = useState(false)
  const [creating, setCreating] = useState(false)
  const [campaignToDelete, setCampaignToDelete] = useState<Campaign | null>(null)
  const [deleting, setDeleting] = useState(false)

  async function handleCreate(payload: CampaignCreate) {
    setCreating(true)
    try {
      await campaignService.create(payload)
      toast.success(`Campaign "${payload.name}" created.`)
      setCreateOpen(false)
      refetch()
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to create campaign.")
    } finally {
      setCreating(false)
    }
  }

  async function handleDelete() {
    if (!campaignToDelete) return
    setDeleting(true)
    try {
      await campaignService.remove(campaignToDelete.id)
      toast.success(`Campaign "${campaignToDelete.name}" deleted.`)
      setCampaignToDelete(null)
      refetch()
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to delete campaign.")
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Campaigns</h1>
          <p className="text-muted-foreground">Manage your campaigns.</p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="size-4" />
          New campaign
        </Button>
      </div>

      <DataState
        loading={loading}
        error={error}
        isEmpty={campaigns.length === 0}
        emptyMessage="No campaigns yet."
        onRetry={refetch}
      >
        <CampaignsTable campaigns={campaigns} onDelete={setCampaignToDelete} />
        <PaginationFooter
          page={page}
          skip={skip}
          count={campaigns.length}
          total={total}
          hasNextPage={hasNextPage}
          onPrev={() => setPage((p) => Math.max(0, p - 1))}
          onNext={() => setPage((p) => p + 1)}
        />
      </DataState>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New campaign</DialogTitle>
            <DialogDescription>Add a campaign to your list.</DialogDescription>
          </DialogHeader>
          <CampaignForm
            onSubmit={handleCreate}
            onCancel={() => setCreateOpen(false)}
            submitting={creating}
            submitLabel="Create campaign"
          />
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={campaignToDelete !== null}
        onOpenChange={(open) => !open && setCampaignToDelete(null)}
        title="Delete campaign?"
        description={
          campaignToDelete
            ? `This will permanently delete "${campaignToDelete.name}". This action cannot be undone.`
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
