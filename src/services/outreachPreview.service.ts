import type { OutreachPreview, PreviewStart } from "@/types/outreach"
import { apiClient } from "./http"

/**
 * The Approach step's emails, written before the campaign exists.
 *
 * The wizard stores nothing until it is finished, so the whole brief goes in the
 * request and the answer comes back against a token to poll. Writing takes tens
 * of seconds; `start` only starts it.
 */
export const outreachPreviewService = {
  start(payload: PreviewStart): Promise<OutreachPreview> {
    return apiClient.post<OutreachPreview>("/api/outreach-previews", payload)
  },

  get(token: string): Promise<OutreachPreview> {
    return apiClient.get<OutreachPreview>(`/api/outreach-previews/${token}`)
  },
}
