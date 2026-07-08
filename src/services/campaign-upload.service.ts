import type {
  CampaignUploadReview,
  UploadedContactsPayload,
  UploadResult,
} from "@/types/campaign-upload"
import { apiClient } from "./http"

/**
 * Campaign CSV upload service — wraps the per-campaign uploaded-contacts
 * endpoints. Scoped to the session's client by the API, so no client_id is
 * passed. Methods are `this`-free so they can be passed as references.
 */
export const campaignUploadService = {
  /** Save the mapped CSV rows as the campaign's companies and contacts. */
  upload(campaignId: number, payload: UploadedContactsPayload): Promise<UploadResult> {
    return apiClient.post<UploadResult>(
      `/api/campaigns/${campaignId}/uploaded-contacts`,
      payload,
    )
  },

  /** Companies (each with their people) plus totals, filtered to a source
   * ("uploaded" or "discovered"). */
  review(
    campaignId: number,
    source: "uploaded" | "discovered" = "uploaded",
  ): Promise<CampaignUploadReview> {
    return apiClient.get<CampaignUploadReview>(
      `/api/campaigns/${campaignId}/uploaded-contacts/review?source=${source}`,
    )
  },
}
