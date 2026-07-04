import type { Icp, IcpUpdate } from "@/types/icp"
import { apiClient } from "./http"

/**
 * Campaign ICP service — wraps the /api/campaigns/:id/icp endpoints. The API
 * scopes every call to the session's client. `get` throws an ApiError with
 * status 404 until an ICP has been generated for the campaign.
 */
export const icpService = {
  get(campaignId: number): Promise<Icp> {
    return apiClient.get<Icp>(`/api/campaigns/${campaignId}/icp`)
  },

  generate(campaignId: number): Promise<Icp> {
    return apiClient.post<Icp>(`/api/campaigns/${campaignId}/icp/generate`)
  },

  update(campaignId: number, payload: IcpUpdate): Promise<Icp> {
    return apiClient.patch<Icp>(`/api/campaigns/${campaignId}/icp`, payload)
  },
}
