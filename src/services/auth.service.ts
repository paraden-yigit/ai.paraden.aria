import { config } from "@/lib/config"
import type { PasswordResetInfo, User, UserProfileUpdate } from "@/types/auth"
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

  /** Update the current user's own profile (email voice + HTML signature). */
  async updateProfile(payload: UserProfileUpdate): Promise<User> {
    return apiClient.patch<User>("/api/auth/me", payload)
  },

  /** Store (or replace) the current user's profile picture. */
  async uploadAvatar(file: File | Blob): Promise<User> {
    const form = new FormData()
    form.append("file", file)
    return apiClient.post<User>("/api/auth/me/avatar", form)
  },

  /**
   * Fetch the current user's profile picture as an object URL, or null if none
   * is stored. The avatar endpoint needs the `X-API-Key` header (which an
   * `<img src>` can't send), so it's fetched here as a blob. Callers should
   * `URL.revokeObjectURL` when done.
   */
  async avatarObjectUrl(): Promise<string | null> {
    const response = await fetch(`${config.apiBaseUrl}/api/auth/me/avatar`, {
      headers: { "X-API-Key": config.apiKey },
      credentials: "include",
    })
    if (!response.ok) return null
    const blob = await response.blob()
    return URL.createObjectURL(blob)
  },

  /** Change the current user's own password (current password re-verified). */
  async changePassword(payload: {
    current_password: string
    new_password: string
  }): Promise<void> {
    await apiClient.post("/api/auth/me/password", payload)
  },

  /**
   * Ask for a password-reset link ("forgot password").
   *
   * Always succeeds, whether or not the address has an account — the API will
   * not say which, so the form must not either.
   */
  async requestPasswordReset(email: string): Promise<void> {
    await apiClient.post(
      "/api/auth/password-reset",
      { email },
      { skipRefresh: true },
    )
  },

  /** Check a reset link is still good before showing its form (404/410 if not). */
  async checkPasswordReset(token: string): Promise<PasswordResetInfo> {
    return apiClient.get<PasswordResetInfo>(
      `/api/auth/password-reset/${encodeURIComponent(token)}`,
      { skipRefresh: true },
    )
  },

  /** Set a new password from a reset link. Ends every existing session. */
  async resetPassword(token: string, password: string): Promise<void> {
    await apiClient.post(
      `/api/auth/password-reset/${encodeURIComponent(token)}`,
      { password },
      { skipRefresh: true },
    )
  },

  /** Revoke the refresh token server-side and clear the session cookies. */
  async logout(): Promise<void> {
    await apiClient.post("/api/auth/logout", undefined, { skipRefresh: true })
  },
}
