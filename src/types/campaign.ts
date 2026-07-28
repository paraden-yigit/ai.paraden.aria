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

/** Legacy bulk-generation state; see `email_generation_status` below. */
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
  /**
   * The reply breakdown. Counted per prospect and mutually exclusive, so
   * `success + fail + opt_out` never exceeds `replies` — the remainder is replies
   * that were none of the three (a question, an acknowledgement, or anything too
   * ambiguous to call). Automated replies (out-of-office, bounces) are excluded
   * from `replies` entirely.
   */
  success: number
  fail: number
  opt_out: number
}

/**
 * The call-to-action chosen on the wizard's "Call to action" step — the whole
 * selected option, stored verbatim on the campaign and fed into email generation.
 */
export interface CtaType {
  type: string
  friction: string
  intent: string
  example_closing_line: string
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
  /** LEGACY. Emails used to be generated in bulk at launch and this tracked it;
   * each prospect's sequence is now written just before their first email is
   * sent, so this stays "pending" on new campaigns. Don't key UI off it. */
  email_generation_status: EmailGenerationStatus
  /** Failure reason while `email_generation_status` is "failed" (null otherwise). */
  email_generation_error: string | null
  /** Performance metrics; null until the campaign is first run. */
  metrics: CampaignMetrics | null
  /** False until the creation wizard is finished. */
  setup_completed: boolean
  /** The wizard's top-level step last reached (1 = ideal customers … 6 = preview). */
  setup_step: number
  /** Outreach sequence config, saved from the sequence step (null until then). */
  sequence_touches: number | null
  sequence_advancer_gap: number | null
  sequence_closer_gap: number | null
  sequence_closer_style: string | null
  /** The call-to-action chosen on the "Call to action" step (null until then). */
  cta_type: CtaType | null
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
  cta_type?: CtaType
  target_companies?: number
  list_size?: number
}
