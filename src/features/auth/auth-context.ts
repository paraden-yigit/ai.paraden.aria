import { createContext } from "react"
import type { User } from "@/types/auth"

export interface AuthContextValue {
  /** The authenticated user, or null when there is no session. */
  user: User | null
  isAuthenticated: boolean
  /** True while the initial session check is running. */
  isInitializing: boolean
  /** True when the current user's role grants the given permission key. */
  hasPermission: (permission: string) => boolean
  /** Authenticate with email + password and load the session. */
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  /** Re-fetch the current user (e.g. after a profile edit) and update state. */
  refreshUser: () => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined)
