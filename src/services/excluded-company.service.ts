import { buildQuery } from "@/lib/query"
import type { ListResult, PaginationParams } from "@/types/api"
import type {
  ExcludedCompany,
  ExcludedCompanyCreate,
  ExcludedCompanyUpdate,
} from "@/types/excluded-company"
import { apiClient } from "./http"
import { normalizeList } from "./normalizeList"

/**
 * Company exclusion-list service — wraps the user-scoped /api/excluded-companies
 * endpoints. The API scopes every call to the session's client, so there's no
 * client_id to pass. Methods are `this`-free so they can be passed as references.
 */
export const excludedCompanyService = {
  async list(params: PaginationParams = {}): Promise<ListResult<ExcludedCompany>> {
    const data = await apiClient.get<unknown>(
      `/api/excluded-companies${buildQuery({ skip: params.skip, limit: params.limit })}`,
    )
    return normalizeList<ExcludedCompany>(data)
  },

  /** Search by name, domain, or LinkedIn URL (case-insensitive). */
  async search(
    q: string,
    params: PaginationParams = {},
  ): Promise<ListResult<ExcludedCompany>> {
    const data = await apiClient.get<unknown>(
      `/api/excluded-companies/search${buildQuery({
        q,
        skip: params.skip,
        limit: params.limit,
      })}`,
    )
    return normalizeList<ExcludedCompany>(data)
  },

  get(id: number): Promise<ExcludedCompany> {
    return apiClient.get<ExcludedCompany>(`/api/excluded-companies/${id}`)
  },

  create(payload: ExcludedCompanyCreate): Promise<ExcludedCompany> {
    return apiClient.post<ExcludedCompany>("/api/excluded-companies/new", payload)
  },

  update(id: number, payload: ExcludedCompanyUpdate): Promise<ExcludedCompany> {
    return apiClient.patch<ExcludedCompany>(`/api/excluded-companies/${id}`, payload)
  },

  remove(id: number): Promise<unknown> {
    return apiClient.delete(`/api/excluded-companies/${id}`)
  },
}
