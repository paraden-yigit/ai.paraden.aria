import { Eye, Megaphone, MoreHorizontal, Trash2, User, Users } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { formatDateTime } from "@/lib/format"
import { CAMPAIGN_GROUPS, campaignStatusMeta } from "@/features/campaigns/status"
import type { Campaign } from "@/types/campaign"

interface CampaignCardsProps {
  campaigns: Campaign[]
  /** Opening a completed campaign goes to its detail; an incomplete one prompts
   * to resume or restart — the page decides. */
  onOpen: (campaign: Campaign) => void
  /** When given, each card carries an actions menu with a Delete item. */
  onDelete?: (campaign: Campaign) => void
  /** Split the cards into the four status sections (the dashboard view);
   * omit for the flat, paginated grid on the campaigns page. */
  grouped?: boolean
}

/** One campaign as a card: monogram, name, status, product, team and creator.
 * The whole card opens the campaign; actions sit above the stretched button. */
function CampaignCard({
  campaign,
  onOpen,
  onDelete,
}: {
  campaign: Campaign
  onOpen: (campaign: Campaign) => void
  onDelete?: (campaign: Campaign) => void
}) {
  const status = campaignStatusMeta(campaign)
  return (
    <Card className="group relative gap-4 transition-all hover:border-primary/40 hover:shadow-md">
      <button
        type="button"
        onClick={() => onOpen(campaign)}
        className="absolute inset-0 rounded-xl"
        aria-label={`Open ${campaign.name}`}
      />
      <CardHeader className="flex-row items-center gap-3 space-y-0">
        <span
          aria-hidden="true"
          className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary"
        >
          <Megaphone className="size-5" />
        </span>
        <span className="min-w-0 flex-1 truncate font-medium">
          {campaign.name}
        </span>
        {onDelete && (
          <span className="relative z-10">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="size-8">
                  <MoreHorizontal className="size-4" />
                  <span className="sr-only">Open actions</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onOpen(campaign)}>
                  <Eye className="size-4" />
                  View
                </DropdownMenuItem>
                <DropdownMenuItem
                  variant="destructive"
                  onClick={() => onDelete(campaign)}
                >
                  <Trash2 className="size-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </span>
        )}
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-3">
        <p className="min-h-5 truncate text-sm text-muted-foreground">
          {campaign.product_name
            ? `For ${campaign.product_name}`
            : "No product linked"}
        </p>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
          <span className="flex min-w-0 items-center gap-1.5">
            <Users className="size-3.5 shrink-0" aria-hidden="true" />
            <span className="truncate">{campaign.team_name ?? "No team"}</span>
          </span>
          <span className="flex min-w-0 items-center gap-1.5">
            <User className="size-3.5 shrink-0" aria-hidden="true" />
            <span className="truncate">
              {campaign.created_by_name ?? "Unknown"}
            </span>
          </span>
        </div>
        <div className="mt-auto flex items-center justify-between gap-2">
          <Badge variant={status.variant}>{status.label}</Badge>
          <span className="text-xs text-muted-foreground">
            {formatDateTime(campaign.created_at)}
          </span>
        </div>
      </CardContent>
    </Card>
  )
}

/** Campaigns as a card grid. With `grouped`, the grid splits into the four
 * status sections (empty sections omitted), the dashboard's view. */
export function CampaignCards({
  campaigns,
  onOpen,
  onDelete,
  grouped = false,
}: CampaignCardsProps) {
  if (!grouped) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
        {campaigns.map((campaign) => (
          <CampaignCard
            key={campaign.id}
            campaign={campaign}
            onOpen={onOpen}
            onDelete={onDelete}
          />
        ))}
      </div>
    )
  }

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
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
              {inGroup.map((campaign) => (
                <CampaignCard
                  key={campaign.id}
                  campaign={campaign}
                  onOpen={onOpen}
                  onDelete={onDelete}
                />
              ))}
            </div>
          </section>
        )
      })}
    </div>
  )
}
