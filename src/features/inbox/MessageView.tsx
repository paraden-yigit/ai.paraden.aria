import { Clock, Lock } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { EmailBody } from "@/components/EmailBody"
import { formatDateTime } from "@/lib/format"
import { CATEGORY_LABEL, type InboxMessage } from "./sampleMessages"

const STEP_KIND_LABEL: Record<string, string> = {
  opener: "Opener",
  advancer: "Follow up",
  closer: "Closer",
}

/** The reading pane: who, when, the message, and where a reply would go. */
export function MessageView({ message }: { message: InboxMessage }) {
  const when =
    message.folder === "received"
      ? message.receivedAt
      : message.folder === "sent"
        ? message.sentAt
        : message.scheduledFor

  return (
    <div className="flex h-full flex-col">
      <div className="space-y-3 p-4 sm:p-6">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold tracking-tight">
            {message.subject}
          </h2>
          <p className="text-sm text-muted-foreground">
            {message.contact.name} ({message.contact.email})
          </p>
          <p className="text-sm text-muted-foreground">
            {message.contact.jobTitle}, {message.contact.company}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <Badge variant="outline">{message.campaign}</Badge>
          {message.step && (
            <Badge variant="secondary">
              {STEP_KIND_LABEL[message.step.kind] ?? message.step.kind} (
              {message.step.index} of {message.step.total})
            </Badge>
          )}
          {message.folder === "received" && message.category && (
            <Badge variant={message.isAutomated ? "outline" : "default"}>
              {CATEGORY_LABEL[message.category]}
            </Badge>
          )}
          {when && (
            <span>
              {message.folder === "outbox" ? "Scheduled for " : ""}
              {formatDateTime(when)}
            </span>
          )}
          <span>
            {message.folder === "received" ? "To " : "From "}
            {message.mailbox}
          </span>
        </div>

        {message.folder === "sent" && message.tracked === false && (
          <p className="text-xs text-muted-foreground">
            This message was sent without open tracking, so whether it was read
            is not known either way.
          </p>
        )}

        {message.folder === "outbox" && (
          <p className="flex items-start gap-2 text-sm text-muted-foreground">
            <Clock className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            Not sent yet. Sends are paced inside your sending window, so the
            exact time will vary.
          </p>
        )}
      </div>

      <Separator />

      <div className="flex-1 overflow-y-auto p-4 sm:p-6">
        <EmailBody body={message.body} />
      </div>

      {message.folder === "received" && <ReplyBox />}
    </div>
  )
}

/**
 * The reply composer, deliberately disabled.
 *
 * Yigit is building the send side; there is no endpoint for a user reply yet.
 * Showing the box gives him the shape to build against and tells the user
 * plainly where this is going, without a working-looking control that would
 * quietly drop whatever they typed.
 */
function ReplyBox() {
  return (
    <div className="border-t bg-muted/30 p-4 sm:p-6">
      <div className="space-y-2">
        <Textarea
          rows={3}
          disabled
          placeholder="Replying from here is coming soon."
          aria-label="Reply (not available yet)"
        />
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Lock className="size-3.5 shrink-0" aria-hidden="true" />
            Replying from Paraden is not wired up yet. Reply from your mailbox
            for now.
          </p>
          <Button size="sm" disabled>
            Send reply
          </Button>
        </div>
      </div>
    </div>
  )
}
