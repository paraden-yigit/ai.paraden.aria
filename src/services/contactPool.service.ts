import type { ContactPoolFilters, ContactPoolSize } from "@/types/outreach"
import { apiClient } from "./http"

/**
 * How many contacts the wizard's profile would reach.
 *
 * A POST because the profile is a body — and because every call is a billed
 * provider search, so callers should send one per pause in typing, not one per
 * keystroke (see `useContactPoolSize`).
 */
export const contactPoolService = {
  size(
    filters: ContactPoolFilters,
    signal?: AbortSignal,
  ): Promise<ContactPoolSize> {
    return apiClient.post<ContactPoolSize>("/api/contact-pool/size", filters, {
      signal,
    })
  },
}
