import type { User } from "@/types/auth"

/**
 * Where a signed-in user belongs right now.
 *
 * One rule, in one place. This used to be decided independently in three —
 * `LoginForm`'s `from ?? "/"`, `PublicOnlyRoute`'s hardcoded `/`, and the
 * onboarding gate — which was survivable while the answer was always "/" and
 * stopped being so the moment a user could have no workspace selected.
 *
 * The server does the hard half: it only puts a workspace on the session when
 * there is no choice to make, so "is there one?" is the whole question here.
 */
export function landingPath(user: User | null, intended?: string): string {
  if (!user) return "/login"
  if (!user.active_workspace) return "/workspaces"
  return intended ?? "/"
}
