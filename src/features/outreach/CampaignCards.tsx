import { Link } from "react-router-dom"

import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { formatDateTime, formatPoolSize } from "@/lib/format"
import { CampaignTypeBadge } from "./campaignTypeBadge"
import { RunStatusBadge } from "./runStatus"
import type { OutreachRun } from "@/types/outreach"

const NUMBER = new Intl.NumberFormat("en-GB")

/** One of the two figures along the bottom of a card. */
function Figure({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="truncate text-sm font-medium tabular-nums">{value}</p>
    </div>
  )
}

/**
 * Campaigns as a card grid — the same shape the products page uses, so the two
 * lists read as one app: monogram and name, then what it is aimed at, then the
 * numbers that say how big it is.
 *
 * The whole card opens the campaign. There is no menu in the corner the way
 * products have one: deleting a campaign lives on its own Settings tab, behind
 * a confirmation, and nothing else here is a one-click action.
 */
export function CampaignCards({ runs }: { runs: OutreachRun[] }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
      {runs.map((run) => (
        <Card
          key={run.id}
          className="group relative gap-4 transition-all hover:border-primary/40 hover:shadow-md"
        >
          <Link
            to={`/campaigns/${run.id}`}
            className="absolute inset-0 rounded-xl"
            aria-label={`Open ${run.name}`}
          />
          <CardHeader className="flex-row items-center gap-3 space-y-0">
            <span
              aria-hidden="true"
              className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-base font-semibold text-primary uppercase"
            >
              {run.name.charAt(0)}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium">{run.name}</p>
              <p className="truncate text-sm text-muted-foreground">
                {run.product_name ?? "No product"}
              </p>
            </div>
          </CardHeader>
          <CardContent className="flex flex-1 flex-col gap-4">
            <div className="flex flex-wrap items-center gap-2">
              <RunStatusBadge status={run.status} />
              <CampaignTypeBadge type={run.campaign_type} />
            </div>
            <div className="mt-auto grid grid-cols-2 gap-2">
              <Figure
                label="Reach"
                value={
                  // Never allocated, which is not the same as none.
                  run.monthly_reach == null
                    ? "—"
                    : `${NUMBER.format(run.monthly_reach)}/mo`
                }
              />
              <Figure
                label="Prospects"
                value={
                  run.pool_total == null ? "—" : formatPoolSize(run.pool_total)
                }
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Created {formatDateTime(run.created_at)}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
