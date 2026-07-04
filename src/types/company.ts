/** FullEnrich enrichment state for a company. */
export type EnrichStatus = "pending" | "failed" | "successful"

/**
 * A company owned by the authenticated user's client. Shape mirrors the API's
 * CompanyRead (FullEnrich-aligned, flattened). `name` + `domain` are required;
 * everything else is optional/nullable.
 */
export interface Company {
  id: number
  client_id: number
  name: string
  domain: string
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
  /** How the company entered the list, e.g. "add_company_button". */
  source: string | null
  enrich_status: EnrichStatus
  created_at: string
  updated_at: string
}

export interface CompanyCreate {
  name: string
  // A company needs a name plus at least one of domain / linkedin_url; domain
  // may be omitted (null) when the company is identified only by its LinkedIn URL.
  domain?: string | null
  description?: string | null
  year_founded?: number | null
  company_type?: string | null
  headcount?: number | null
  headcount_range?: string | null
  industry?: string | null
  linkedin_url?: string | null
  hq_city?: string | null
  hq_region?: string | null
  hq_country?: string | null
  source?: string | null
  enrich_status?: EnrichStatus
}

export type CompanyUpdate = Partial<CompanyCreate>
