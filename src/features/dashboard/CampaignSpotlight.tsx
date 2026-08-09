import { useCallback } from "react"
import { Link, useNavigate } from "react-router-dom"
import { ArrowRight, AtSign, Megaphone, Users } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { MetricTile } from "@/components/MetricTile"
import { Skeleton } from "@/components/ui/skeleton"
import { useAsync } from "@/hooks/useAsync"
import { outreachService } from "@/services/outreach.service"
import type { OutreachRun, OutreachRunStatus } from "@/types/outreach"

const STATUS_LABELS: Record<OutreachRunStatus, string> = {
  draft: "Draft",
  composing: "Writing",
  ready: "Ready to launch",
  running: "Running",
  launched: "Launched",
  failed: "Needs attention",
}

/** The newest run, or null when there are none. */
async function loadNewest(): Promise<OutreachRun | null> {
  const res = await outreachService.list({ limit: 20 })
  if (res.items.length === 0) return null
  return [...res.items].sort((a, b) =>
    b.created_at.localeCompare(a.created_at),
  )[0]!
}

/**
 * Dashboard hero: what the most recent campaign has prepared, at a glance.
 *
 * Shows the newest run rather than the newest *launched* one, because the useful
 * thing to surface is usually the one still being worked on — a half-built run
 * is the thing with an action attached to it.
 */
export function CampaignSpotlight() {
  const navigate = useNavigate()
  const fetcher = useCallback(() => loadNewest(), [])
  const { data: run, loading } = useAsync(fetcher, [])

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-4 w-36" />
          <Skeleton className="h-7 w-64" />
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
        </CardContent>
      </Card>
    )
  }

  if (!run) return null

  const unreachable = run.prospect_count - run.reachable_count

  return (
    <Card>
      <CardHeader>
        <CardDescription className="flex items-center gap-2">
          Most recent campaign
          <Badge variant={run.status === "launched" ? "default" : "outline"}>
            {STATUS_LABELS[run.status]}
          </Badge>
        </CardDescription>
        <CardTitle className="flex items-center gap-2 text-xl">
          <Megaphone className="size-5 text-muted-foreground" aria-hidden="true" />
          {run.name}
        </CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4 sm:grid-cols-2">
        <MetricTile
          icon={Users}
          label="On the list"
          value={String(run.prospect_count)}
          caption={run.product_name ?? "No product"}
        />
        <MetricTile
          icon={AtSign}
          label="Can be emailed"
          value={String(run.reachable_count)}
          caption={
            unreachable > 0
              ? `${unreachable} without an address`
              : "everyone on the list"
          }
          emphasis
        />
      </CardContent>
      <CardFooter className="gap-2">
        <Button onClick={() => navigate(`/campaigns/new?resume=${run.id}`)}>
          {run.status === "launched" ? "Review" : "Continue"}
          <ArrowRight className="size-4" />
        </Button>
        <Button variant="outline" asChild>
          <Link to="/campaigns">All campaigns</Link>
        </Button>
      </CardFooter>
    </Card>
  )
}
