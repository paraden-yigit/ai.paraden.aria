import { useOutletContext } from "react-router-dom"

import type { Campaign } from "@/types/campaign"

/** Shared by the campaign sub-pages (dashboard, info, questions) via the
 * CampaignLayout outlet — the loaded campaign plus a refetch to refresh it
 * after a save. */
export interface CampaignContext {
  campaign: Campaign
  refetch: () => void
}

export function useCampaignContext(): CampaignContext {
  return useOutletContext<CampaignContext>()
}
