import type { User } from "@/types/auth"
import { apiClient } from "./http"

/**
 * Auth service — wraps the /api/auth/* endpoints. Aria has no login of its own
 * (the marketing site owns that); these cover session bootstrap and logout.
 * The session itself lives in httpOnly cookies the browser carries automatically.
 */
export const authService = {
  /** Authenticate with email + password; the API sets the session cookies. */
  async login(email: string, password: string): Promise<void> {
    // skipRefresh so a 401 (bad credentials) surfaces directly instead of
    // triggering a pointless refresh attempt.
    await apiClient.post("/api/auth/login", { email, password }, { skipRefresh: true })
  },

  /** Resolve the current session's user, or throw 401 if there is none. */
  async me(): Promise<User> {
    return apiClient.get<User>("/api/auth/me")
  },

  /** Revoke the refresh token server-side and clear the session cookies. */
  async logout(): Promise<void> {
    await apiClient.post("/api/auth/logout", undefined, { skipRefresh: true })
  },
}
