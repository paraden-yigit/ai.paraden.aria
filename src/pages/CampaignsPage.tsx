import { useCallback, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Loader2, Plus } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { DataState } from "@/components/DataState"
import { PaginationFooter } from "@/components/PaginationFooter"
import { ConfirmDialog } from "@/components/ConfirmDialog"
import { CampaignsTable } from "@/features/campaigns/CampaignsTable"
import { usePaginatedList } from "@/hooks/usePaginatedList"
import { campaignService } from "@/services/campaign.service"
import { ApiError } from "@/services/http"
import type { Campaign } from "@/types/campaign"

export function CampaignsPage() {
  const navigate = useNavigate()

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

  const [campaignToDelete, setCampaignToDelete] = useState<Campaign | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [incomplete, setIncomplete] = useState<Campaign | null>(null)
  const [resetting, setResetting] = useState(false)

  function handleOpen(campaign: Campaign) {
    if (campaign.setup_completed) {
      navigate(`/campaigns/${campaign.id}`)
    } else {
      setIncomplete(campaign)
    }
  }

  function handleContinue() {
    if (!incomplete) return
    navigate(`/campaigns/new?resume=${incomplete.id}&mode=continue`)
  }

  async function handleStartOver() {
    if (!incomplete) return
    setResetting(true)
    try {
      await campaignService.reset(incomplete.id)
      navigate(`/campaigns/new?resume=${incomplete.id}&mode=restart`)
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to reset the campaign.")
      setResetting(false)
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
        <Button onClick={() => navigate("/campaigns/new")}>
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
        <CampaignsTable
          campaigns={campaigns}
          onOpen={handleOpen}
          onDelete={setCampaignToDelete}
        />
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

      <Dialog
        open={incomplete !== null}
        onOpenChange={(open) => {
          if (!open && !resetting) setIncomplete(null)
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Finish setting up this campaign?</DialogTitle>
            <DialogDescription>
              You left the setup for “{incomplete?.name}” incomplete. Continue
              where you left off, or start over from the contact-upload step —
              starting over clears any uploaded and discovered contacts but keeps
              the campaign name and product.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:justify-between">
            <Button variant="outline" onClick={handleStartOver} disabled={resetting}>
              {resetting && <Loader2 className="size-4 animate-spin" />}
              Start over
            </Button>
            <Button onClick={handleContinue} disabled={resetting}>
              Continue setup
            </Button>
          </DialogFooter>
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
