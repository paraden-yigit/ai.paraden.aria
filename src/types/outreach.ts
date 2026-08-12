/**
 * Outreach runs — the campaign setup flow.
 *
 * A run is the editable side: the list you are still building and the copy you
 * are still choosing between. Launching it hands a copy to the sending queue and
 * the run becomes a record — `campaign_id` is what it produced.
 */

/**
 * How a campaign runs, and so where its list comes from: `strategic` is a list
 * the user uploads, `flow` is a pool we keep filled from an ideal customer
 * profile. Mirrors the API's own literal.
 */
export type CampaignType = "strategic" | "flow"

/**
 * `draft` → `composing` → `ready`, then either `running` (a Flow campaign
 * working its pool) or `launched` (a Strategic one handed to the sending
 * queue). `failed` if composing broke.
 */
export type OutreachRunStatus =
  | "draft"
  | "composing"
  | "ready"
  | "running"
  | "launched"
  | "failed"

export interface OutreachRun {
  id: number
  name: string
  product_id: number | null
  product_name: string | null
  /** How the campaign runs. Null until the second step is answered. */
  campaign_type: CampaignType | null
  /** Contacts this campaign may spend of the sender's monthly reach. Null means
   * it was never allocated — which is not the same as none, or as all of it. */
  monthly_reach: number | null
  /** Working days the written emails sit before the first one may leave. Zero
   * is no wait, which is what every campaign did before the setting existed. */
  review_days: number
  /** The targeting profile, as the wizard last saved it. Null until then. */
  icp: RunIcp | null
  /** How many people the profile last matched — the run's prospect count. Null
   * until a search has run. The sample rows behind it are not sent with a run;
   * only the step that made them holds those. */
  pool_total: number | null
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

/**
 * The parts of a campaign the wizard edits before one exists.
 *
 * The steps that own these fields read them from here rather than from an
 * `OutreachRun`: there is no run while the wizard is being filled in, and one
 * created halfway through would be the draft this flow deliberately does not
 * keep.
 */
export interface CampaignSetup {
  campaign_type: CampaignType | null
  sequence_touches: number | null
  sequence_advancer_gap: number | null
  sequence_closer_gap: number | null
  cta_type: CtaOption | null
}

export interface CtaOption {
  type?: string
  friction?: string
  intent?: string
  example_closing_line?: string
}

/**
 * A whole campaign, in one request.
 *
 * The wizard keeps no drafts — nothing is written while it is being filled in —
 * so everything it collected is sent together and the campaign is born
 * finished.
 */
export interface OutreachRunCreate {
  name: string
  product_id: number
  monthly_reach?: number | null
  campaign_type?: CampaignType | null
  icp?: RunIcp | null
  pool_sample?: RunPoolSample | null
  company_domains?: string[]
  sequence_touches?: number | null
  sequence_advancer_gap?: number | null
  sequence_closer_gap?: number | null
  cta_type?: CtaOption | null
  /** Where the chosen copy is read back from — the browser sends the angle, not
   * the words. */
  preview_token?: string | null
  selections?: { step_index: number; approach: string | null }[]
}

/** The Approach step's emails, written before any campaign exists. */
export interface OutreachPreview {
  token: string
  status: "generating" | "ready" | "failed"
  error: string | null
  prospect: DraftProspect | null
  steps: DraftStep[]
}

/** Everything the preview generator needs, since there is no campaign to read
 * it from. */
export interface PreviewStart {
  product_id: number
  sequence_touches: number
  sequence_advancer_gap?: number | null
  sequence_closer_gap?: number | null
  cta_type?: CtaOption | null
  icp?: RunIcp | null
  samples: ContactPoolSample[]
  prospect_index?: number
}

/** What one seat may reach in a month, from the client's current plan plus its
 * add-ons. `unlimited` carries the catalog's 0-means-unlimited convention, so a
 * client with no plan at all (also 0) is not mistaken for an unlimited one. */
export interface ReachAllowance {
  monthly_reach: number
  /** What this sender's other campaigns already claim. */
  allocated: number
  /** What is left for this one — never negative. */
  available: number
  unlimited: boolean
  plan_name: string | null
}

/**
 * What the dashboard's Settings tab may change.
 *
 * Deliberately not `OutreachRunUpdate`: those are the wizard's fields and
 * describe a campaign that has not started. These two only say what happens
 * next, so the API accepts them while a campaign is running.
 */
export interface OutreachRunSettings {
  /** Contacts a month. Zero stops the spending without stopping the campaign. */
  monthly_reach?: number
  /** Working days, matching the sequence gaps. */
  review_days?: number
}

export interface OutreachRunUpdate {
  name?: string
  product_id?: number
  campaign_type?: CampaignType
  monthly_reach?: number | null
  icp?: RunIcp
  pool_sample?: RunPoolSample
  step?: number
  sequence_touches?: number
  sequence_advancer_gap?: number
  sequence_closer_gap?: number
  cta_type?: CtaOption | null
}

/**
 * The targeting profile as the run stores it (`outreach_runs.icp`).
 *
 * The wizard's own draft carries one more field — `company_domains` — which
 * lives as `outreach_companies` rows instead, because those are companies rather
 * than a description of companies.
 */
export interface RunIcp {
  industries: string[]
  specialties: string[]
  company_locations: string[]
  headcount_min: number | null
  headcount_max: number | null
  departments: string[]
  job_titles: string[]
  seniority: string[]
  locations: string[]
}

/**
 * The last contact-pool answer for a run's profile, stored beside it.
 *
 * A snapshot of a provider search — anonymous by construction, and stale the
 * moment the provider's index moves. Kept so the number a run was set up
 * against is recoverable, not as a record of anybody.
 */
export interface RunPoolSample {
  total: number
  samples: ContactPoolSample[]
}

/**
 * The profile as the wizard holds it while it is being edited.
 *
 * Saved on the way out of the Contacts step: the company/contact filters become
 * `run.icp`, and a Strategic run's domains become the run's companies.
 */
export interface OutreachIcpDraft {
  /**
   * Companies named outright, by domain — how a Strategic run says who it is
   * for, in place of the industry/location/size filters a Flow run describes.
   */
  company_domains: string[]
  /** From the industries taxonomy. */
  industries: string[]
  /** Free text: what those companies do, narrower than their industry. */
  specialties: string[]
  /** Free text: countries, regions or cities the company is based in. */
  company_locations: string[]
  headcount_min: number
  headcount_max: number
  /** Main job functions, from the job-functions taxonomy. */
  departments: string[]
  /** Free text, in the prospect's own words. */
  job_titles: string[]
  /** From the seniority taxonomy. */
  seniority: string[]
  /** Free text: where the person is, not their company. */
  locations: string[]
}

/** The profile as the contact-pool endpoint wants it: null headcount ends mean
 * "no floor" / "no ceiling" and are left out of the provider search. */
export interface ContactPoolFilters {
  company_domains: string[]
  industries: string[]
  specialties: string[]
  company_locations: string[]
  headcount_min: number | null
  headcount_max: number | null
  departments: string[]
  job_titles: string[]
  seniority: string[]
  locations: string[]
}

/** One anonymous person from the pool — enough to judge the aim of a profile,
 * nothing that identifies them. */
export interface ContactPoolSample {
  first_name: string | null
  last_name: string | null
  full_name: string | null
  company_name: string | null
  company_domain: string | null
  company_industry: string | null
  company_headcount: number | null
  company_headcount_range: string | null
  job_title: string | null
  job_function: string | null
  seniority: string | null
  location: string | null
  /** True when `location` is the company's HQ standing in for an unknown one. */
  location_is_company: boolean
}

export interface ContactPoolSize {
  /** People matching the profile. */
  total: number
  /** False when nothing was asked for, so `total` is not a pool. */
  filtered: boolean
  /** The first page of the same search the total came from. */
  samples: ContactPoolSample[]
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

/** What the run has stored, and what its exclusion list kept out. */
export interface CompanyDomains {
  domains: string[]
  excluded: number
}

export interface OutreachImportResult {
  companies_created: number
  prospects_created: number
  prospect_count: number
  reachable_count: number
}

/** Where someone or something on a campaign came from. */
export type OutreachSource = "uploaded" | "discovered"

/** What the Prospects tab can be sorted by. Mirrors the API's whitelist. */
export type ProspectSort =
  | "name"
  | "role"
  | "company"
  | "domain"
  | "location"
  | "email"
  | "added"

export type SortDirection = "asc" | "desc"

/**
 * A page of a campaign's people.
 *
 * Searching, sorting and paging all happen in the database: a Flow campaign's
 * pool is filled by a background task for as long as the campaign runs, so
 * there is no size at which loading it and filtering here would be safe.
 */
/**
 * A page of a campaign's companies.
 *
 * Paged and searched by the API for the same reason its people are: half the
 * list is the employers of a pool the campaign keeps filling.
 */
export interface CompanyListParams {
  skip?: number
  limit?: number
  /** Matched against company name and domain. */
  q?: string
}

export interface ProspectListParams {
  skip?: number
  limit?: number
  /**
   * Matched against name, role, company and domain — every word has to hit
   * something, though not all of them the same field.
   */
  q?: string
  /** Added on or after this day, inclusive. `YYYY-MM-DD`, read as a UTC day. */
  added_from?: string
  /** Added on or before this day, inclusive. */
  added_to?: string
  sort?: ProspectSort
  direction?: SortDirection
}

/**
 * A company on a campaign's list, enrichment included.
 *
 * An uploaded one is a real row. A discovered one is the employer of people the
 * campaign found for itself, summed up at read time — so it has no `id` and
 * none of the enriched fields, only a name, a domain and its own headcount.
 */
export interface OutreachCompany {
  id: number | null
  name: string | null
  domain: string | null
  industry: string | null
  headcount: number | null
  headcount_range: string | null
  hq_city: string | null
  hq_country: string | null
  linkedin_url: string | null
  description: string | null
  context: string | null
  source: OutreachSource
  /** How many of the campaign's people work there. */
  prospect_count: number
  /** When it joined the campaign — for a discovered one, when its first person was found. */
  created_at: string
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
  source: OutreachSource
  /** False when they have no address: shown, but never written for or enrolled. */
  reachable: boolean
  /** How the hunt for that address is going. */
  email_enrichment_status:
    | "pending"
    | "requested"
    | "found"
    | "not_found"
    | "excluded"
    | "failed"
  /** When they joined the campaign — uploaded with the list, or found for it. */
  created_at: string
}

/** One angle for one step, as the model wrote it. */
export interface Approach {
  name: string
  subject: string
  body: string
}

/** Who a preview was written against, and their place in the candidate order —
 * which is what lets the step offer the next one. */
export interface DraftProspect {
  first_name?: string | null
  last_name?: string | null
  job_title?: string | null
  company_name?: string | null
  company_domain?: string | null
  index: number
  total: number
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
  prospect: DraftProspect | null
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
