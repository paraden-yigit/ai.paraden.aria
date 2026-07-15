import { useState } from "react"
import { Link } from "react-router-dom"
import { CheckCircle2, Loader2, Package, Play } from "lucide-react"
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
import { formatDateTime } from "@/lib/format"
import { ApiError } from "@/services/http"
import { campaignService } from "@/services/campaign.service"
import type { CampaignMetrics, CampaignStatus } from "@/types/campaign"
import { useCampaignContext } from "@/features/campaigns/useCampaignContext"

const STATUS_LABEL: Record<CampaignStatus, string> = {
  draft: "Draft",
  running: "Running",
  completed: "Completed",
}

const STATUS_VARIANT: Record<
  CampaignStatus,
  "secondary" | "default" | "outline"
> = {
  draft: "secondary",
  running: "default",
  completed: "outline",
}

/** A whole-number count, thousands-separated. */
function formatCount(value: number): string {
  return value.toLocaleString()
}

/** A derived rate ``num / denom`` as a percent string (one decimal), or "—"
 * when the denominator is zero. */
function rate(num: number, denom: number): string {
  if (denom <= 0) return "—"
  return `${((num / denom) * 100).toFixed(1)}%`
}

/** One metric stat tile: a headline count with a derived-rate caption. The
 * North Star metric (replies) is emphasised with a primary ring. */
function StatTile({
  label,
  value,
  caption,
  emphasis = false,
}: {
  label: string
  value: string
  caption: string
  emphasis?: boolean
}) {
  return (
    <Card className={emphasis ? "border-primary/60 bg-primary/5" : undefined}>
      <CardContent className="space-y-1 p-4">
        <div className="text-xs font-medium text-muted-foreground">{label}</div>
        <div className="text-2xl font-semibold tabular-nums tracking-tight">
          {value}
        </div>
        <div className="text-xs text-muted-foreground">{caption}</div>
      </CardContent>
    </Card>
  )
}

/** The nine campaign metrics as a stat-tile grid. Counts are stored; the
 * percentage rates are derived here from their funnel denominators. */
function MetricsGrid({ metrics }: { metrics: CampaignMetrics }) {
  const tiles = [
    {
      label: "Sent",
      value: formatCount(metrics.sent),
      caption: "Emails delivered",
    },
    {
      label: "Opens",
      value: formatCount(metrics.opens),
      caption: `${rate(metrics.opens, metrics.sent)} of sent`,
    },
    {
      label: "Clicks",
      value: formatCount(metrics.clicks),
      caption: `${rate(metrics.clicks, metrics.opens)} of opens`,
    },
    {
      label: "Replies",
      value: formatCount(metrics.replies),
      caption: `${rate(metrics.replies, metrics.opens)} of opens`,
      emphasis: true,
    },
    {
      label: "Bounces",
      value: formatCount(metrics.bounces),
      caption: `${rate(metrics.bounces, metrics.sent)} of sent`,
    },
    {
      label: "Unsubscribes",
      value: formatCount(metrics.unsubscribes),
      caption: `${rate(metrics.unsubscribes, metrics.opens)} of opens`,
    },
    {
      label: "Sequence completion",
      value: `${metrics.sequence_completion_rate}%`,
      caption: "Completed the full sequence",
    },
    {
      label: "Qualified leads",
      value: formatCount(metrics.qualified_leads),
      caption: `${rate(metrics.qualified_leads, metrics.replies)} of replies`,
    },
    {
      label: "Meetings booked",
      value: formatCount(metrics.meetings_booked),
      caption: `${rate(metrics.meetings_booked, metrics.qualified_leads)} of leads`,
    },
  ]

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {tiles.map((tile) => (
        <StatTile key={tile.label} {...tile} />
      ))}
    </div>
  )
}

export function CampaignDashboardPage() {
  const { campaign, refetch } = useCampaignContext()
  const [busy, setBusy] = useState(false)

  const act = async (action: "run" | "complete") => {
    setBusy(true)
    try {
      await campaignService[action](campaign.id)
      toast.success(
        action === "run" ? "Campaign is now running." : "Campaign completed.",
      )
      refetch()
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.message : "Something went wrong.",
      )
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold tracking-tight">Dashboard</h2>
            <Badge variant={STATUS_VARIANT[campaign.status]}>
              {STATUS_LABEL[campaign.status]}
            </Badge>
          </div>
          <p className="text-muted-foreground">An overview of this campaign.</p>
        </div>

        {/* Draft → Run; Running → Complete; Completed → no action. */}
        {campaign.status === "draft" && (
          <Button onClick={() => act("run")} disabled={busy}>
            {busy ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Play className="size-4" />
            )}
            Run campaign
          </Button>
        )}
        {campaign.status === "running" && (
          <Button
            variant="outline"
            onClick={() => act("complete")}
            disabled={busy}
          >
            {busy ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <CheckCircle2 className="size-4" />
            )}
            Complete campaign
          </Button>
        )}
      </div>

      {campaign.metrics && (
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-muted-foreground">
            Performance
          </h3>
          <MetricsGrid metrics={campaign.metrics} />
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Overview</CardTitle>
            <CardDescription>Campaign details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-1 text-sm text-muted-foreground">
            <div>Created {formatDateTime(campaign.created_at)}</div>
            <div>Updated {formatDateTime(campaign.updated_at)}</div>
          </CardContent>
        </Card>

        {campaign.product_id != null ? (
          <Link to={`/products/${campaign.product_id}`} className="block">
            <Card className="h-full transition-colors hover:bg-accent/40">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="size-4" />
                  Product
                </CardTitle>
                <CardDescription>The product this campaign promotes</CardDescription>
              </CardHeader>
              <CardContent className="text-sm font-medium text-foreground">
                {campaign.product_name ?? "—"}
              </CardContent>
            </Card>
          </Link>
        ) : (
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="size-4" />
                Product
              </CardTitle>
              <CardDescription>The product this campaign promotes</CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              No product linked.
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
