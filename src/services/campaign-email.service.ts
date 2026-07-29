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

  /** Rewrite one prospect's email for one step. `body` is the copy only — the
   * sign-off and signature are composed on at send time. The version it replaces
   * is archived by the API. Rejected (409) once that step has been sent, or while
   * the campaign is composing. */
  updateForContact(
    campaignId: number,
    contactId: number,
    emailId: number,
    payload: { subject: string | null; body: string },
  ): Promise<CampaignContactEmail> {
    return apiClient.put<CampaignContactEmail>(
      `/api/campaigns/${campaignId}/emails/by-contact/${contactId}/${emailId}`,
      payload,
    )
  },

  /** Put back the email Paraden wrote, discarding the hand-written one. The
   * discarded version is archived by the API, so nothing written is destroyed —
   * it just stops being what gets sent. Same refusals as `updateForContact`. */
  revertForContact(
    campaignId: number,
    contactId: number,
    emailId: number,
  ): Promise<CampaignContactEmail> {
    return apiClient.post<CampaignContactEmail>(
      `/api/campaigns/${campaignId}/emails/by-contact/${contactId}/${emailId}/revert`,
    )
  },
}
