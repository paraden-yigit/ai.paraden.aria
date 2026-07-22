import { useState } from "react"
import {
  Activity,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  CircleDashed,
  CirclePlay,
  Eye,
  Megaphone,
  MoreHorizontal,
  Trash2,
  User,
  Users,
} from "lucide-react"

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
import {
  CAMPAIGN_GROUPS,
  campaignStatusMeta,
  type CampaignGroup,
} from "@/features/campaigns/status"
import type { Campaign } from "@/types/campaign"

// Per-section chrome for the grouped (dashboard) view. Setup incomplete opens
// by default (it is the "needs your attention" pile); the rest start collapsed
// so a long campaign history never drowns the page.
const GROUP_ICONS: Record<CampaignGroup, typeof CircleDashed> = {
  setup_incomplete: CircleDashed,
  ready: CirclePlay,
  running: Activity,
  completed: CheckCircle2,
}

const GROUPS_OPEN_BY_DEFAULT: Record<CampaignGroup, boolean> = {
  setup_incomplete: true,
  ready: false,
  running: false,
  completed: false,
}

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
        <span className="min-w-0 flex-1 truncate pr-10 font-medium">
          {campaign.name}
        </span>
        {onDelete && (
          // Pinned to the top-right corner so it mirrors the thumbnail on the
          // left; the box matches the thumbnail's size-11 footprint so the two
          // sit at the same vertical level on opposite edges of the card.
          <span className="absolute right-6 top-6 z-10 flex h-11 items-center">
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
 * status sections (empty sections omitted), each collapsible, the dashboard's
 * view. */
export function CampaignCards({
  campaigns,
  onOpen,
  onDelete,
  grouped = false,
}: CampaignCardsProps) {
  // Per-section open state (grouped view only). Unconditional: hooks must not
  // sit behind the early return below.
  const [openGroups, setOpenGroups] = useState<Record<CampaignGroup, boolean>>(
    GROUPS_OPEN_BY_DEFAULT,
  )

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
    <div className="space-y-6">
      {CAMPAIGN_GROUPS.map(({ group, title }) => {
        const inGroup = campaigns.filter(
          (c) => campaignStatusMeta(c).group === group,
        )
        if (inGroup.length === 0) return null
        const open = openGroups[group]
        const Icon = GROUP_ICONS[group]
        return (
          <section key={group} className="space-y-3">
            <button
              type="button"
              onClick={() =>
                setOpenGroups((prev) => ({ ...prev, [group]: !prev[group] }))
              }
              aria-expanded={open}
              aria-controls={`campaign-group-${group}`}
              className="flex w-full items-center gap-2 rounded-md py-1 text-left text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {open ? (
                <ChevronDown className="size-4 shrink-0" aria-hidden="true" />
              ) : (
                <ChevronRight className="size-4 shrink-0" aria-hidden="true" />
              )}
              <Icon className="size-4 shrink-0" aria-hidden="true" />
              {title}
              <span className="rounded-full bg-muted px-2 py-0.5 text-xs tabular-nums">
                {inGroup.length}
              </span>
            </button>
            {open && (
              <div
                id={`campaign-group-${group}`}
                className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4"
              >
                {inGroup.map((campaign) => (
                  <CampaignCard
                    key={campaign.id}
                    campaign={campaign}
                    onOpen={onOpen}
                    onDelete={onDelete}
                  />
                ))}
              </div>
            )}
          </section>
        )
      })}
    </div>
  )
}
