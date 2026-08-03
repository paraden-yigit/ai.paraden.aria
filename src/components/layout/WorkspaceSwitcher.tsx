import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Building2, Check, ChevronsUpDown, Mail } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useAuth } from "@/features/auth/useAuth"
import { ApiError } from "@/services/http"
import { roleLabel } from "@/lib/roles"

/**
 * Which workspace you're in, and how to be in a different one.
 *
 * Renders nothing at all when there is only one workspace and nothing waiting —
 * which is most people. A switcher that never has anything to switch to is just
 * chrome in the way of the product.
 */
export function WorkspaceSwitcher({ onNavigate }: { onNavigate?: () => void }) {
  const { activeWorkspace, workspaces, pendingInvitations, switchWorkspace } =
    useAuth()
  const navigate = useNavigate()
  const [switching, setSwitching] = useState(false)

  if (!activeWorkspace) return null
  if (workspaces.length <= 1 && pendingInvitations.length === 0) return null

  async function choose(clientId: number) {
    if (clientId === activeWorkspace?.client_id) return
    setSwitching(true)
    try {
      await switchWorkspace(clientId)
      // Always home, never staying put: campaign 47 exists in the workspace
      // being left and not in the one being entered, and a 404 is the worst
      // possible first impression of the feature.
      navigate("/", { replace: true })
      onNavigate?.()
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.message : "Couldn't switch workspace.",
      )
    } finally {
      setSwitching(false)
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          disabled={switching}
          className="h-auto w-full justify-start gap-2 px-2 py-1.5 text-left"
        >
          <span
            aria-hidden="true"
            className="flex size-6 shrink-0 items-center justify-center rounded bg-primary/10 text-primary"
          >
            <Building2 className="size-3.5" />
          </span>
          <span className="min-w-0 flex-1 truncate text-sm font-medium">
            {activeWorkspace.name}
          </span>
          <ChevronsUpDown className="size-3.5 shrink-0 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        <DropdownMenuLabel>Workspaces</DropdownMenuLabel>
        {workspaces.map((workspace) => (
          <DropdownMenuItem
            key={workspace.client_id}
            onClick={() => choose(workspace.client_id)}
          >
            <span className="min-w-0 flex-1">
              <span className="block truncate">{workspace.name}</span>
              <span className="block truncate text-xs text-muted-foreground">
                {roleLabel(workspace.role)}
                {workspace.team && ` · ${workspace.team.name}`}
              </span>
            </span>
            {workspace.client_id === activeWorkspace.client_id && (
              <Check className="size-4 shrink-0" />
            )}
          </DropdownMenuItem>
        ))}
        {pendingInvitations.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuLabel>Invitations</DropdownMenuLabel>
            {pendingInvitations.map((invitation) => (
              <DropdownMenuItem
                key={invitation.token}
                onClick={() => {
                  navigate(`/invite/${invitation.token}`)
                  onNavigate?.()
                }}
              >
                <Mail className="size-4" />
                <span className="truncate">{invitation.workspace_name}</span>
              </DropdownMenuItem>
            ))}
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
