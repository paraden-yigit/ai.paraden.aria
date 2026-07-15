import type { Icp, IcpUpdate } from "@/types/icp"
import { apiClient } from "./http"

/**
 * Product ICP service — wraps the /api/products/:id/icp endpoints. The API
 * scopes every call to the session's client. `get` throws an ApiError with
 * status 404 until an ICP has been generated for the product.
 */
export const icpService = {
  get(productId: number): Promise<Icp> {
    return apiClient.get<Icp>(`/api/products/${productId}/icp`)
  },

  generate(productId: number): Promise<Icp> {
    return apiClient.post<Icp>(`/api/products/${productId}/icp/generate`)
  },

  update(productId: number, payload: IcpUpdate): Promise<Icp> {
    return apiClient.patch<Icp>(`/api/products/${productId}/icp`, payload)
  },
}

/**
 * Per-campaign ICP service — wraps the /api/campaigns/:id/icp endpoints. A
 * campaign's ICP is an independent clone of its product's ICP: the wizard's
 * "Ideal customers" step clones it (idempotently) and lets the user make final
 * edits without touching the product template. `get` throws an ApiError with
 * status 404 until an ICP has been cloned to the campaign; `reset` re-copies the
 * product's current ICP, discarding campaign-level edits.
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
