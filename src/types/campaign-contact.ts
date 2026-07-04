// The campaign Contacts tab: prospects found by combining the campaign's ICP
// with FullEnrich company-search (companies) + people-search (people).
// Mirrors the API's CampaignContactSearchRead / CampaignContactRead.

export type CampaignContactSearchStatus = "running" | "ready" | "failed"

/** A single prospect: a person plus their (denormalized) company. */
export interface CampaignContact {
  id: number
  campaign_id: number
  external_id: string | null
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
  company_name: string | null
  company_domain: string | null
  company_linkedin_url: string | null
  company_industry: string | null
  company_headcount: number | null
  created_at: string
  updated_at: string
}

/** The contact-search state (status/counts only). The people are fetched,
 * paginated, via the list endpoint. */
export interface CampaignContactSearch {
  id: number
  campaign_id: number
  client_id: number
  status: CampaignContactSearchStatus
  error: string | null
  companies_found: number | null
  contacts_found: number | null
  created_at: string
  updated_at: string
}
