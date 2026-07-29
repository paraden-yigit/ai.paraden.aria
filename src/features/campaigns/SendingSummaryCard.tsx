import { useCallback, useEffect } from "react"
import { AlertCircle, Clock, Mail, Send, SlidersHorizontal } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { DataState } from "@/components/DataState"
import { Disclosure } from "@/components/Disclosure"
import { useAsync } from "@/hooks/useAsync"
import { campaignSendingService } from "@/services/campaign-sending.service"
import { formatDateTime } from "@/lib/format"
import type { CampaignSendingSummary } from "@/types/campaign-sending"

/** Refresh cadence. The dispatcher runs every minute; this keeps roughly in step. */
const POLL_MS = 30_000

/**
 * Progress through the prospect list, as one bar rather than three counts.
 *
 * Finished and in-progress are drawn as proportions of everyone enrolled; the
 * remainder is prospects not yet started. The numbers are written underneath in
 * words, so the bar carries the shape and the sentence carries the detail.
 */
function SendingProgress({ data }: { data: CampaignSendingSummary }) {
  const total = Math.max(data.enrolled, 1)
  const donePct = (data.completed / total) * 100
  const activePct = (data.active / total) * 100
  const notStarted = Math.max(
    data.enrolled - data.completed - data.active - data.failed - data.paused,
    0,
  )

  const parts: string[] = []
  if (data.completed > 0) parts.push(`${data.completed} finished`)
  if (data.active > 0) parts.push(`${data.active} part way through`)
  if (notStarted > 0) parts.push(`${notStarted} not started`)
  if (data.paused > 0) parts.push(`${data.paused} paused`)
  if (data.failed > 0) parts.push(`${data.failed} could not be reached`)

  return (
    <div className="space-y-2">
      <div
        className="flex h-2 w-full overflow-hidden rounded-full bg-muted"
        role="img"
        aria-label={`${data.completed} of ${data.enrolled} prospects have finished their sequence.`}
      >
        <div className="bg-primary" style={{ width: `${donePct}%` }} />
        <div className="bg-primary/40" style={{ width: `${activePct}%` }} />
      </div>
      <p className="text-sm text-muted-foreground">
        <span className="font-medium tabular-nums text-foreground">
          {data.enrolled}
        </span>{" "}
        {data.enrolled === 1 ? "prospect" : "prospects"} in the queue
        {parts.length > 0 && <>: {parts.join(", ")}</>}.
      </p>
    </div>
  )
}

/**
 * How this campaign's outreach is actually going out.
 *
 * Sending is deliberately slow: each mailbox drips a capped number of emails
 * across working hours so it doesn't read as a bot, which means a healthy
 * campaign and a stalled one look identical unless the page says which it is.
 * That is what `blocked_reason` and the per-mailbox load are here for.
 *
 * Progress leads, because that is the question the page is asked. The send
 * window, the per-mailbox load and the pacing note are all real answers to
 * "why has nothing gone out in the last hour", but they are follow-up
 * questions, so they sit behind a disclosure. The raw send counts that used to
 * sit here are gone: they were the same figure as the Sent tile below, read
 * from a different endpoint.
 */
export function SendingSummaryCard({ campaignId }: { campaignId: number }) {
  const fetcher = useCallback(
    () => campaignSendingService.summary(campaignId),
    [campaignId],
  )
  const { data, loading, error, refetch } = useAsync<CampaignSendingSummary>(
    fetcher,
    [campaignId],
  )

  useEffect(() => {
    const timer = setInterval(refetch, POLL_MS)
    return () => clearInterval(timer)
  }, [refetch])

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Send className="size-4" />
          Sending
        </CardTitle>
      </CardHeader>
      <CardContent>
        <DataState
          loading={loading}
          error={error}
          isEmpty={!data}
          emptyMessage="No sending data yet."
          onRetry={refetch}
          skeletonRows={2}
        >
          {data && (
            <div className="space-y-4">
              {data.enrolled === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No prospects are queued for sending yet. They are queued
                  automatically once this campaign's emails are generated.
                </p>
              ) : (
                <SendingProgress data={data} />
              )}

              {data.blocked_reason && (
                <div className="flex items-start gap-2 rounded-lg border border-amber-500/40 bg-amber-500/5 px-4 py-3 text-sm">
                  <AlertCircle className="mt-0.5 size-4 shrink-0 text-amber-600" />
                  <span>{data.blocked_reason}</span>
                </div>
              )}

              {/* The count is already in the progress sentence; this keeps the
                  bit the count cannot carry, which is what to do about it. */}
              {data.failed > 0 && (
                <p className="text-sm text-destructive">
                  Open a prospect on the Contacts tab to see why they could not
                  be reached.
                </p>
              )}

              {!data.blocked_reason && data.active > 0 && data.next_send_at && (
                <p className="flex items-start gap-2 text-sm text-muted-foreground">
                  <Clock className="mt-0.5 size-4 shrink-0" />
                  <span>
                    Next email is eligible from{" "}
                    {formatDateTime(data.next_send_at)}.
                  </span>
                </p>
              )}

              <Disclosure
                id={`sending-detail-${campaignId}`}
                label="How sending is paced"
                icon={SlidersHorizontal}
              >
                <div className="space-y-3 text-sm text-muted-foreground">
                  <p>
                    Each mailbox sends up to {data.window.daily_email_count}{" "}
                    emails a day, spread across {data.window.start_time} to{" "}
                    {data.window.end_time} ({data.window.timezone}), weekdays
                    only. Sends are paced and randomised inside that window, so
                    the exact time varies.
                  </p>

                  {data.mailboxes.length > 0 && (
                    <div className="space-y-1">
                      <p className="font-medium text-foreground">
                        Today's mailbox load
                      </p>
                      {data.mailboxes.map((mailbox) => (
                        <div
                          key={mailbox.mailbox_id}
                          className="flex flex-wrap items-center gap-2"
                        >
                          <Mail className="size-3.5 shrink-0" />
                          <span className="font-medium text-foreground">
                            {mailbox.email ?? `Mailbox #${mailbox.mailbox_id}`}
                          </span>
                          <span className="tabular-nums">
                            {mailbox.sent_today}/{mailbox.daily_cap}
                          </span>
                          {mailbox.paused && (
                            <Badge variant="destructive">Paused</Badge>
                          )}
                        </div>
                      ))}
                      <p className="text-xs">
                        Counts every campaign: the daily limit belongs to the
                        mailbox, not to this campaign.
                      </p>
                    </div>
                  )}
                </div>
              </Disclosure>
            </div>
          )}
        </DataState>
      </CardContent>
    </Card>
  )
}
