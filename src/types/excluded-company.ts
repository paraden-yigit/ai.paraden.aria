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

/**
 * The outcome of pasting a list of domains. Every line is accounted for — a
 * paste that quietly drops half its lines looks exactly like one that worked.
 */
export interface ExcludedCompaniesBulkResult {
  created: ExcludedCompany[]
  /** Already on the list, or repeated within the paste. Not an error. */
  skipped_existing: string[]
  /** Lines that don't look like a domain, echoed back verbatim. */
  invalid: string[]
}
