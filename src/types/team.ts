/**
 * A team within the authenticated user's client. Shape mirrors the API's
 * TeamRead. Only `name` is captured for now — more fields later.
 */
export interface Team {
  id: number
  client_id: number
  name: string
  created_at: string
  updated_at: string
}

export interface TeamCreate {
  name: string
}

export type TeamUpdate = Partial<TeamCreate>
