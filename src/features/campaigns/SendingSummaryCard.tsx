import { useCallback, useEffect } from "react"
import { AlertCircle, Clock, Mail, Send } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { DataState } from "@/components/DataState"
import { useAsync } from "@/hooks/useAsync"
import { campaignSendingService } from "@/services/campaign-sending.service"
import { formatDateTime } from "@/lib/format"
import type { CampaignSendingSummary } from "@/types/campaign-sending"

/** Refresh cadence. The dispatcher runs every minute; this keeps roughly in step. */
const POLL_MS = 30_000

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border bg-muted/30 px-3 py-2">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-lg font-semibold tabular-nums">{value}</p>
    </div>
  )
}

/**
 * How this campaign's outreach is actually going out.
 *
 * Sending is deliberately slow — each mailbox drips a capped number of emails
 * across working hours so it doesn't read as a bot — which means a healthy
 * campaign and a stalled one look identical unless the page says which it is.
 * That is what `blocked_reason` and the per-mailbox load are here for.
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
        <CardDescription>
          {data
            ? `Each mailbox sends up to ${data.window.daily_email_count} emails a day, ` +
              `spread across ${data.window.start_time}–${data.window.end_time} ` +
              `(${data.window.timezone}), weekdays only.`
            : "How this campaign's outreach is going out."}
        </CardDescription>
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
                  No prospects are queued for sending yet. They're queued
                  automatically once this campaign's emails are generated.
                </p>
              ) : (
                <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-5">
                  <Stat label="Prospects queued" value={data.enrolled} />
                  <Stat label="In progress" value={data.active} />
                  <Stat label="Sequences finished" value={data.completed} />
                  <Stat label="Emails sent" value={data.sent_total} />
                  <Stat label="Sent today" value={data.sent_today} />
                </div>
              )}

              {data.blocked_reason && (
                <div className="flex items-start gap-2 rounded-lg border border-amber-500/40 bg-amber-500/5 px-4 py-3 text-sm">
                  <AlertCircle className="mt-0.5 size-4 shrink-0 text-amber-600" />
                  <span>{data.blocked_reason}</span>
                </div>
              )}

              {!data.blocked_reason &&
                data.active > 0 &&
                data.next_send_at && (
                  <div className="flex items-start gap-2 rounded-lg border bg-muted/40 px-4 py-3 text-sm">
                    <Clock className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                    <span>
                      Next email is eligible from{" "}
                      {formatDateTime(data.next_send_at)}. Sends are paced and
                      randomised inside the window, so the exact time will vary.
                    </span>
                  </div>
                )}

              {data.failed > 0 && (
                <p className="text-sm text-destructive">
                  {data.failed} prospect{data.failed === 1 ? "" : "s"} could not
                  be reached. Open a prospect to see why.
                </p>
              )}

              {data.mailboxes.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">
                    Today's mailbox load
                  </p>
                  <div className="space-y-1">
                    {data.mailboxes.map((mailbox) => (
                      <div
                        key={mailbox.mailbox_id}
                        className="flex flex-wrap items-center gap-2 text-sm"
                      >
                        <Mail className="size-3.5 shrink-0 text-muted-foreground" />
                        <span className="font-medium">
                          {mailbox.email ?? `Mailbox #${mailbox.mailbox_id}`}
                        </span>
                        <span className="tabular-nums text-muted-foreground">
                          {mailbox.sent_today}/{mailbox.daily_cap}
                        </span>
                        {mailbox.paused && (
                          <Badge variant="destructive">Paused</Badge>
                        )}
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Counts every campaign — the daily limit belongs to the
                    mailbox, not to this campaign.
                  </p>
                </div>
              )}
            </div>
          )}
        </DataState>
      </CardContent>
    </Card>
  )
}
