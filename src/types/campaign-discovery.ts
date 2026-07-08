/**
 * Types for the campaign wizard's contact-discovery step. Discovery runs in the
 * background and returns a STAGED preview (not saved) that the user approves or
 * repopulates.
 */

export interface DiscoveryContact {
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
}

export interface DiscoveryCompany {
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
  contacts: DiscoveryContact[]
}

/** "idle" (no run yet), "running", "ready" (staged preview), or "failed". */
export type DiscoveryStatus = "idle" | "running" | "ready" | "failed"

export interface DiscoverySearch {
  status: DiscoveryStatus
  error: string | null
  target: number | null
  companies_found: number | null
  contacts_found: number | null
  companies: DiscoveryCompany[]
}

export interface DiscoveryApproveResult {
  companies_created: number
  contacts_created: number
}
