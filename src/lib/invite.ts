import { toast } from "sonner"

import { config } from "./config"
import type { ClientUser } from "@/types/user"

/** Build the invitation (set-password) link for a pending user, or null. */
export function inviteLink(
  user: Pick<ClientUser, "invitation_token">,
): string | null {
  if (!user.invitation_token) return null
  // The set-password page lives on the marketing site at /invite/<token>.
  return `${config.marketingUrl}/invite/${user.invitation_token}`
}

/** Success toast after creating a user, with a one-tap "copy invite link". */
export function notifyUserCreated(user: ClientUser) {
  const link = inviteLink(user)
  if (!link) {
    toast.success(`User "${user.full_name}" created.`)
    return
  }
  toast.success(`User "${user.full_name}" created.`, {
    description: "Share the invite link so they can set their password.",
    action: {
      label: "Copy link",
      onClick: () => void navigator.clipboard.writeText(link),
    },
  })
}
