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
    // Login sets the cookies; load the profile to populate session state.
    setUser(await authService.me())
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

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: user !== null,
      isInitializing,
      login,
      logout,
      refreshUser,
    }),
    [user, isInitializing, login, logout, refreshUser],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
