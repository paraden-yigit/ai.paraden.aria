import { Badge } from "@/components/ui/badge"
import { CAMPAIGN_TYPES } from "./campaignTypes"
import type { CampaignType } from "@/types/outreach"

/**
 * Strategic or Flow, with the same icon the wizard offered it under.
 *
 * One copy for both views of the campaign list, next to `RunStatusBadge` for
 * the same reason. Runs started before the choice existed have no type; they
 * are not broken, they were simply never asked.
 */
export function CampaignTypeBadge({ type }: { type: CampaignType | null }) {
  const option = CAMPAIGN_TYPES.find((o) => o.value === type)
  if (!option) return <span className="text-muted-foreground">—</span>
  return (
    <Badge variant="outline" className="gap-1.5 font-normal">
      <option.icon className="size-3.5" aria-hidden />
      {option.label}
    </Badge>
  )
}
