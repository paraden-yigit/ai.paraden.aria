import { apiClient } from "./http"
import type {
  FullEnrichCompanySearchRequest,
  FullEnrichCompanySearchResponse,
} from "@/types/fullenrich"

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
}
