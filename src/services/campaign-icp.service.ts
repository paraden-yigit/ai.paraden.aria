import type { Icp, IcpUpdate } from "@/types/icp"
import { apiClient } from "./http"

/**
 * Per-campaign ICP service — wraps the /api/campaigns/:id/icp endpoints. A
 * campaign's ICP is an independent clone of its product's ICP: the wizard's
 * "Ideal customers" step clones it (idempotently) and lets the user make final
 * edits without touching the product template. `get` throws an ApiError with
 * status 404 until an ICP has been cloned to the campaign; `reset` re-copies the
 * product's current ICP, discarding campaign-level edits.
 *
 * Kept apart from `icp.service` so the product ICP — a feature in its own right —
 * does not live in the same file as the campaign's copy of it.
 */
export const campaignIcpService = {
  get(campaignId: number): Promise<Icp> {
    return apiClient.get<Icp>(`/api/campaigns/${campaignId}/icp`)
  },

  clone(campaignId: number): Promise<Icp> {
    return apiClient.post<Icp>(`/api/campaigns/${campaignId}/icp/clone`)
  },

  update(campaignId: number, payload: IcpUpdate): Promise<Icp> {
    return apiClient.patch<Icp>(`/api/campaigns/${campaignId}/icp`, payload)
  },

  reset(campaignId: number): Promise<Icp> {
    return apiClient.post<Icp>(`/api/campaigns/${campaignId}/icp/reset`)
  },
}
