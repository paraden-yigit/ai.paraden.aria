/**
 * Types for the campaign wizard's contact upload. The client parses the
 * spreadsheet — CSV or xlsx — maps its columns onto contact/company attributes,
 * and posts the mapped rows; the API normalises them into the campaign's
 * companies and contacts.
 */

export interface UploadedContactInput {
  full_name?: string | null
  first_name?: string | null
  last_name?: string | null
  job_title?: string | null
  seniority?: string | null
  department?: string | null
  linkedin_url?: string | null
  city?: string | null
  region?: string | null
  country?: string | null
  email?: string | null
  phone?: string | null
}

export interface UploadedCompanyInput {
  name?: string | null
  domain?: string | null
  description?: string | null
  year_founded?: string | null
  company_type?: string | null
  headcount?: string | null
  headcount_range?: string | null
  industry?: string | null
  linkedin_url?: string | null
  hq_city?: string | null
  hq_region?: string | null
  hq_country?: string | null
  /** Free text the uploader brought with them; stored, not yet read. */
  context?: string | null
}

export interface UploadedRow {
  contact: UploadedContactInput
  company: UploadedCompanyInput
}

export interface UploadedContactsPayload {
  rows: UploadedRow[]
}

export interface UploadResult {
  companies_created: number
  contacts_created: number
  /** Rows dropped because the company or address is on the exclusion list. */
  excluded_skipped: number
  /** A named contact who already has an email address — nothing left to do. */
  contacts_ready: number
  /** A named contact with no address, so one has to be found for them. */
  contacts_needing_email: number
  /** Companies that arrived with nobody attached, so contacts have to be found. */
  companies_without_contacts: number
}

/** Which post-upload phase a job belongs to. */
export type ImportJobKind = "enrich_emails" | "fetch_contacts"

/** Progress for one post-upload phase, polled while it runs. */
export interface CampaignImportJob {
  kind: string
  status: "idle" | "running" | "ready" | "failed"
  total: number
  completed: number
  error: string | null
  /** Phase-specific counts once it finishes: `{found, attempted}` for
   * enrichment, `{contacts_created}` for the contact search. */
  result: Record<string, number> | null
}

/** A contact as returned by the step-4 review. */
export interface CampaignUploadedContact {
  id: number
  /** "uploaded" (spreadsheet) or "discovered" (FullEnrich). */
  source: string
  full_name: string | null
  first_name: string | null
  last_name: string | null
  job_title: string | null
  seniority: string | null
  department: string | null
  linkedin_url: string | null
  city: string | null
  region: string | null
  country: string | null
  email: string | null
  phone: string | null
  /** How the search for their work email went: null (never looked), "found",
   * "not_found" or "unenrichable" (too sparse to look up). */
  email_enrichment_status: string | null
  created_at: string
}

/** A company (with its people) as returned by the step-4 review. */
export interface CampaignCompanyReview {
  id: number
  /** "uploaded" (spreadsheet) or "discovered" (FullEnrich). */
  source: string
  name: string | null
  domain: string | null
  description: string | null
  year_founded: number | null
  company_type: string | null
  headcount: number | null
  headcount_range: string | null
  industry: string | null
  linkedin_url: string | null
  hq_city: string | null
  hq_region: string | null
  hq_country: string | null
  context: string | null
  contacts: CampaignUploadedContact[]
}

export interface CampaignUploadReview {
  companies: CampaignCompanyReview[]
  unassigned_contacts: CampaignUploadedContact[]
  total_companies: number
  total_contacts: number
}
