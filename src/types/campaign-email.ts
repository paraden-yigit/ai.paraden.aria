/**
 * Types for the campaign wizard's outreach-email generation step. Generation
 * runs in the background (Claude) and returns a STAGED preview: for each
 * sequence step, 3 approaches, each a subject/body pair. Nothing is saved until
 * the user picks an approach per step and creates the campaign.
 */

/** "idle" (no run yet), "generating", "ready" (staged preview), or "failed". */
export type EmailGenerationStatus = "idle" | "generating" | "ready" | "failed"

/**
 * The sample prospect the agent wrote the sequence to — the campaign contact
 * (and its company) with the most information filled in. Shown in the preview so
 * the user knows who the drafts are addressed to.
 */
export interface EmailProspect {
  contact_id: number | null
  first_name: string | null
  last_name: string | null
  full_name: string | null
  job_title: string | null
  seniority: string | null
  department: string | null
  city: string | null
  region: string | null
  country: string | null
  email: string | null
  linkedin_url: string | null
  company_name: string | null
  company_domain: string | null
  company_industry: string | null
  company_description: string | null
  company_type: string | null
  company_headcount: number | null
  company_headcount_range: string | null
  company_hq_city: string | null
  company_hq_region: string | null
  company_hq_country: string | null
}

export interface GeneratedEmailApproach {
  /** Short label for the angle (e.g. "direct value", "proof/ROI-led"). */
  name: string
  /** Subject line. Empty when the email replies in the same thread (closers). */
  subject: string
  body: string
}

export interface GeneratedEmailStep {
  step_index: number
  /** "opener", "advancer", or "closer". */
  step_kind: string
  approaches: GeneratedEmailApproach[]
}

export interface EmailGeneration {
  status: EmailGenerationStatus
  error: string | null
  prospect: EmailProspect | null
  steps: GeneratedEmailStep[]
}

/** The user's choice of one approach for one step (index into that step). */
export interface EmailSelection {
  step_index: number
  approach_index: number
}

export interface SaveEmailsResult {
  saved: number
}

/**
 * A saved outreach email (one per sequence step), as persisted on "Create
 * campaign". Mirrors the API's CampaignEmailRead. `subject` is empty for
 * closers that reply in the same thread; `approach` is the angle label the
 * user picked in the wizard.
 */
export interface SavedCampaignEmail {
  id: number
  step_index: number
  step_kind: string
  approach: string | null
  subject: string | null
  body: string | null
  created_at: string
  updated_at: string
}

/**
 * A generated outreach email for ONE prospect at one sequence step, written by
 * the per-prospect generation job after launch. Mirrors the API's
 * CampaignContactEmailRead. Shares the saved-email shape (so it renders with
 * `SavedSequence`) plus the owning `campaign_contact_id`.
 */
export interface CampaignContactEmail {
  id: number
  campaign_contact_id: number
  step_index: number
  step_kind: string
  approach: string | null
  subject: string | null
  body: string | null
  created_at: string
  updated_at: string
}
