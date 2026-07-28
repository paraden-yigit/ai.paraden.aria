import { Clock, Mail, MailOpen } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { formatDateTime } from "@/lib/format"
import {
  CATEGORY_LABEL,
  type Folder,
  type InboxMessage,
} from "./sampleMessages"

/** Two initials for the avatar circle, matching the campaign Emails tab. */
function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return "?"
  const first = parts[0][0]
  const last = parts.length > 1 ? parts[parts.length - 1][0] : ""
  return (first + last).toUpperCase()
}

/** The timestamp that matters for this folder. */
function stamp(message: InboxMessage): string | null {
  const value =
    message.folder === "received"
      ? message.receivedAt
      : message.folder === "sent"
        ? message.sentAt
        : message.scheduledFor
  return value ? formatDateTime(value) : null
}

export function MessageList({
  folder,
  messages,
  selectedId,
  onSelect,
}: {
  folder: Folder
  messages: InboxMessage[]
  selectedId: number | null
  onSelect: (message: InboxMessage) => void
}) {
  return (
    // The panel that scrolls this list owns the border and the corners.
    <ul className="divide-y">
      {messages.map((message) => {
        const selected = message.id === selectedId
        const when = stamp(message)
        return (
          <li key={message.id}>
            <button
              type="button"
              onClick={() => onSelect(message)}
              aria-current={selected ? "true" : undefined}
              className={cn(
                "flex w-full items-start gap-3 px-3 py-3 text-left transition-colors",
                selected ? "bg-muted" : "hover:bg-muted/50",
              )}
            >
              <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium">
                {initials(message.contact.name)}
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-baseline justify-between gap-2">
                  <span className="truncate text-sm font-medium">
                    {message.contact.name}
                  </span>
                  {when && (
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {when}
                    </span>
                  )}
                </span>
                <span className="mt-0.5 block truncate text-sm">
                  {message.subject}
                </span>
                <span className="mt-1 flex flex-wrap items-center gap-2">
                  <span className="truncate text-xs text-muted-foreground">
                    {message.contact.company}
                  </span>
                  {folder === "received" && message.category && (
                    <Badge
                      variant={
                        message.isAutomated
                          ? "outline"
                          : message.category === "success"
                            ? "default"
                            : "secondary"
                      }
                    >
                      {CATEGORY_LABEL[message.category]}
                    </Badge>
                  )}
                  {folder === "sent" && <SentState message={message} />}
                  {folder === "outbox" && (
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="size-3.5" aria-hidden="true" />
                      Queued
                    </span>
                  )}
                </span>
              </span>
            </button>
          </li>
        )
      })}
    </ul>
  )
}

/**
 * Open state for a sent message.
 *
 * An untracked message says so rather than reporting "not opened": the pixel
 * was never in the message, so nothing was ever going to be recorded, and
 * calling that "not opened" would be a claim we cannot make.
 */
function SentState({ message }: { message: InboxMessage }) {
  if (message.tracked === false) {
    return (
      <span className="text-xs text-muted-foreground">Opens not tracked</span>
    )
  }
  if (message.firstOpenedAt) {
    return (
      <span className="flex items-center gap-1 text-xs text-muted-foreground">
        <MailOpen className="size-3.5" aria-hidden="true" />
        Opened
        {(message.openCount ?? 0) > 1 && ` ${message.openCount} times`}
      </span>
    )
  }
  return (
    <span className="flex items-center gap-1 text-xs text-muted-foreground">
      <Mail className="size-3.5" aria-hidden="true" />
      Not opened yet
    </span>
  )
}
