/**
 * The client (the user's own company) as returned by `GET /api/company`. This
 * is the tenant the session belongs to.
 */
export interface Client {
  id: number
  name: string
  city: string | null
  country: string | null
  url: string | null
  // What the company does / value proposition (used when generating outreach).
  value_proposition: string | null
  industry: string | null
  linkedin_url: string | null
  // Company-level language tone description, reused for email templates.
  tone_description: string | null
  // Whether a logo has been uploaded (fetch it from `GET /api/company/logo`).
  has_logo: boolean
  // False until the owner completes the first-login onboarding wizard.
  onboarding_completed: boolean
  created_at: string
  updated_at: string
}

/** Body for `PATCH /api/company`. All fields optional. */
export interface ClientUpdate {
  name?: string | null
  city?: string | null
  country?: string | null
  url?: string | null
  value_proposition?: string | null
  industry?: string | null
  linkedin_url?: string | null
  tone_description?: string | null
  onboarding_completed?: boolean | null
}

/**
 * The onboarding agent's extracted company profile (from
 * `POST /api/company/onboarding/extract`), staged for the wizard. Nothing is
 * persisted until the owner approves and the wizard saves.
 */
export interface OnboardingDraft {
  name: string | null
  city: string | null
  country: string | null
  url: string | null
  linkedin_url: string | null
  industry: string | null
  value_proposition: string | null
  tone_description: string | null
  // Base64 data URL of the extracted logo, for previewing in the browser.
  logo_data_url: string | null
}
