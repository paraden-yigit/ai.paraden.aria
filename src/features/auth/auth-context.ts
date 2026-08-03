import { createContext } from "react"
import type { ActiveWorkspace, PendingInvitation, User, Workspace } from "@/types/auth"

export interface AuthContextValue {
  /** The authenticated user, or null when there is no session. */
  user: User | null
  isAuthenticated: boolean
  /** True while the initial session check is running. */
  isInitializing: boolean
  /**
   * The workspace the session is working in, or null when it hasn't got one.
   * Null is a real state, not an error: the user belongs to several and hasn't
   * chosen, or belongs to none yet. `RequireWorkspace` is what acts on it.
   */
  activeWorkspace: ActiveWorkspace | null
  /** Every workspace the user belongs to (the switcher and picker read this). */
  workspaces: Workspace[]
  /** Workspaces asking them to join. */
  pendingInvitations: PendingInvitation[]
  /** True when the role held *in the active workspace* grants the permission. */
  hasPermission: (permission: string) => boolean
  /** Authenticate with email + password, load the session, and return it. */
  login: (email: string, password: string) => Promise<User>
  /** Point the session at one of the user's workspaces and reload it. */
  switchWorkspace: (clientId: number) => Promise<void>
  logout: () => Promise<void>
  /** Re-fetch the current user (e.g. after a profile edit) and update state. */
  refreshUser: () => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined)
