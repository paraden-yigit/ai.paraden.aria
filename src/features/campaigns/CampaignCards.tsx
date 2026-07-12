import { Eye, Megaphone, MoreHorizontal, Trash2 } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { formatDateTime } from "@/lib/format"
import type { Campaign } from "@/types/campaign"

interface CampaignCardsProps {
  campaigns: Campaign[]
  /** Opening a completed campaign goes to its detail; an incomplete one prompts
   * to resume or restart — the page decides. */
  onOpen: (campaign: Campaign) => void
  onDelete: (campaign: Campaign) => void
}

/** Campaigns as a card grid: status, product, sequence and dates at a glance.
 * The whole card opens the campaign; actions sit above the stretched button. */
export function CampaignCards({ campaigns, onOpen, onDelete }: CampaignCardsProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
      {campaigns.map((campaign) => (
        <Card
          key={campaign.id}
          className="group relative gap-4 transition-all hover:border-primary/40 hover:shadow-md"
        >
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
          </CardHeader>
          <CardContent className="flex flex-1 flex-col gap-4">
            <p className="min-h-5 truncate text-sm text-muted-foreground">
              {campaign.product_name
                ? `For ${campaign.product_name}`
                : "No product linked"}
            </p>
            <div className="mt-auto flex items-center justify-between gap-2">
              {campaign.setup_completed ? (
                <Badge variant="outline">Ready</Badge>
              ) : (
                <Badge variant="secondary">Setup incomplete</Badge>
              )}
              <span className="text-xs text-muted-foreground">
                {formatDateTime(campaign.created_at)}
              </span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
