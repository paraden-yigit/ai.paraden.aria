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
 * setup always shows "Setup incomplete"; a finished one runs Ready → Preparing →
 * Ready to send → Running → Completed. The two "ready" states sit in the same
 * bucket because both are waiting on the user to press something. Shared by the
 * campaigns table and the dashboard cards so both agree. */
export function campaignStatusMeta(campaign: Campaign): CampaignStatusMeta {
  if (!campaign.setup_completed) {
    return { group: "setup_incomplete", label: "Setup incomplete", variant: "secondary" }
  }
  switch (campaign.status) {
    case "preparing":
      // Run pressed: finding contact emails, then composing each sequence.
      // Grouped with the active campaigns, though it isn't sending anything.
      return { group: "running", label: "Preparing", variant: "secondary" }
    case "ready_to_send":
      // Prepared and waiting on the user to approve it, so it belongs with the
      // campaigns that need an action rather than the ones already working.
      return { group: "ready", label: "Ready to send", variant: "default" }
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

/**
 * Whether preparation is still in flight — contacts being enriched, then their
 * emails composed. Background work with no other trigger to refresh the page, so
 * callers poll while this is true and stop when it goes false.
 */
export function isCampaignPreparing(campaign: Campaign): boolean {
  return campaign.status === "preparing"
}

/**
 * Which half of preparation is running. Enrichment comes first and composition
 * second, so the campaign's generation state is what separates them.
 */
export function preparingStage(campaign: Campaign): "enriching" | "composing" {
  return campaign.email_generation_status === "generating"
    ? "composing"
    : "enriching"
}

/** The order the dashboard renders the sections in. */
export const CAMPAIGN_GROUPS: { group: CampaignGroup; title: string }[] = [
  { group: "setup_incomplete", title: "Setup incomplete" },
  { group: "ready", title: "Ready" },
  { group: "running", title: "Running" },
  { group: "completed", title: "Completed" },
]
