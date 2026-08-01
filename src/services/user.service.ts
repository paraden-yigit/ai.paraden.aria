import { buildQuery } from "@/lib/query"
import type { ListResult, PaginationParams } from "@/types/api"
import type { WorkspaceInvitation } from "@/types/invitation"
import type {
  ClientUser,
  UserManageCreate,
  UserManageUpdate,
} from "@/types/user"
import { apiClient } from "./http"
import { normalizeList } from "./normalizeList"

/**
 * Users service — the current workspace's roster: who belongs to it, in what
 * role, on which teams. The API scopes every call to the session's workspace.
 * Editing is gated on "users_manage", enforced server-side. Methods are
 * `this`-free so they can be passed as references.
 *
 * Inviting lives here too, because that is where it is done from, but it returns
 * an invitation rather than a user — nobody joins the roster until they accept.
 * Answering invitations is `invitationService`.
 */
export const userService = {
  async list(params: PaginationParams = {}): Promise<ListResult<ClientUser>> {
    const data = await apiClient.get<unknown>(
      `/api/users${buildQuery({ skip: params.skip, limit: params.limit })}`,
    )
    return normalizeList<ClientUser>(data)
  },

  /** Invite an address into this workspace (requires "users_manage"). */
  create(payload: UserManageCreate): Promise<WorkspaceInvitation> {
    return apiClient.post<WorkspaceInvitation>("/api/users/new", payload)
  },

  /** Update a user's name, role and/or team (requires "users_manage"). */
  update(id: number, payload: UserManageUpdate): Promise<ClientUser> {
    return apiClient.patch<ClientUser>(`/api/users/${id}`, payload)
  },

  /** Remove someone from this workspace (requires "users_manage"). */
  remove(id: number): Promise<unknown> {
    return apiClient.delete(`/api/users/${id}`)
  },
}
