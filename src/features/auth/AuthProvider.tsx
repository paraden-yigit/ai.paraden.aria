import { useCallback, useEffect, useMemo, useState } from "react"
import { authService } from "@/services/auth.service"
import { setUnauthorizedHandler } from "@/services/http"
import type { User } from "@/types/auth"
import { AuthContext, type AuthContextValue } from "./auth-context"

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isInitializing, setIsInitializing] = useState(true)

  // Bootstrap the session from the httpOnly cookies via /api/auth/me, and wire
  // the http layer so an unrecoverable session drops us back to logged-out
  // (ProtectedRoute then bounces to the marketing login).
  useEffect(() => {
    let active = true
    setUnauthorizedHandler(() => {
      if (active) setUser(null)
    })
    authService
      .me()
      .then((u) => {
        if (active) setUser(u)
      })
      .catch(() => {
        if (active) setUser(null)
      })
      .finally(() => {
        if (active) setIsInitializing(false)
      })
    return () => {
      active = false
      setUnauthorizedHandler(null)
    }
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    await authService.login(email, password)
    // Login sets the cookies; load the profile to populate session state. The
    // profile is returned as well as stored, because the caller has to decide
    // where to send them and cannot see the state update it just triggered.
    const profile = await authService.me()
    setUser(profile)
    return profile
  }, [])

  const logout = useCallback(async () => {
    try {
      await authService.logout()
    } finally {
      setUser(null)
    }
  }, [])

  const refreshUser = useCallback(async () => {
    setUser(await authService.me())
  }, [])

  const switchWorkspace = useCallback(async (clientId: number) => {
    // The API re-mints the session cookies; re-reading the profile is what
    // brings the new workspace's permissions and onboarding state with it.
    await authService.switchWorkspace(clientId)
    setUser(await authService.me())
  }, [])

  // Permissions belong to the workspace, not the person: the same user is an
  // owner in one and a sales person in another, so a page can be theirs here
  // and not there.
  const hasPermission = useCallback(
    (permission: string) =>
      user?.active_workspace?.permissions?.includes(permission) ?? false,
    [user],
  )

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: user !== null,
      isInitializing,
      activeWorkspace: user?.active_workspace ?? null,
      workspaces: user?.workspaces ?? [],
      pendingInvitations: user?.pending_invitations ?? [],
      hasPermission,
      login,
      switchWorkspace,
      logout,
      refreshUser,
    }),
    [
      user,
      isInitializing,
      hasPermission,
      login,
      switchWorkspace,
      logout,
      refreshUser,
    ],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
