import { buildQuery } from "@/lib/query"
import type { ListResult, PaginationParams } from "@/types/api"
import type { Team, TeamCreate, TeamUpdate } from "@/types/team"
import type { User } from "@/types/auth"
import { apiClient } from "./http"
import { normalizeList } from "./normalizeList"

/**
 * Teams service — wraps the user-scoped /api/teams endpoints. The API scopes
 * every call to the session's client, so there's no client_id to pass. Methods
 * are `this`-free so they can be passed as references.
 */
export const teamService = {
  async list(params: PaginationParams = {}): Promise<ListResult<Team>> {
    const data = await apiClient.get<unknown>(
      `/api/teams${buildQuery({ skip: params.skip, limit: params.limit })}`,
    )
    return normalizeList<Team>(data)
  },

  get(id: number): Promise<Team> {
    return apiClient.get<Team>(`/api/teams/${id}`)
  },

  create(payload: TeamCreate): Promise<Team> {
    return apiClient.post<Team>("/api/teams/new", payload)
  },

  update(id: number, payload: TeamUpdate): Promise<Team> {
    return apiClient.patch<Team>(`/api/teams/${id}`, payload)
  },

  remove(id: number): Promise<unknown> {
    return apiClient.delete(`/api/teams/${id}`)
  },

  /** Users who are members of the team. */
  listMembers(teamId: number): Promise<User[]> {
    return apiClient.get<User[]>(`/api/teams/${teamId}/members`)
  },

  /** The client's users who are not yet on the team (candidates to add). */
  listAvailableUsers(teamId: number): Promise<User[]> {
    return apiClient.get<User[]>(`/api/teams/${teamId}/available-users`)
  },

  addMember(teamId: number, userId: number): Promise<User> {
    return apiClient.post<User>(`/api/teams/${teamId}/members`, { user_id: userId })
  },

  removeMember(teamId: number, userId: number): Promise<unknown> {
    return apiClient.delete(`/api/teams/${teamId}/members/${userId}`)
  },
}
