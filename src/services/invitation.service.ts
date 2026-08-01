import { apiClient } from "./http"
import type { Invitation, InvitationRegister, WorkspaceInvitation } from "@/types/invitation"

/**
 * The invitation flow, which straddles signed-out and signed-in.
 *
 * Looking one up needs no session — whoever clicked the link may not have an
 * account yet. Answering one always does: an invitation is addressed to a
 * person, and there is no way to know it is them until they have signed in.
 */
export const invitationService = {
  /** Describe an invitation, so its page can decide what to show. */
  async get(token: string): Promise<Invitation> {
    // skipRefresh: there may be no session at all, and a 401 here would
    // otherwise trigger a pointless refresh attempt.
    return apiClient.get<Invitation>(`/api/invitations/${token}`, {
      skipRefresh: true,
    })
  },

  /**
   * Create the account the invitation is addressed to and sign in. Does *not*
   * join the workspace — that is the next, separate decision.
   */
  async register(token: string, payload: InvitationRegister): Promise<void> {
    await apiClient.post(`/api/invitations/${token}/register`, payload, {
      skipRefresh: true,
    })
  },

  /** Join the workspace. The API switches the session into it. */
  async accept(token: string): Promise<void> {
    await apiClient.post(`/api/invitations/${token}/accept`)
  },

  async decline(token: string): Promise<void> {
    await apiClient.post(`/api/invitations/${token}/decline`)
  },

  /** The invitations this workspace has sent (owner-facing). */
  async listForWorkspace(): Promise<WorkspaceInvitation[]> {
    return apiClient.get<WorkspaceInvitation[]>("/api/users/invitations")
  },

  async resend(invitationId: number): Promise<WorkspaceInvitation> {
    return apiClient.post<WorkspaceInvitation>(
      `/api/users/invitations/${invitationId}/resend`,
    )
  },

  async revoke(invitationId: number): Promise<void> {
    await apiClient.delete(`/api/users/invitations/${invitationId}`)
  },
}
