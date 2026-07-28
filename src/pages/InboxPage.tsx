import { useEffect, useMemo, useState } from "react"
import { Inbox as InboxIcon } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { cn } from "@/lib/utils"
import { MessageList } from "@/features/inbox/MessageList"
import { MessageView } from "@/features/inbox/MessageView"
import {
  INBOX_IS_SAMPLE_DATA,
  SampleDataBanner,
} from "@/features/inbox/SampleDataBanner"
import {
  FOLDERS,
  SAMPLE_MAILBOXES,
  SAMPLE_MESSAGES,
  type Folder,
  type InboxMessage,
} from "@/features/inbox/sampleMessages"

const ALL_MAILBOXES = "all"

/**
 * True at the width where the reading pane sits beside the list (Tailwind lg).
 *
 * The Sheet has to be gated in JS, not with `lg:hidden`: that would hide the
 * panel but still mount Radix's overlay, which greys out the whole desktop
 * layout behind an invisible sheet.
 */
function useIsWideLayout(): boolean {
  const [wide, setWide] = useState(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(min-width: 1024px)").matches,
  )
  useEffect(() => {
    const query = window.matchMedia("(min-width: 1024px)")
    const onChange = (event: MediaQueryListEvent) => setWide(event.matches)
    query.addEventListener("change", onChange)
    setWide(query.matches)
    return () => query.removeEventListener("change", onChange)
  }, [])
  return wide
}

/**
 * The salesperson's mail, across every campaign: what came back, what went out,
 * and what is queued to go.
 *
 * Running on sample data until the API exposes it per user. See
 * `features/inbox/sampleMessages.ts` for why, and for the types this will be
 * wired to.
 *
 * Layout is the usual mail-client split at desktop width and a Sheet below it,
 * matching how the campaign Emails tab already handles the same problem.
 */
export function InboxPage() {
  const [folder, setFolder] = useState<Folder>("received")
  const [mailbox, setMailbox] = useState<string>(ALL_MAILBOXES)
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)
  const wide = useIsWideLayout()

  const messages = useMemo(
    () =>
      SAMPLE_MESSAGES.filter(
        (m) =>
          m.folder === folder &&
          (mailbox === ALL_MAILBOXES || m.mailbox === mailbox),
      ),
    [folder, mailbox],
  )

  const counts = useMemo(() => {
    const byFolder: Record<string, number> = {}
    for (const m of SAMPLE_MESSAGES) {
      if (mailbox !== ALL_MAILBOXES && m.mailbox !== mailbox) continue
      byFolder[m.folder] = (byFolder[m.folder] ?? 0) + 1
    }
    return byFolder
  }, [mailbox])

  const selected = messages.find((m) => m.id === selectedId) ?? null

  function select(message: InboxMessage) {
    setSelectedId(message.id)
    // On a wide layout the reading pane is already on screen, so there is
    // nothing to open.
    if (!wide) setSheetOpen(true)
  }

  function changeFolder(next: Folder) {
    setFolder(next)
    setSelectedId(null)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold tracking-tight">Inbox</h2>
            {INBOX_IS_SAMPLE_DATA && (
              <Badge variant="secondary">Sample data</Badge>
            )}
          </div>
          <p className="text-muted-foreground">
            What came back, what went out, and what is queued to go.
          </p>
        </div>

        <Select value={mailbox} onValueChange={setMailbox}>
          <SelectTrigger className="w-full sm:w-72" aria-label="Filter by mailbox">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_MAILBOXES}>All mailboxes</SelectItem>
            {SAMPLE_MAILBOXES.map((address) => (
              <SelectItem key={address} value={address}>
                {address}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <SampleDataBanner />

      {/* Folders. A plain button row rather than shadcn Tabs, because the
          panel below is a two-column layout, not a tab panel. */}
      <nav className="flex gap-1 border-b" aria-label="Mail folders">
        {FOLDERS.map((f) => {
          const active = f.key === folder
          return (
            <button
              key={f.key}
              type="button"
              onClick={() => changeFolder(f.key)}
              aria-current={active ? "page" : undefined}
              className={cn(
                "-mb-px flex items-center gap-2 border-b-2 px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "border-primary text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground",
              )}
            >
              {f.label}
              <span className="rounded-full bg-muted px-2 py-0.5 text-xs tabular-nums">
                {counts[f.key] ?? 0}
              </span>
            </button>
          )
        })}
      </nav>

      {messages.length === 0 ? (
        <div className="rounded-md border border-dashed p-10 text-center text-sm text-muted-foreground">
          <InboxIcon
            className="mx-auto mb-3 size-6 opacity-60"
            aria-hidden="true"
          />
          {folder === "received"
            ? "No replies in this mailbox yet."
            : folder === "sent"
              ? "Nothing has been sent from this mailbox yet."
              : "Nothing is queued from this mailbox."}
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)]">
          <MessageList
            folder={folder}
            messages={messages}
            selectedId={selectedId}
            onSelect={select}
          />

          {/* Desktop reading pane. Below lg the same content opens in a Sheet. */}
          <div className="hidden rounded-lg border lg:block">
            {selected ? (
              <MessageView message={selected} />
            ) : (
              <p className="p-10 text-center text-sm text-muted-foreground">
                Pick a message to read it.
              </p>
            )}
          </div>
        </div>
      )}

      {!wide && (
        <Sheet open={sheetOpen && selected !== null} onOpenChange={setSheetOpen}>
          <SheetContent
            side="right"
            className="flex w-full flex-col p-0 sm:max-w-xl"
          >
            <SheetHeader className="sr-only">
              <SheetTitle>{selected?.subject ?? "Message"}</SheetTitle>
            </SheetHeader>
            {selected && <MessageView message={selected} />}
          </SheetContent>
        </Sheet>
      )}
    </div>
  )
}
