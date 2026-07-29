import { buildQuery } from "@/lib/query"
import type { ListResult, PaginationParams } from "@/types/api"
import type {
  CampaignContact,
  CampaignContactSearch,
} from "@/types/campaign-contact"
import { apiClient } from "./http"
import { normalizeList } from "./normalizeList"

/**
 * Campaign contacts service — wraps the /api/campaigns/:id/contacts endpoints.
 * The API scopes every call to the session's client. `get` throws an ApiError
 * with status 404 until a contact search has been started for the campaign.
 */
export const campaignContactService = {
  /** The search status/counts (lightweight; polled while a search runs). */
  get(campaignId: number): Promise<CampaignContactSearch> {
    return apiClient.get<CampaignContactSearch>(
      `/api/campaigns/${campaignId}/contacts`,
    )
  },

  /** A page of the people found for the campaign (grouped by company). */
  async list(
    campaignId: number,
    params: PaginationParams = {},
  ): Promise<ListResult<CampaignContact>> {
    const data = await apiClient.get<unknown>(
      `/api/campaigns/${campaignId}/contacts/list${buildQuery({
        skip: params.skip,
        limit: params.limit,
      })}`,
    )
    return normalizeList<CampaignContact>(data)
  },

  generate(campaignId: number): Promise<CampaignContactSearch> {
    return apiClient.post<CampaignContactSearch>(
      `/api/campaigns/${campaignId}/contacts/generate`,
    )
  },

  /** Take one person off the campaign. Rejected (409) unless the campaign is
   * idle — not preparing, sending or completed. */
  remove(campaignId: number, contactId: number): Promise<void> {
    return apiClient.delete<void>(
      `/api/campaigns/${campaignId}/contacts/${contactId}`,
    )
  },

  /** Take a company and everyone at it off the campaign. Same gating as `remove`.
   * Campaign-local: it doesn't stop the company reappearing in a later search
   * (that's what the exclusion list is for). */
  removeCompany(campaignId: number, companyId: number): Promise<void> {
    return apiClient.delete<void>(
      `/api/campaigns/${campaignId}/contacts/companies/${companyId}`,
    )
  },
}
