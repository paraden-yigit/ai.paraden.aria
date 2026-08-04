import type {
  CampaignImportJob,
  CampaignUploadReview,
  ImportJobKind,
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

  /** Start finding work email addresses for the uploaded contacts without one.
   * Runs in the background — poll `job("enrich_emails")` for progress. */
  startEnrichment(campaignId: number): Promise<CampaignImportJob> {
    return apiClient.post<CampaignImportJob>(
      `/api/campaigns/${campaignId}/uploaded-contacts/enrich`,
      {},
    )
  },

  /** Start finding up to `listSize` people at each uploaded company that came
   * with none. Also a background job — poll `job("fetch_contacts")`. */
  startFetch(campaignId: number, listSize: number): Promise<CampaignImportJob> {
    return apiClient.post<CampaignImportJob>(
      `/api/campaigns/${campaignId}/uploaded-contacts/fetch-contacts`,
      { list_size: listSize },
    )
  },

  /** One post-upload phase's progress. */
  job(campaignId: number, kind: ImportJobKind): Promise<CampaignImportJob> {
    return apiClient.get<CampaignImportJob>(
      `/api/campaigns/${campaignId}/uploaded-contacts/job?kind=${kind}`,
    )
  },
}
