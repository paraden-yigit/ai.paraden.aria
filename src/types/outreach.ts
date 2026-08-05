/**
 * Outreach runs — the campaign setup flow.
 *
 * A run is the editable side: the list you are still building and the copy you
 * are still choosing between. Launching it hands a copy to the sending queue and
 * the run becomes a record — `campaign_id` is what it produced.
 */

/** `draft` → `composing` → `ready` → `launched`, or `failed` if composing broke. */
export type OutreachRunStatus =
  | "draft"
  | "composing"
  | "ready"
  | "launched"
  | "failed"

export interface OutreachRun {
  id: number
  name: string
  product_id: number | null
  product_name: string | null
  status: OutreachRunStatus
  /** The wizard step last reached, so a half-built run resumes where it stopped. */
  step: number
  compose_error: string | null
  sequence_touches: number | null
  sequence_advancer_gap: number | null
  sequence_closer_gap: number | null
  cta_type: CtaOption | null
  /** The sending record this run produced. Null until it is launched. */
  campaign_id: number | null
  launched_at: string | null
  created_at: string
  updated_at: string
  prospect_count: number
  /** How many of them have an email address — the rest are never written for. */
  reachable_count: number
}

export interface CtaOption {
  type?: string
  friction?: string
  intent?: string
  example_closing_line?: string
}

export interface OutreachRunCreate {
  name: string
  product_id: number
}

export interface OutreachRunUpdate {
  name?: string
  product_id?: number
  step?: number
  sequence_touches?: number
  sequence_advancer_gap?: number
  sequence_closer_gap?: number
  cta_type?: CtaOption | null
}

export interface OutreachCompanyIn {
  name?: string | null
  domain?: string | null
  description?: string | null
  industry?: string | null
  linkedin_url?: string | null
  context?: string | null
}

export interface OutreachProspectIn {
  full_name?: string | null
  first_name?: string | null
  last_name?: string | null
  job_title?: string | null
  seniority?: string | null
  department?: string | null
  linkedin_url?: string | null
  city?: string | null
  country?: string | null
  email?: string | null
  /** Which company in the same payload this person works at, by array index. */
  company_index?: number | null
}

export interface OutreachImport {
  companies: OutreachCompanyIn[]
  prospects: OutreachProspectIn[]
  /** True clears the list first; false appends to it. */
  replace: boolean
}

export interface OutreachImportResult {
  companies_created: number
  prospects_created: number
  prospect_count: number
  reachable_count: number
}

export interface OutreachProspect {
  id: number
  full_name: string | null
  first_name: string | null
  last_name: string | null
  job_title: string | null
  seniority: string | null
  department: string | null
  linkedin_url: string | null
  city: string | null
  country: string | null
  email: string | null
  company_id: number | null
  company_name: string | null
  company_domain: string | null
  /** False when they have no address: shown, but never written for or enrolled. */
  reachable: boolean
}

/** One angle for one step, as the model wrote it. */
export interface Approach {
  name: string
  subject: string
  body: string
}

export interface DraftStep {
  step_index: number
  step_kind: "opener" | "advancer" | "closer"
  approaches: Approach[]
}

export interface OutreachDraft {
  /** `idle` until the first run; then `generating` → `ready` | `failed`. */
  status: "idle" | "generating" | "ready" | "failed"
  error: string | null
  /** Who the preview was written against, so the copy reads in context. */
  prospect: {
    first_name?: string | null
    last_name?: string | null
    job_title?: string | null
    company_name?: string | null
  } | null
  steps: DraftStep[]
}

export interface Selection {
  step_index: number
  step_kind: string
  approach: string | null
  subject: string | null
  body: string | null
}

export interface OutreachEmail {
  id: number
  prospect_id: number
  step_index: number
  step_kind: string
  approach: string | null
  subject: string | null
  /** Sign-off and signature already attached — what would actually be sent. */
  body: string | null
}

export interface OutreachLaunchResult {
  campaign_id: number
  enrolled: number
  skipped: number
  blocked_reason: string | null
}
