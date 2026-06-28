/**
 * A client's brand & email-voice profile, as returned by `GET /api/brand-profile`.
 * Stored separately from the company (`Client`) — this is messaging guidance
 * used when generating outreach emails.
 */
export interface BrandProfile {
  id: number
  client_id: number
  value_proposition: string | null
  market_positioning: string | null
  competitors: string | null
  email_tone: string | null
  email_opening: string | null
  email_closing: string | null
  closing_question: string | null
  dos_and_donts: string | null
  created_at: string
  updated_at: string
}

/** Body for `PUT /api/brand-profile`. All fields optional. */
export interface BrandProfileUpdate {
  value_proposition?: string | null
  market_positioning?: string | null
  competitors?: string | null
  email_tone?: string | null
  email_opening?: string | null
  email_closing?: string | null
  closing_question?: string | null
  dos_and_donts?: string | null
}
