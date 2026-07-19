import { config } from "@/lib/config"
import type { Client, ClientUpdate, OnboardingDraft } from "@/types/client"
import { apiClient } from "./http"

/**
 * Company-profile service — the authenticated user's own company (client). The
 * API scopes every call to the session's client, so there's no id to pass.
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

  /**
   * Crawl a company website and extract a draft profile for the onboarding
   * wizard. Synchronous on the server (crawl + one Claude call), so this can take
   * a while — callers should show a loading state.
   */
  extractOnboarding(url: string): Promise<OnboardingDraft> {
    return apiClient.post<OnboardingDraft>("/api/company/onboarding/extract", {
      url,
    })
  },

  /** Store (or replace) the company logo. */
  uploadLogo(file: File | Blob): Promise<Client> {
    const form = new FormData()
    form.append("file", file)
    return apiClient.post<Client>("/api/company/logo", form)
  },

  /**
   * Fetch the company logo as an object URL, or null if none is stored. The logo
   * endpoint needs the `X-API-Key` header (which an `<img src>` can't send), so
   * it's fetched here as a blob. Callers should `URL.revokeObjectURL` when done.
   */
  async logoObjectUrl(): Promise<string | null> {
    const response = await fetch(`${config.apiBaseUrl}/api/company/logo`, {
      headers: { "X-API-Key": config.apiKey },
      credentials: "include",
    })
    if (!response.ok) return null
    const blob = await response.blob()
    return URL.createObjectURL(blob)
  },
}
