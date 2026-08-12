import { buildQuery } from "@/lib/query"
import { apiClient } from "./http"

/**
 * Place suggestions for the wizard's location fields.
 *
 * Countries ("Germany") and cities with their country ("Istanbul, Turkey"),
 * matched against our own list on the API — no provider, nothing billed, and
 * none of the 33,000 entries ever reach the browser.
 */
export const placeService = {
  suggest(query: string, signal?: AbortSignal): Promise<string[]> {
    return apiClient.get<string[]>(
      `/api/places/suggest${buildQuery({ query })}`,
      { signal },
    )
  },
}
