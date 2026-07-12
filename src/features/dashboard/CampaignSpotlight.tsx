import { useCallback } from "react"
import { Link } from "react-router-dom"
import { ArrowRight, AtSign, Building2, CalendarRange, Users } from "lucide-react"

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
import { Skeleton } from "@/components/ui/skeleton"
import { loadContactStats } from "@/features/campaigns/contactStats"
import { useAsync } from "@/hooks/useAsync"
import { campaignService } from "@/services/campaign.service"
import { formatDateTime } from "@/lib/format"
import type { Campaign } from "@/types/campaign"

interface Spotlight {
  campaign: Campaign
  stats: { people: number; companies: number; reachable: number }
}

/** The newest campaign plus its headline numbers, or null when none exist. */
async function loadSpotlight(): Promise<Spotlight | null> {
  const res = await campaignService.list({ limit: 100 })
  if (res.items.length === 0) return null
  const latest = [...res.items].sort((a, b) =>
    b.created_at.localeCompare(a.created_at),
  )[0]!
  const stats = await loadContactStats(latest.id)
  return { campaign: latest, stats }
}

const statTiles = [
  { key: "companies", label: "Companies", icon: Building2 },
  { key: "people", label: "People", icon: Users },
  { key: "reachable", label: "Ready to email", icon: AtSign },
] as const

/** Dashboard hero: what the most recent campaign has prepared, at a glance. */
export function CampaignSpotlight() {
  const fetcher = useCallback(loadSpotlight, [])
  const spotlight = useAsync(fetcher, [])

  if (spotlight.loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-4 w-36" />
          <Skeleton className="h-7 w-64" />
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-3">
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
        </CardContent>
      </Card>
    )
  }

  // No campaigns (or the probe failed): the dashboard's setup path covers this.
  if (spotlight.error || !spotlight.data) return null

  const { campaign, stats } = spotlight.data
  const touches = campaign.sequence_touches ?? 0

  return (
    <Card>
      <CardHeader>
        <CardDescription className="font-mono text-[11px] tracking-widest uppercase">
          Latest campaign
        </CardDescription>
        <div className="flex flex-wrap items-center gap-3">
          <CardTitle className="text-xl">{campaign.name}</CardTitle>
          {campaign.setup_completed ? (
            <Badge variant="outline">Ready</Badge>
          ) : (
            <Badge variant="secondary">Setup incomplete</Badge>
          )}
        </div>
        <CardDescription>
          {campaign.product_name ? `For ${campaign.product_name}. ` : ""}
          Created {formatDateTime(campaign.created_at)}.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-3">
          {statTiles.map((tile) => (
            <div key={tile.key} className="rounded-lg border bg-muted/40 p-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <tile.icon className="size-4" />
                {tile.label}
              </div>
              <div className="mt-1 text-3xl font-semibold tracking-tight">
                {stats[tile.key]}
              </div>
            </div>
          ))}
        </div>
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <CalendarRange className="size-4" />
          {touches > 0
            ? `${touches}-email sequence saved and ready for review.`
            : "No sequence saved yet."}
        </p>
      </CardContent>
      <CardFooter>
        <Button asChild>
          <Link to={`/campaigns/${campaign.id}`}>
            Open campaign
            <ArrowRight className="size-4" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  )
}
