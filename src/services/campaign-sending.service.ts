import type {
  CampaignSendingSummary,
  ContactSendingDetail,
} from "@/types/campaign-sending"
import { apiClient } from "./http"

/**
 * The campaign's outbound sending queue — read-only. Sending starts by itself
 * once the emails are generated; there is nothing here to trigger.
 * Methods are `this`-free so they can be passed as references.
 */
export const campaignSendingService = {
  /** How sending is going for this campaign, and why it isn't when it isn't. */
  summary(campaignId: number): Promise<CampaignSendingSummary> {
    return apiClient.get<CampaignSendingSummary>(
      `/api/campaigns/${campaignId}/sending/summary`,
    )
  },

  /** One prospect's queue position and every send attempted for them. */
  forContact(
    campaignId: number,
    contactId: number,
  ): Promise<ContactSendingDetail> {
    return apiClient.get<ContactSendingDetail>(
      `/api/campaigns/${campaignId}/sending/contacts/${contactId}`,
    )
  },
}
