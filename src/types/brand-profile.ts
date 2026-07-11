/**
 * A client's brand profile, as returned by `GET /api/brand-profile`. Stored
 * separately from the company (`Client`) — this is company-level messaging
 * guidance used when generating outreach emails. The per-user email-voice fields
 * (tone/opening/closing, do's & don'ts) moved to the User (see `types/auth.ts`).
 */
export interface BrandProfile {
  id: number
  client_id: number
  value_proposition: string | null
  market_positioning: string | null
  competitors: string | null
  closing_question: string | null
  created_at: string
  updated_at: string
}

/** Body for `PUT /api/brand-profile`. All fields optional. */
export interface BrandProfileUpdate {
  value_proposition?: string | null
  market_positioning?: string | null
  competitors?: string | null
  closing_question?: string | null
}
