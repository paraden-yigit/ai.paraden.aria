import type {
  EmailGeneration,
  EmailSelection,
  SavedCampaignEmail,
  SaveEmailsResult,
} from "@/types/campaign-email"
import { apiClient } from "./http"

/**
 * Campaign outreach-email service — wraps the per-campaign email-generation
 * endpoints. Scoped to the session's client by the API. Methods are `this`-free
 * so they can be passed as references.
 */
export const campaignEmailService = {
  /** Start (or re-run) email generation in the background. Returns the state. */
  generate(campaignId: number): Promise<EmailGeneration> {
    return apiClient.post<EmailGeneration>(
      `/api/campaigns/${campaignId}/emails/generate`,
    )
  },

  /** Current generation state + staged emails (polled while generating). */
  get(campaignId: number): Promise<EmailGeneration> {
    return apiClient.get<EmailGeneration>(`/api/campaigns/${campaignId}/emails`)
  },

  /** Save the chosen approach for each step to the campaign. */
  save(
    campaignId: number,
    selections: EmailSelection[],
  ): Promise<SaveEmailsResult> {
    return apiClient.post<SaveEmailsResult>(
      `/api/campaigns/${campaignId}/emails/save`,
      { selections },
    )
  },

  /** The campaign's saved outreach emails (one per step), in sending order. */
  saved(campaignId: number): Promise<SavedCampaignEmail[]> {
    return apiClient.get<SavedCampaignEmail[]>(
      `/api/campaigns/${campaignId}/emails/saved`,
    )
  },
}
