import {
  Ban,
  MailOpen,
  Reply,
  Send,
  ThumbsDown,
  ThumbsUp,
} from "lucide-react"

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
 * one campaign has metrics.
 *
 * Deliberately the same six tiles as a campaign's own Performance tab, in the
 * same order — this is that view summed across campaigns, and two layouts for one
 * funnel would invite the reader to look for a difference that isn't there.
 */
export function PerformanceStrip({ campaigns }: { campaigns: Campaign[] }) {
  const ran = campaigns.filter((c) => c.metrics != null)
  if (ran.length === 0) return null

  const sent = total(ran, (m) => m.sent)
  const opens = total(ran, (m) => m.opens)
  const replies = total(ran, (m) => m.replies)
  const success = total(ran, (m) => m.success)
  const fail = total(ran, (m) => m.fail)
  const optOut = total(ran, (m) => m.opt_out)

  return (
    <section className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="text-sm font-medium text-muted-foreground">
          Performance
        </h2>
      </div>
      <p className="text-xs text-muted-foreground">
        Totals across {ran.length} run{" "}
        {ran.length === 1 ? "campaign" : "campaigns"}. Replies count prospects who
        wrote back; Success, Fail and Opt-out are how their latest reply was read.
      </p>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
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
          caption="unique prospects"
        />
        <MetricTile
          icon={Reply}
          label="Replies"
          value={formatCount(replies)}
          caption={`${rate(replies, opens)} of opens`}
          emphasis
        />
        <MetricTile
          icon={ThumbsUp}
          label="Success"
          value={formatCount(success)}
          caption={`${rate(success, replies)} of replies`}
        />
        <MetricTile
          icon={ThumbsDown}
          label="Fail"
          value={formatCount(fail)}
          caption={`${rate(fail, replies)} of replies`}
        />
        <MetricTile
          icon={Ban}
          label="Opt-out"
          value={formatCount(optOut)}
          caption={`${rate(optOut, replies)} of replies`}
        />
      </div>
    </section>
  )
}
