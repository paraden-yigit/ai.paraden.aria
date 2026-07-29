import type {
  CampaignContactEmail,
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
  /** Start (or re-run) email generation in the background. Returns the state.
   * Pass ``excludeContactId`` for "Try another prospect" — the drafts are
   * re-run against a different contact than the one given. */
  generate(
    campaignId: number,
    opts?: { excludeContactId?: number | null },
  ): Promise<EmailGeneration> {
    const query =
      opts?.excludeContactId != null
        ? `?exclude_contact_id=${opts.excludeContactId}`
        : ""
    return apiClient.post<EmailGeneration>(
      `/api/campaigns/${campaignId}/emails/generate${query}`,
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

  /** One prospect's generated outreach emails (Outbox tab), in sending order. */
  forContact(
    campaignId: number,
    contactId: number,
  ): Promise<CampaignContactEmail[]> {
    return apiClient.get<CampaignContactEmail[]>(
      `/api/campaigns/${campaignId}/emails/by-contact/${contactId}`,
    )
  },
}
