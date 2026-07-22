import { useCallback, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Plus } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { DataState } from "@/components/DataState"
import { PaginationFooter } from "@/components/PaginationFooter"
import { ConfirmDialog } from "@/components/ConfirmDialog"
import { CampaignCards } from "@/features/campaigns/CampaignCards"
import { ResumeCampaignDialog } from "@/features/campaigns/ResumeCampaignDialog"
import { useResumeCampaign } from "@/features/campaigns/useResumeCampaign"
import { CampaignSpotlight } from "@/features/dashboard/CampaignSpotlight"
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
  const resume = useResumeCampaign()

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
        emptyMessage="No campaigns yet. When you start one, ARIA finds matching prospects and drafts the outreach for you."
        emptyAction={
          <Button onClick={() => navigate("/campaigns/new")}>
            <Plus className="size-4" />
            Start your first campaign
          </Button>
        }
        onRetry={refetch}
      >
        {page === 0 && <CampaignSpotlight />}
        <CampaignCards
          campaigns={campaigns}
          onOpen={resume.open}
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

      <ResumeCampaignDialog
        campaign={resume.incomplete}
        resetting={resume.resetting}
        onClose={resume.close}
        onContinue={resume.continueSetup}
        onStartOver={resume.startOver}
      />

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
