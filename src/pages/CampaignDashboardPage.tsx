import { useCallback } from "react"
import { Link, useLocation } from "react-router-dom"
import {
  AtSign,
  Building2,
  CalendarRange,
  Package,
  PartyPopper,
  Users,
} from "lucide-react"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { DataState } from "@/components/DataState"
import { SavedSequence } from "@/features/campaigns/SavedSequence"
import { useAsync } from "@/hooks/useAsync"
import { useCampaignContext } from "@/features/campaigns/useCampaignContext"
import { campaignContactService } from "@/services/campaign-contact.service"
import { campaignEmailService } from "@/services/campaign-email.service"
import { formatDateTime } from "@/lib/format"
import type { CampaignContact } from "@/types/campaign-contact"

// The contacts/list endpoint caps a page at 200; loop pages (same pattern as
// the Contacts tab) so the counts cover everyone in the campaign.
const PAGE_SIZE = 200
const MAX_PAGES = 25

interface ContactStats {
  people: number
  companies: number
  reachable: number
}

async function loadContactStats(campaignId: number): Promise<ContactStats> {
  const all: CampaignContact[] = []
  for (let pageIdx = 0; pageIdx < MAX_PAGES; pageIdx++) {
    const res = await campaignContactService.list(campaignId, {
      skip: pageIdx * PAGE_SIZE,
      limit: PAGE_SIZE,
    })
    all.push(...res.items)
    const total = res.total ?? all.length
    if (res.items.length === 0 || all.length >= total) break
  }
  const companies = new Set(
    all.map((c) => c.company_domain ?? c.company_name ?? `contact-${c.id}`),
  )
  return {
    people: all.length,
    companies: companies.size,
    reachable: all.filter((c) => !!c.email?.trim()).length,
  }
}

/** Total span of the sequence in working days (sum of the configured gaps). */
function sequenceSpanDays(gaps: (number | null)[]): number {
  return gaps.reduce<number>((sum, gap) => sum + (gap ?? 0), 0)
}

export function CampaignDashboardPage() {
  const { campaign } = useCampaignContext()
  const location = useLocation()
  const justCompleted = Boolean(
    (location.state as { justCompleted?: boolean } | null)?.justCompleted,
  )

  const statsFetcher = useCallback(
    () => loadContactStats(campaign.id),
    [campaign.id],
  )
  const emailsFetcher = useCallback(
    () => campaignEmailService.saved(campaign.id),
    [campaign.id],
  )
  const stats = useAsync(statsFetcher, [campaign.id])
  const emails = useAsync(emailsFetcher, [campaign.id])

  const touches = campaign.sequence_touches ?? emails.data?.length ?? 0
  const spanDays = sequenceSpanDays([
    campaign.sequence_advancer_gap,
    campaign.sequence_closer_gap,
  ])
  const spanWeeks = Math.max(1, Math.round(spanDays / 5))

  return (
    <div className="space-y-6">
      {justCompleted && (
        <Card className="border-primary/30 bg-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PartyPopper className="size-5" />
              Your campaign is ready.
            </CardTitle>
            <CardDescription>
              ARIA has researched your prospects and drafted your outreach.
              Everything below is yours to review and refine: nothing is final
              until you decide it is.
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      <div>
        <h2 className="text-lg font-semibold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground">
          Everything this campaign has prepared, in one place.
        </p>
      </div>

      <DataState
        loading={stats.loading}
        error={stats.error}
        isEmpty={false}
        emptyMessage="No contact data yet."
        onRetry={stats.refetch}
        skeletonRows={2}
      >
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <Building2 className="size-4" />
                Companies
              </CardDescription>
              <CardTitle className="text-3xl">
                {stats.data?.companies ?? 0}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              That your prospects work at.
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <Users className="size-4" />
                People
              </CardDescription>
              <CardTitle className="text-3xl">
                {stats.data?.people ?? 0}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Prospects across those companies.
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <AtSign className="size-4" />
                Ready to email
              </CardDescription>
              <CardTitle className="text-3xl">
                {stats.data?.reachable ?? 0}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              {stats.data && stats.data.reachable === 0
                ? "Prospects found by discovery arrive without email addresses. Contacts you upload include theirs."
                : "Prospects with an email address on file."}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <CalendarRange className="size-4" />
                Sequence
              </CardDescription>
              <CardTitle className="text-3xl">
                {touches > 0 ? `${touches} emails` : "Not set"}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              {touches > 0
                ? `Spread over about ${spanWeeks} ${spanWeeks === 1 ? "week" : "weeks"}.`
                : "Finish setup to configure the sequence."}
            </CardContent>
          </Card>
        </div>
      </DataState>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Your outreach sequence</CardTitle>
            <CardDescription>
              The emails ARIA drafted and you approved, in sending order.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DataState
              loading={emails.loading}
              error={emails.error}
              isEmpty={(emails.data?.length ?? 0) === 0}
              emptyMessage={
                campaign.setup_completed
                  ? "No emails are saved for this campaign."
                  : "No emails saved yet. Finish this campaign's setup from the campaigns list to draft and approve them."
              }
              onRetry={emails.refetch}
              skeletonRows={3}
            >
              {emails.data && (
                <SavedSequence campaign={campaign} emails={emails.data} />
              )}
            </DataState>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>What happens next</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <p>
                <Link
                  to={`/campaigns/${campaign.id}/contacts`}
                  className="font-medium underline underline-offset-4"
                >
                  Review your prospect list
                </Link>
                <span className="text-muted-foreground">
                  {" "}
                  and remove anyone who does not fit.
                </span>
              </p>
              {campaign.product_id != null && (
                <p>
                  <Link
                    to={`/products/${campaign.product_id}?tab=icp`}
                    className="font-medium underline underline-offset-4"
                  >
                    Tighten your targeting
                  </Link>
                  <span className="text-muted-foreground">
                    {" "}
                    if the companies found are not quite right.
                  </span>
                </p>
              )}
              <p>
                <Link
                  to="/exclusions"
                  className="font-medium underline underline-offset-4"
                >
                  Keep your do-not-contact list current
                </Link>
                <span className="text-muted-foreground">
                  {" "}
                  so nobody you exclude is ever approached.
                </span>
              </p>
              <p className="border-t pt-3 text-muted-foreground">
                Your sequence and prospect list stay saved here, ready whenever
                you need them.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="size-4" />
                Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {campaign.product_id != null ? (
                <p>
                  <span className="text-muted-foreground">Product: </span>
                  <Link
                    to={`/products/${campaign.product_id}`}
                    className="font-medium underline underline-offset-4"
                  >
                    {campaign.product_name ?? "View product"}
                  </Link>
                </p>
              ) : (
                <p className="text-muted-foreground">No product linked.</p>
              )}
              <p className="text-muted-foreground">
                Created {formatDateTime(campaign.created_at)}
              </p>
              <p className="text-muted-foreground">
                Updated {formatDateTime(campaign.updated_at)}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
