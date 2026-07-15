/**
 * The client (the user's own company) as returned by `GET /api/company`. This
 * is the tenant the session belongs to — distinct from the CRM `Company`.
 */
export interface Client {
  id: number
  name: string
  country: string | null
  url: string | null
  // Company messaging (used when generating outreach).
  value_proposition: string | null
  market_positioning: string | null
  competitors: string | null
  created_at: string
  updated_at: string
}

/** Body for `PATCH /api/company`. All fields optional. */
export interface ClientUpdate {
  name?: string | null
  country?: string | null
  url?: string | null
  value_proposition?: string | null
  market_positioning?: string | null
  competitors?: string | null
}
