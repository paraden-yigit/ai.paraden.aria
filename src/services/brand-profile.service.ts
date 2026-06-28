import type { BrandProfile, BrandProfileUpdate } from "@/types/brand-profile"
import { apiClient } from "./http"

/**
 * Brand-profile service — the authenticated user's brand & email-voice answers.
 * The API scopes both calls to the session's client, so there's no id to pass.
 * Methods are `this`-free so they can be passed as references.
 */
export const brandProfileService = {
  /** The current client's brand profile (created empty on first read). */
  get(): Promise<BrandProfile> {
    return apiClient.get<BrandProfile>("/api/brand-profile")
  },

  /** Save the current client's brand-profile answers. */
  save(payload: BrandProfileUpdate): Promise<BrandProfile> {
    return apiClient.put<BrandProfile>("/api/brand-profile", payload)
  },
}
