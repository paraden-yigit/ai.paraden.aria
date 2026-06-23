import { buildQuery } from "@/lib/query"
import type { ListResult, PaginationParams } from "@/types/api"
import type { Company, CompanyCreate, CompanyUpdate } from "@/types/company"
import { apiClient } from "./http"
import { normalizeList } from "./normalizeList"

/**
 * Companies service — wraps the user-scoped /api/companies endpoints. The API
 * scopes every call to the session's client, so there's no client_id to pass.
 * Methods are `this`-free so they can be passed as references.
 */
export const companyService = {
  async list(params: PaginationParams = {}): Promise<ListResult<Company>> {
    const data = await apiClient.get<unknown>(
      `/api/companies${buildQuery({ skip: params.skip, limit: params.limit })}`,
    )
    return normalizeList<Company>(data)
  },

  get(id: number): Promise<Company> {
    return apiClient.get<Company>(`/api/companies/${id}`)
  },

  create(payload: CompanyCreate): Promise<Company> {
    return apiClient.post<Company>("/api/companies/new", payload)
  },

  update(id: number, payload: CompanyUpdate): Promise<Company> {
    return apiClient.patch<Company>(`/api/companies/${id}`, payload)
  },

  /** Enrich from FullEnrich (by domain/LinkedIn); returns the updated company. */
  enrich(id: number): Promise<Company> {
    return apiClient.post<Company>(`/api/companies/${id}/enrich`)
  },

  remove(id: number): Promise<unknown> {
    return apiClient.delete(`/api/companies/${id}`)
  },
}
