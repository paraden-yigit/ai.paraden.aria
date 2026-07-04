import { apiClient } from "./http"
import type { CompanyCreate } from "@/types/company"
import type {
  FullEnrichCompanySearchRequest,
  FullEnrichCompanySearchResponse,
} from "@/types/fullenrich"

/** One of `domain` / `linkedin_url` identifies the company to look up. */
export interface CompanyLookupRequest {
  domain?: string
  linkedin_url?: string
}

/** `company` is a ready-to-save draft, or null when FullEnrich has no match. */
export interface CompanyLookupResult {
  company: CompanyCreate | null
}

/**
 * FullEnrich Company Search — proxied through the Paraden API so the provider
 * key stays server-side. The backend forwards the filter body to FullEnrich
 * (https://docs.fullenrich.com/api/v2/company/search/post) and returns its raw
 * `{ companies, metadata }` response.
 */
export const fullEnrichService = {
  searchCompanies(
    body: FullEnrichCompanySearchRequest,
    signal?: AbortSignal,
  ): Promise<FullEnrichCompanySearchResponse> {
    return apiClient.post<FullEnrichCompanySearchResponse>(
      "/api/companies/fullenrich-search",
      body,
      { signal },
    )
  },

  /** Look up a single company by domain or LinkedIn URL for the "Add company" flow. */
  lookupCompany(
    body: CompanyLookupRequest,
    signal?: AbortSignal,
  ): Promise<CompanyLookupResult> {
    return apiClient.post<CompanyLookupResult>(
      "/api/companies/fullenrich-lookup",
      body,
      { signal },
    )
  },
}
