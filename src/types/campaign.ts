/**
 * An outreach campaign owned by the authenticated user's client. Shape mirrors
 * the API's CampaignRead: a `name` and the linked product. The product carries
 * the brief answers and supporting documents that drive outreach and ICP
 * generation. `product_name` is resolved server-side (null if the product was
 * deleted).
 */
export interface Campaign {
  id: number
  client_id: number
  name: string
  product_id: number | null
  product_name: string | null
  /** False until the creation wizard is finished. */
  setup_completed: boolean
  /** The wizard's top-level step last reached (1 = ideal customers … 5 = preview). */
  setup_step: number
  /** Outreach sequence config, saved from the sequence step (null until then). */
  sequence_touches: number | null
  sequence_advancer_gap: number | null
  sequence_closer_gap: number | null
  sequence_closer_style: string | null
  /** How many are needed, set on the wizard's first step. */
  target_count: number | null
  /** Whether target_count counts companies or contacts (the user picks one). */
  target_type: TargetType | null
  created_at: string
  updated_at: string
}

/** What a campaign's target_count counts. The user picks exactly one. */
export type TargetType = "companies" | "contacts"

export interface CampaignCreate {
  name: string
  product_id: number
  target_count?: number
  target_type?: TargetType
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
  target_count?: number
  target_type?: TargetType
}
