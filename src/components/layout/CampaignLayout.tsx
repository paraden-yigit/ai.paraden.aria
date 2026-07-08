import { useCallback } from "react"
import { Link, NavLink, Outlet, useParams } from "react-router-dom"
import { ArrowLeft } from "lucide-react"

import { Button } from "@/components/ui/button"
import { DataState } from "@/components/DataState"
import { useAsync } from "@/hooks/useAsync"
import { campaignService } from "@/services/campaign.service"
import { cn } from "@/lib/utils"
import type { CampaignContext } from "@/features/campaigns/useCampaignContext"

// Sub-navigation for a single campaign. `to: ""` is the index (dashboard); the
// rest are relative to /campaigns/:id.
const TABS: { to: string; label: string; end?: boolean }[] = [
  { to: "", label: "Dashboard", end: true },
  { to: "contacts", label: "Contacts" },
]

/** Shell for a single campaign: back link, title, tab nav, and the active
 * sub-page. Loads the campaign once and shares it with sub-pages via the
 * outlet context so a save in one tab refreshes the title too. */
export function CampaignLayout() {
  const { id } = useParams<{ id: string }>()
  const campaignId = Number(id)

  const fetcher = useCallback(() => campaignService.get(campaignId), [campaignId])
  const { data: campaign, loading, error, refetch } = useAsync(fetcher, [campaignId])

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" asChild className="-ml-2">
        <Link to="/campaigns">
          <ArrowLeft className="size-4" />
          Back to campaigns
        </Link>
      </Button>

      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          {campaign?.name ?? "Campaign"}
        </h1>
      </div>

      <nav className="flex gap-1 border-b">
        {TABS.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            end={tab.end}
            className={({ isActive }) =>
              cn(
                "-mb-px border-b-2 px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "border-primary text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground",
              )
            }
          >
            {tab.label}
          </NavLink>
        ))}
      </nav>

      <DataState
        loading={loading}
        error={error}
        isEmpty={!campaign}
        emptyMessage="Campaign not found."
        onRetry={refetch}
        skeletonRows={6}
      >
        {campaign && (
          <Outlet context={{ campaign, refetch } satisfies CampaignContext} />
        )}
      </DataState>
    </div>
  )
}
