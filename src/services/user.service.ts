import { buildQuery } from "@/lib/query"
import type { ListResult, PaginationParams } from "@/types/api"
import type { ClientUser, UserManageUpdate } from "@/types/user"
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

  /** Update a user's name, role and/or team (requires "users_manage"). */
  update(id: number, payload: UserManageUpdate): Promise<ClientUser> {
    return apiClient.patch<ClientUser>(`/api/users/${id}`, payload)
  },
}
