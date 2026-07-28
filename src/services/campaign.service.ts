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

  /**
   * Launch the campaign: find each contact's work email, write their sequence,
   * then queue them for sending. Refused once any email has already gone out —
   * re-running would rewrite outreach prospects have already received.
   *
   * There is no `complete`: a campaign marks itself completed once every
   * enrolled prospect has finished their sequence.
   */
  run(id: number): Promise<Campaign> {
    return apiClient.post<Campaign>(`/api/campaigns/${id}/run`)
  },
}
