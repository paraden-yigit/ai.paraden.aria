import { Navigate, Outlet } from "react-router-dom"
import { useAuth } from "@/features/auth/useAuth"

/** Keeps already-authenticated users out of /login (sends them to the dashboard). */
export function PublicOnlyRoute() {
  const { isAuthenticated, isInitializing } = useAuth()

  if (isInitializing) return null

  if (isAuthenticated) {
    return <Navigate to="/" replace />
  }

  return <Outlet />
}
