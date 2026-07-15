import { Package, User, Users } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { Campaign } from "@/types/campaign"
import { CAMPAIGN_GROUPS, campaignStatusMeta } from "@/features/campaigns/status"

/** One campaign as a card: name + status badge, then the product, team, and
 * creating user. Clicking it opens the campaign (the parent decides where). */
function CampaignCard({
  campaign,
  onOpen,
}: {
  campaign: Campaign
  onOpen: (campaign: Campaign) => void
}) {
  const status = campaignStatusMeta(campaign)
  return (
    <Card
      role="button"
      tabIndex={0}
      onClick={() => onOpen(campaign)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault()
          onOpen(campaign)
        }
      }}
      className="cursor-pointer transition-colors hover:bg-accent/40"
    >
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-base leading-tight">{campaign.name}</CardTitle>
          <Badge variant={status.variant} className="shrink-0">
            {status.label}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-1.5 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <Package className="size-4 shrink-0" />
          <span className="truncate">{campaign.product_name ?? "No product"}</span>
        </div>
        <div className="flex items-center gap-2">
          <Users className="size-4 shrink-0" />
          <span className="truncate">{campaign.team_name ?? "No team"}</span>
        </div>
        <div className="flex items-center gap-2">
          <User className="size-4 shrink-0" />
          <span className="truncate">{campaign.created_by_name ?? "Unknown"}</span>
        </div>
      </CardContent>
    </Card>
  )
}

/** All campaigns as cards, split into the four status sections. Empty sections
 * are omitted. */
export function CampaignCards({
  campaigns,
  onOpen,
}: {
  campaigns: Campaign[]
  onOpen: (campaign: Campaign) => void
}) {
  return (
    <div className="space-y-8">
      {CAMPAIGN_GROUPS.map(({ group, title }) => {
        const inGroup = campaigns.filter(
          (c) => campaignStatusMeta(c).group === group,
        )
        if (inGroup.length === 0) return null
        return (
          <section key={group} className="space-y-3">
            <h2 className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              {title}
              <span className="rounded-full bg-muted px-2 py-0.5 text-xs tabular-nums">
                {inGroup.length}
              </span>
            </h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {inGroup.map((campaign) => (
                <CampaignCard
                  key={campaign.id}
                  campaign={campaign}
                  onOpen={onOpen}
                />
              ))}
            </div>
          </section>
        )
      })}
    </div>
  )
}
