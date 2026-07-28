import { buildQuery } from "@/lib/query"
import type { ListResult, PaginationParams } from "@/types/api"
import type {
  ClientUser,
  UserManageCreate,
  UserManageUpdate,
} from "@/types/user"
import { apiClient } from "./http"
import { normalizeList } from "./normalizeList"

/**
 * Users service — the client's own user roster (with teams) and their roles.
 * The API scopes every call to the session's client. Editing a user is gated on
 * the "users_manage" permission, enforced server-side. Methods are `this`-free
 * so they can be passed as references.
 */
export const userService = {
  async list(params: PaginationParams = {}): Promise<ListResult<ClientUser>> {
    const data = await apiClient.get<unknown>(
      `/api/users${buildQuery({ skip: params.skip, limit: params.limit })}`,
    )
    return normalizeList<ClientUser>(data)
  },

  /** Invite a new user to the client (requires "users_manage"). */
  create(payload: UserManageCreate): Promise<ClientUser> {
    return apiClient.post<ClientUser>("/api/users/new", payload)
  },

  /**
   * Issue a fresh invitation for a pending user and email it again (requires
   * "users_manage"). This invalidates the previous link.
   */
  regenerateInvitation(id: number): Promise<ClientUser> {
    return apiClient.post<ClientUser>(`/api/users/${id}/invitation`)
  },

  /** Update a user's name, role and/or team (requires "users_manage"). */
  update(id: number, payload: UserManageUpdate): Promise<ClientUser> {
    return apiClient.patch<ClientUser>(`/api/users/${id}`, payload)
  },

  /** Soft-delete a user (requires "users_manage"). */
  remove(id: number): Promise<unknown> {
    return apiClient.delete(`/api/users/${id}`)
  },
}
