import type {
  DiscoveryApproveResult,
  DiscoverySearch,
} from "@/types/campaign-discovery"
import { apiClient } from "./http"

/**
 * Campaign contact-discovery service — wraps the per-campaign discovery
 * endpoints. Scoped to the session's client by the API. Methods are `this`-free
 * so they can be passed as references.
 */
export const campaignDiscoveryService = {
  /** Start (or repopulate) a discovery run. Returns the (running) state. */
  generate(campaignId: number): Promise<DiscoverySearch> {
    return apiClient.post<DiscoverySearch>(
      `/api/campaigns/${campaignId}/discovery/generate`,
    )
  },

  /** Current discovery state + staged preview (polled while running). */
  get(campaignId: number): Promise<DiscoverySearch> {
    return apiClient.get<DiscoverySearch>(
      `/api/campaigns/${campaignId}/discovery`,
    )
  },

  /** Save the staged companies + contacts to the campaign. */
  approve(campaignId: number): Promise<DiscoveryApproveResult> {
    return apiClient.post<DiscoveryApproveResult>(
      `/api/campaigns/${campaignId}/discovery/approve`,
    )
  },

  /** Discard any staged discovery (used when skipping). */
  skip(campaignId: number): Promise<unknown> {
    return apiClient.post(`/api/campaigns/${campaignId}/discovery/skip`)
  },
}
