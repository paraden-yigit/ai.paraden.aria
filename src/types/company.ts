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
  created_at: string
  updated_at: string
}

export interface CompanyCreate {
  name: string
  domain: string
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
}

export type CompanyUpdate = Partial<CompanyCreate>
