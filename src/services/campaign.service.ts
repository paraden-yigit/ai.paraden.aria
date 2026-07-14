import { buildQuery } from "@/lib/query"
import type { ListResult, PaginationParams } from "@/types/api"
import type { Campaign, CampaignCreate, CampaignUpdate } from "@/types/campaign"
import { apiClient } from "./http"
import { normalizeList } from "./normalizeList"

/**
 * Campaigns service — wraps the user-scoped /api/campaigns endpoints. The API
 * scopes every call to the session's client, so there's no client_id to pass.
 * Methods are `this`-free so they can be passed as references.
 */
export const campaignService = {
  async list(params: PaginationParams = {}): Promise<ListResult<Campaign>> {
    const data = await apiClient.get<unknown>(
      `/api/campaigns${buildQuery({ skip: params.skip, limit: params.limit })}`,
    )
    return normalizeList<Campaign>(data)
  },

  get(id: number): Promise<Campaign> {
    return apiClient.get<Campaign>(`/api/campaigns/${id}`)
  },

  create(payload: CampaignCreate): Promise<Campaign> {
    return apiClient.post<Campaign>("/api/campaigns/new", payload)
  },

  update(id: number, payload: CampaignUpdate): Promise<Campaign> {
    return apiClient.patch<Campaign>(`/api/campaigns/${id}`, payload)
  },

  remove(id: number): Promise<unknown> {
    return apiClient.delete(`/api/campaigns/${id}`)
  },

  /** Start the setup wizard over: wipe the campaign's uploaded/discovered data
   * (keeping name + product) and reset it to step 1. */
  reset(id: number): Promise<Campaign> {
    return apiClient.post<Campaign>(`/api/campaigns/${id}/reset`)
  },

  /** Launch the campaign: set it running and populate simulated metrics. */
  run(id: number): Promise<Campaign> {
    return apiClient.post<Campaign>(`/api/campaigns/${id}/run`)
  },

  /** Mark the campaign complete and repopulate metrics at 100% completion. */
  complete(id: number): Promise<Campaign> {
    return apiClient.post<Campaign>(`/api/campaigns/${id}/complete`)
  },
}
