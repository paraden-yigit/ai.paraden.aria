import { buildQuery } from "@/lib/query"
import type { ListResult, PaginationParams } from "@/types/api"
import type { User } from "@/types/auth"
import type { UserRole } from "@/lib/roles"
import { apiClient } from "./http"
import { normalizeList } from "./normalizeList"

/**
 * Users service — the client's own user roster and their roles. The API scopes
 * every call to the session's client. Changing a role is owner-only (enforced
 * server-side). Methods are `this`-free so they can be passed as references.
 */
export const userService = {
  async list(params: PaginationParams = {}): Promise<ListResult<User>> {
    const data = await apiClient.get<unknown>(
      `/api/users${buildQuery({ skip: params.skip, limit: params.limit })}`,
    )
    return normalizeList<User>(data)
  },

  /** Change a user's role (owner-only). */
  setRole(id: number, role: UserRole): Promise<User> {
    return apiClient.patch<User>(`/api/users/${id}/role`, { role })
  },
}
