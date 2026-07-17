import { useCallback } from "react"
import { Link, useNavigate } from "react-router-dom"
import { Briefcase, Megaphone, Package, Plus } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { DataState } from "@/components/DataState"
import { CampaignCards } from "@/features/campaigns/CampaignCards"
import { CampaignSpotlight } from "@/features/dashboard/CampaignSpotlight"
import { KnowledgeMeter } from "@/features/dashboard/KnowledgeMeter"
import { PerformanceStrip } from "@/features/dashboard/PerformanceStrip"
import { SampleCharts } from "@/features/dashboard/SampleCharts"
import { SetupChecklist } from "@/features/onboarding/SetupChecklist"
import { useSetupState } from "@/features/onboarding/useSetupState"
import { useAuth } from "@/features/auth/useAuth"
import { useAsync } from "@/hooks/useAsync"
import { campaignService } from "@/services/campaign.service"
import type { Campaign } from "@/types/campaign"

function AccountCard() {
  const { user } = useAuth()
  return (
    <Card className="h-fit">
      <CardHeader>
        <CardTitle>Your account</CardTitle>
        <CardDescription>Session active</CardDescription>
      </CardHeader>
      <CardContent className="space-y-1 text-sm text-muted-foreground">
        <div>{user?.email}</div>
        {user?.client_id != null && <div>Client #{user.client_id}</div>}
      </CardContent>
    </Card>
  )
}

function QuickActionsCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick actions</CardTitle>
        <CardDescription>
          Jump back into the things you use most.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-2">
        <Button asChild>
          <Link to="/campaigns/new">
            <Plus className="size-4" />
            New campaign
          </Link>
        </Button>
        <Button variant="outline" asChild>
          <Link to="/campaigns">
            <Megaphone className="size-4" />
            Campaigns
          </Link>
        </Button>
        <Button variant="outline" asChild>
          <Link to="/products">
            <Package className="size-4" />
            Products
          </Link>
        </Button>
        <Button variant="outline" asChild>
          <Link to="/company">
            <Briefcase className="size-4" />
            Company info
          </Link>
        </Button>
      </CardContent>
    </Card>
  )
}

export function DashboardPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const setup = useSetupState()

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
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Welcome{user?.full_name ? `, ${user.full_name}` : ""}.
        </h1>
        <p className="text-muted-foreground">
          {setup.loading
            ? "You're signed in to Paraden ARIA."
            : setup.allDone
              ? "Here's where your outreach stands."
              : "Let's get ARIA working for you."}
        </p>
      </div>

      {setup.allDone ? (
        <div className="grid gap-6 xl:grid-cols-3">
          <div className="space-y-6 xl:col-span-2">
            {/* The results band leads (funnel totals, then the two trend
                charts), followed by the actionable spotlight, then the
                campaign sections. */}
            <PerformanceStrip campaigns={campaigns} />
            <SampleCharts />
            <CampaignSpotlight />
            <DataState
              loading={loading}
              error={error}
              isEmpty={campaigns.length === 0}
              emptyMessage="No campaigns in your view yet. When you start one, ARIA finds matching prospects and drafts the outreach for you."
              emptyAction={
                <Button onClick={() => navigate("/campaigns/new")}>
                  <Plus className="size-4" />
                  Start a campaign
                </Button>
              }
              onRetry={refetch}
            >
              <CampaignCards campaigns={campaigns} onOpen={handleOpen} grouped />
            </DataState>
          </div>
          <div className="space-y-6">
            <QuickActionsCard />
            <KnowledgeMeter setup={setup} />
            <AccountCard />
          </div>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <SetupChecklist state={setup} />
          </div>
          <AccountCard />
        </div>
      )}
    </div>
  )
}
