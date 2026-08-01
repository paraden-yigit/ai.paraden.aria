import { Navigate, Outlet } from "react-router-dom"
import { useAuth } from "@/features/auth/useAuth"
import { landingPath } from "@/features/auth/landing"

/** Keeps already-authenticated users out of /login (sends them where they belong). */
export function PublicOnlyRoute() {
  const { user, isAuthenticated, isInitializing } = useAuth()

  if (isInitializing) return null

  if (isAuthenticated) {
    return <Navigate to={landingPath(user)} replace />
  }

  return <Outlet />
}
