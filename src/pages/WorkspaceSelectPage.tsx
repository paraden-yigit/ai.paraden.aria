import { useState } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import { Building2, Check, Mail } from "lucide-react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { useAuth } from "@/features/auth/useAuth"
import { ApiError } from "@/services/http"
import { roleLabel } from "@/lib/roles"

interface LocationState {
  /** Where they were heading before being asked to choose. */
  from?: { pathname: string }
}

/**
 * Choose which workspace to work in.
 *
 * Only reached when there is a choice to make — the API leaves the session
 * without a workspace exactly when a person belongs to several, or to none, so
 * a single-workspace user never sees this page.
 *
 * Deliberately outside the app shell: the sidebar and its nav are all scoped to
 * a workspace, and rendering them around a page whose whole purpose is that
 * there isn't one yet would be showing someone the inside of a room they
 * haven't picked.
 */
export function WorkspaceSelectPage() {
  const { user, workspaces, pendingInvitations, switchWorkspace } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [choosing, setChoosing] = useState<number | null>(null)

  const intended = (location.state as LocationState | null)?.from?.pathname

  async function choose(clientId: number) {
    setChoosing(clientId)
    try {
      await switchWorkspace(clientId)
      navigate(intended ?? "/", { replace: true })
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.message : "Couldn't open that workspace.",
      )
      setChoosing(null)
    }
  }

  const hasNone = workspaces.length === 0

  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-muted/30 px-6 py-12">
      <div className="w-full max-w-md space-y-6">
        <div className="space-y-1.5 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">
            {hasNone ? "No workspaces yet" : "Choose a workspace"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {hasNone
              ? `You're signed in as ${user?.email}, but you don't belong to a workspace yet.`
              : "You belong to more than one. Pick the one you want to work in."}
          </p>
        </div>

        {workspaces.length > 0 && (
          <Card className="divide-y p-0 gap-0">
            {workspaces.map((workspace) => (
              <button
                key={workspace.client_id}
                type="button"
                disabled={choosing !== null}
                onClick={() => choose(workspace.client_id)}
                className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-muted/60 disabled:opacity-60"
              >
                <span
                  aria-hidden="true"
                  className="flex size-9 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary"
                >
                  <Building2 className="size-4" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium">
                    {workspace.name}
                  </span>
                  <span className="block truncate text-sm text-muted-foreground">
                    {roleLabel(workspace.role)}
                    {workspace.team && ` · ${workspace.team.name}`}
                  </span>
                </span>
                {choosing === workspace.client_id && (
                  <Check className="size-4 shrink-0 text-muted-foreground" />
                )}
              </button>
            ))}
          </Card>
        )}

        {pendingInvitations.length > 0 && (
          <>
            {workspaces.length > 0 && <Separator />}
            <div className="space-y-2">
              <p className="text-sm font-medium">
                {workspaces.length > 0 ? "Also waiting on you" : "You've been invited"}
              </p>
              <Card className="divide-y p-0">
                {pendingInvitations.map((invitation) => (
                  <div
                    key={invitation.token}
                    className="flex items-center gap-3 px-4 py-3.5"
                  >
                    <span
                      aria-hidden="true"
                      className="flex size-9 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground"
                    >
                      <Mail className="size-4" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium">
                        {invitation.workspace_name}
                      </span>
                      <span className="block text-sm text-muted-foreground">
                        Invited as {roleLabel(invitation.role)}
                      </span>
                    </span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => navigate(`/invite/${invitation.token}`)}
                    >
                      View
                    </Button>
                  </div>
                ))}
              </Card>
            </div>
          </>
        )}

        {hasNone && pendingInvitations.length === 0 && (
          <Card className="p-4">
            <p className="text-sm text-muted-foreground">
              Someone from your company needs to invite you. If you're expecting
              an invitation, check the address it was sent to matches{" "}
              <Badge variant="secondary">{user?.email}</Badge>.
            </p>
          </Card>
        )}
      </div>
    </div>
  )
}
