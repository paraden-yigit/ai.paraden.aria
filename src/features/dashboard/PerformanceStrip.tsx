import { CalendarCheck, MailOpen, Reply, Send, Target } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { MetricTile } from "@/components/MetricTile"
import type { Campaign, CampaignMetrics } from "@/types/campaign"

/** A whole-number count, thousands-separated. */
function formatCount(value: number): string {
  return value.toLocaleString()
}

/** A derived rate ``num / denom`` as a percent string (one decimal), or "n/a"
 * when the denominator is zero. */
function rate(num: number, denom: number): string {
  if (denom <= 0) return "n/a"
  return `${((num / denom) * 100).toFixed(1)}%`
}

/** Sum one metric across every campaign that has run. */
function total(
  campaigns: Campaign[],
  pick: (m: CampaignMetrics) => number,
): number {
  return campaigns.reduce(
    (sum, c) => sum + (c.metrics ? pick(c.metrics) : 0),
    0,
  )
}

/**
 * The dashboard's headline performance strip: the funnel totals across every
 * campaign the user can see that has been run. Renders nothing until at least
 * one campaign has metrics. Simulated figures for now (no sending pipeline), so
 * it carries the same "Sample data" badge as the dashboard charts; drop the
 * badge and caption when the sending layer lands.
 */
export function PerformanceStrip({ campaigns }: { campaigns: Campaign[] }) {
  const ran = campaigns.filter((c) => c.metrics != null)
  if (ran.length === 0) return null

  const sent = total(ran, (m) => m.sent)
  const opens = total(ran, (m) => m.opens)
  const replies = total(ran, (m) => m.replies)
  const leads = total(ran, (m) => m.qualified_leads)
  const meetings = total(ran, (m) => m.meetings_booked)

  return (
    <section className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="text-sm font-medium text-muted-foreground">
          Performance
        </h2>
        <Badge variant="secondary">Sample data</Badge>
      </div>
      <p className="text-xs text-muted-foreground">
        Totals across {ran.length} run{" "}
        {ran.length === 1 ? "campaign" : "campaigns"}. Nothing has been sent:
        these figures preview how results will read once sending is live.
      </p>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <MetricTile
          icon={Send}
          label="Sent"
          value={formatCount(sent)}
          caption="Emails delivered"
        />
        <MetricTile
          icon={MailOpen}
          label="Opens"
          value={formatCount(opens)}
          caption={`${rate(opens, sent)} of sent`}
        />
        <MetricTile
          icon={Reply}
          label="Replies"
          value={formatCount(replies)}
          caption={`${rate(replies, opens)} of opens`}
          emphasis
        />
        <MetricTile
          icon={Target}
          label="Qualified leads"
          value={formatCount(leads)}
          caption={`${rate(leads, replies)} of replies`}
        />
        <MetricTile
          icon={CalendarCheck}
          label="Meetings booked"
          value={formatCount(meetings)}
          caption={`${rate(meetings, leads)} of leads`}
        />
      </div>
    </section>
  )
}
