/**
 * An outreach campaign owned by the authenticated user's client. Shape mirrors
 * the API's CampaignRead: a `name` and the linked product. The product carries
 * the brief answers and supporting documents that drive outreach and ICP
 * generation. `product_name` is resolved server-side (null if the product was
 * deleted).
 */
/** A campaign's lifecycle state. `enriching_contacts` is transitional: Run has
 * been pressed and a background task is finding contacts' work emails; it flips
 * to `running` on success or `enrichment_failed` (re-runnable) on error. */
export type CampaignStatus =
  | "draft"
  | "enriching_contacts"
  | "running"
  | "enrichment_failed"
  | "completed"

/** Per-prospect email generation state on a launched campaign. */
export type EmailGenerationStatus =
  | "pending"
  | "generating"
  | "ready"
  | "failed"

/**
 * Simulated performance metrics for a running/completed campaign — raw counts
 * plus the seed sequence-completion rate (0-100). The dashboard derives the
 * display percentages (open %, click %, …) from these counts. Null on the
 * campaign until it's first run.
 */
export interface CampaignMetrics {
  sequence_completion_rate: number
  sent: number
  bounces: number
  opens: number
  clicks: number
  replies: number
  unsubscribes: number
  qualified_leads: number
  meetings_booked: number
}

export interface Campaign {
  id: number
  client_id: number
  name: string
  product_id: number | null
  product_name: string | null
  /** The creating user's name (null if that user was deleted). */
  created_by_name: string | null
  /** The creating user's team name (null if they belong to no team). */
  team_name: string | null
  /** Lifecycle state; drives the Run / Complete actions on the dashboard. */
  status: CampaignStatus
  /** True once the Run action's work-email enrichment has finished. */
  enrichment_complete: boolean
  /** Failure reason while `status` is `enrichment_failed` (null otherwise). */
  enrichment_error: string | null
  /** Per-prospect email generation (kicked off after launch): "pending",
   * "generating", "ready", or "failed". */
  email_generation_status: EmailGenerationStatus
  /** Failure reason while `email_generation_status` is "failed" (null otherwise). */
  email_generation_error: string | null
  /** Performance metrics; null until the campaign is first run. */
  metrics: CampaignMetrics | null
  /** False until the creation wizard is finished. */
  setup_completed: boolean
  /** The wizard's top-level step last reached (1 = ideal customers … 5 = preview). */
  setup_step: number
  /** Outreach sequence config, saved from the sequence step (null until then). */
  sequence_touches: number | null
  sequence_advancer_gap: number | null
  sequence_closer_gap: number | null
  sequence_closer_style: string | null
  /** How many companies to find, set on the "find contacts" step. */
  target_companies: number | null
  /** How many contacts to fetch per company ("list size"). */
  list_size: number | null
  created_at: string
  updated_at: string
}

export interface CampaignCreate {
  name: string
  product_id: number
}

export interface CampaignUpdate {
  name?: string
  product_id?: number
  setup_completed?: boolean
  setup_step?: number
  sequence_touches?: number
  sequence_advancer_gap?: number
  sequence_closer_gap?: number
  sequence_closer_style?: string
  target_companies?: number
  list_size?: number
}
