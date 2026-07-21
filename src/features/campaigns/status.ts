import type { Campaign } from "@/types/campaign"

/** The dashboard/list groups a campaign into one of four buckets: whether its
 * setup wizard is finished and, once it is, its run lifecycle. */
export type CampaignGroup = "setup_incomplete" | "ready" | "running" | "completed"

type BadgeVariant = "default" | "secondary" | "outline" | "destructive"

export interface CampaignStatusMeta {
  group: CampaignGroup
  label: string
  variant: BadgeVariant
}

/** Blend the setup + run states into a single display status. An unfinished
 * setup always shows "Setup incomplete"; a finished one is Ready → Running →
 * Completed. Shared by the campaigns table and the dashboard cards so both agree. */
export function campaignStatusMeta(campaign: Campaign): CampaignStatusMeta {
  if (!campaign.setup_completed) {
    return { group: "setup_incomplete", label: "Setup incomplete", variant: "secondary" }
  }
  switch (campaign.status) {
    case "enriching_contacts":
      // Launched and finding contact emails — sits with the active campaigns.
      return { group: "running", label: "Enriching contacts", variant: "secondary" }
    case "running":
      return { group: "running", label: "Running", variant: "default" }
    case "enrichment_failed":
      // Needs the user to re-run, so it stays in the actionable "Ready" bucket.
      return { group: "ready", label: "Enrichment failed", variant: "destructive" }
    case "completed":
      return { group: "completed", label: "Completed", variant: "outline" }
    default:
      return { group: "ready", label: "Ready", variant: "outline" }
  }
}

/** The order the dashboard renders the sections in. */
export const CAMPAIGN_GROUPS: { group: CampaignGroup; title: string }[] = [
  { group: "setup_incomplete", title: "Setup incomplete" },
  { group: "ready", title: "Ready" },
  { group: "running", title: "Running" },
  { group: "completed", title: "Completed" },
]
