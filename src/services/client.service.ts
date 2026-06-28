import type { Client, ClientUpdate } from "@/types/client"
import { apiClient } from "./http"

/**
 * Company-profile service — the authenticated user's own company (client). The
 * API scopes both calls to the session's client, so there's no id to pass.
 * Methods are `this`-free so they can be passed as references.
 */
export const clientService = {
  /** The current user's company profile. */
  get(): Promise<Client> {
    return apiClient.get<Client>("/api/company")
  },

  /** Update the current user's company profile. */
  update(payload: ClientUpdate): Promise<Client> {
    return apiClient.patch<Client>("/api/company", payload)
  },
}
