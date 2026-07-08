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
  /** The wizard's top-level step last reached (1 = upload … 4 = preview). */
  setup_step: number
  /** Outreach sequence config, saved from the sequence step (null until then). */
  sequence_touches: number | null
  sequence_advancer_gap: number | null
  sequence_closer_gap: number | null
  sequence_closer_style: string | null
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
}
