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
  created_at: string
  updated_at: string
}

export interface CampaignCreate {
  name: string
  product_id: number
}

export type CampaignUpdate = Partial<CampaignCreate>
