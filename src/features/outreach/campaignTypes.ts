import { Sprout, Target, type LucideIcon } from "lucide-react"

import type { CampaignType } from "@/types/outreach"

/**
 * How a campaign runs — the outreach wizard's second step.
 *
 * Asked straight after the name and product because it decides where the list
 * comes from, which is the very next thing the wizard asks for. The type itself
 * lives with the run it is stored on; this file is what the choice looks like.
 */
export type { CampaignType }

export interface CampaignTypeOption {
  value: CampaignType
  label: string
  description: string
  icon: LucideIcon
}

export const CAMPAIGN_TYPES: CampaignTypeOption[] = [
  {
    value: "strategic",
    label: "Strategic",
    description:
      "You upload companies and contacts. Outreach runs until you pause it, and new leads are picked up as you add them.",
    icon: Target,
  },
  {
    value: "flow",
    label: "Flow",
    description:
      "You set the ideal customer profile. We build and maintain a contact pool, sending continuously in the background.",
    icon: Sprout,
  },
]
