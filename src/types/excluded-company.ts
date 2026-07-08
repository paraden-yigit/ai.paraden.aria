/**
 * A company on the authenticated user's client exclusion list. Shape mirrors the
 * API's ExcludedCompanyRead. A record always has a `name`, plus at least one of
 * `domain` / `linkedin_url` (the API rejects a record with neither).
 */
export interface ExcludedCompany {
  id: number
  client_id: number
  name: string
  domain: string | null
  linkedin_url: string | null
  created_at: string
  updated_at: string
}

export interface ExcludedCompanyCreate {
  name: string
  // A name is required plus at least one of domain / linkedin_url; either
  // identifier may be omitted (null) as long as the other is present.
  domain?: string | null
  linkedin_url?: string | null
}

export type ExcludedCompanyUpdate = Partial<ExcludedCompanyCreate>
