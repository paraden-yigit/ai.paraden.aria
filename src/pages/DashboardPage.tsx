import { useCallback } from "react"
import { useNavigate } from "react-router-dom"
import { Plus } from "lucide-react"

import { Button } from "@/components/ui/button"
import { DataState } from "@/components/DataState"
import { CampaignCards } from "@/features/campaigns/CampaignCards"
import { useAuth } from "@/features/auth/useAuth"
import { useAsync } from "@/hooks/useAsync"
import { campaignService } from "@/services/campaign.service"
import type { Campaign } from "@/types/campaign"

export function DashboardPage() {
  const { user } = useAuth()
  const navigate = useNavigate()

  // The API scopes this to the caller's role: an owner sees the whole client, a
  // team leader their team's campaigns, a sales person only their own. Pull a
  // generous page so every campaign lands in its section.
  const fetcher = useCallback(() => campaignService.list({ limit: 200 }), [])
  const { data, loading, error, refetch } = useAsync(fetcher, [])
  const campaigns = data?.items ?? []

  function handleOpen(campaign: Campaign) {
    // A finished campaign opens its dashboard; an unfinished one resumes setup.
    if (campaign.setup_completed) {
      navigate(`/campaigns/${campaign.id}`)
    } else {
      navigate(`/campaigns/new?resume=${campaign.id}&mode=continue`)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Welcome{user?.full_name ? `, ${user.full_name}` : ""}.
          </h1>
          <p className="text-muted-foreground">Your campaigns at a glance.</p>
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
        <CampaignCards campaigns={campaigns} onOpen={handleOpen} />
      </DataState>
    </div>
  )
}
