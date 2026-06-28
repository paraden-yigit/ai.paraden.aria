/**
 * Types for the FullEnrich Company Search endpoint.
 * Docs: https://docs.fullenrich.com/api/v2/company/search/post
 */

/** A single string filter token (name, domain, keyword, industry, …). */
export interface FullEnrichValueFilter {
  value: string
  exclude?: boolean
  exact_match?: boolean
}

/** A min/max range filter (founded years, headcounts). */
export interface FullEnrichRangeFilter {
  min?: number
  max?: number
  exclude?: boolean
}

/** A bracketed-value filter (revenue ranges). */
export interface FullEnrichBracketFilter {
  value: string
  exclude?: boolean
}

export interface FullEnrichCompanySearchRequest {
  offset?: number
  limit?: number
  search_after?: string

  names?: FullEnrichValueFilter[]
  domains?: FullEnrichValueFilter[]
  professional_network_ids?: FullEnrichValueFilter[]
  professional_network_urls?: FullEnrichValueFilter[]
  keywords?: FullEnrichValueFilter[]
  specialties?: FullEnrichValueFilter[]
  industries?: FullEnrichValueFilter[]
  types?: FullEnrichValueFilter[]
  headquarters_locations?: FullEnrichValueFilter[]

  founded_years?: FullEnrichRangeFilter[]
  headcounts?: FullEnrichRangeFilter[]
  revenue_ranges?: FullEnrichBracketFilter[]
}

export interface FullEnrichLocation {
  line1?: string
  line2?: string
  city?: string
  region?: string
  country?: string
  country_code?: string
}

export interface FullEnrichCompany {
  id?: string
  name?: string
  domain?: string
  description?: string
  year_founded?: number
  headcount?: number
  headcount_range?: string
  company_type?: string
  locations?: {
    headquarters?: FullEnrichLocation
    offices?: FullEnrichLocation[]
  }
  social_profiles?: {
    professional_network?: {
      id?: number
      url?: string
      handle?: string
      connection_count?: number
    }
  }
  specialties?: string[]
  industry?: { main_industry?: string }
  revenue_range?: string
}

export interface FullEnrichSearchMetadata {
  total?: number
  credits?: number
  offset?: number
  search_after?: string
}

export interface FullEnrichCompanySearchResponse {
  companies: FullEnrichCompany[]
  metadata: FullEnrichSearchMetadata
}
