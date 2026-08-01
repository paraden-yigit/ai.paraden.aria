import { Copy, Send, X } from "lucide-react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { inviteLink, isOpen } from "@/lib/invite"
import { roleLabel } from "@/lib/roles"
import { formatDateTime } from "@/lib/format"
import type { WorkspaceInvitation } from "@/types/invitation"

const STATUS_LABEL: Record<string, string> = {
  pending: "Waiting",
  declined: "Declined",
  revoked: "Withdrawn",
  expired: "Expired",
}

/**
 * Invitations this workspace has sent and not yet had taken up.
 *
 * Separate from the roster because an invitee is not a member — nobody appears
 * above until they have accepted. Declined and withdrawn ones stay listed:
 * someone waiting on a colleague should learn the answer was no rather than
 * assume the email went astray, and re-inviting is one click either way.
 *
 * Renders nothing when there are none, so a workspace with everyone already in
 * it doesn't carry an empty card around.
 */
export function InvitationsCard({
  invitations,
  resendingId,
  onResend,
  onRevoke,
}: {
  invitations: WorkspaceInvitation[]
  resendingId: number | null
  onResend: (invitation: WorkspaceInvitation) => void
  onRevoke: (invitation: WorkspaceInvitation) => void
}) {
  if (invitations.length === 0) return null

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Invitations</CardTitle>
        <CardDescription>
          People who have been invited but haven't joined yet.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-1">
        {invitations.map((invitation) => (
          <div
            key={invitation.id}
            className="flex flex-wrap items-center gap-3 rounded-md px-2 py-2.5 hover:bg-muted/50"
          >
            <span className="min-w-0 flex-1">
              <span className="block truncate font-medium">{invitation.email}</span>
              <span className="block text-sm text-muted-foreground">
                {roleLabel(invitation.role)} ·{" "}
                {isOpen(invitation)
                  ? `expires ${formatDateTime(invitation.expires_at)}`
                  : formatDateTime(invitation.responded_at)}
              </span>
            </span>
            <Badge variant={isOpen(invitation) ? "secondary" : "outline"}>
              {STATUS_LABEL[invitation.status] ?? invitation.status}
            </Badge>
            <span className="flex items-center gap-1">
              {isOpen(invitation) && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8"
                  title="Copy invite link"
                  onClick={() => {
                    void navigator.clipboard.writeText(inviteLink(invitation))
                    toast.success("Invite link copied.")
                  }}
                >
                  <Copy className="size-4" />
                  <span className="sr-only">Copy invite link</span>
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                disabled={resendingId === invitation.id}
                onClick={() => onResend(invitation)}
              >
                <Send className="size-4" />
                {resendingId === invitation.id ? "Sending…" : "Re-send"}
              </Button>
              {isOpen(invitation) && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8"
                  title="Withdraw invitation"
                  onClick={() => onRevoke(invitation)}
                >
                  <X className="size-4" />
                  <span className="sr-only">Withdraw invitation</span>
                </Button>
              )}
            </span>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
