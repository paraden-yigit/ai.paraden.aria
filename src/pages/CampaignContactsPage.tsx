import { useCallback, useEffect, useRef, useState } from "react"
import { Link } from "react-router-dom"
import {
  ExternalLink,
  Loader2,
  RefreshCw,
  Sparkles,
  TriangleAlert,
  Users,
} from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { PaginationFooter } from "@/components/PaginationFooter"
import { useCampaignContext } from "@/features/campaigns/useCampaignContext"
import { usePaginatedList } from "@/hooks/usePaginatedList"
import { icpService } from "@/services/icp.service"
import { campaignContactService } from "@/services/campaign-contact.service"
import { ApiError } from "@/services/http"
import type { ListResult, PaginationParams } from "@/types/api"
import type { Icp } from "@/types/icp"
import type {
  CampaignContact,
  CampaignContactSearch,
  CampaignContactSearchStatus,
} from "@/types/campaign-contact"

const POLL_INTERVAL_MS = 2000

function joinLocation(c: CampaignContact): string {
  return [c.city, c.country].filter(Boolean).join(", ") || "—"
}

export function CampaignContactsPage() {
  const { campaign } = useCampaignContext()
  const campaignId = campaign.id
  // The ICP now lives on the campaign's linked product; contacts are gated on it.
  const productId = campaign.product_id

  const [icp, setIcp] = useState<Icp | null>(null)
  const [search, setSearch] = useState<CampaignContactSearch | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [starting, setStarting] = useState(false)
  // Tracks the previous search status so we can react to a run *completing*
  // (running -> ready/failed) rather than to every poll.
  const prevStatusRef = useRef<CampaignContactSearchStatus | undefined>(undefined)

  const icpReady = icp?.status === "ready"
  const running = search?.status === "running"
  const ready = search?.status === "ready"

  const load = useCallback(async () => {
    setLoading(true)
    setLoadError(null)
    try {
      // Both can legitimately 404 (no ICP / no search yet) — treat as null. The
      // ICP is the product's; skip the call entirely if no product is linked.
      const [icpResult, searchResult] = await Promise.all([
        productId != null
          ? icpService.get(productId).catch((err) => {
              if (err instanceof ApiError && err.status === 404) return null
              throw err
            })
          : Promise.resolve(null),
        campaignContactService.get(campaignId).catch((err) => {
          if (err instanceof ApiError && err.status === 404) return null
          throw err
        }),
      ])
      setIcp(icpResult)
      setSearch(searchResult)
    } catch (err) {
      setLoadError(
        err instanceof ApiError ? err.message : "Failed to load contacts.",
      )
    } finally {
      setLoading(false)
    }
  }, [campaignId, productId])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load()
  }, [load])

  // Poll while the background search is running.
  useEffect(() => {
    if (search?.status !== "running") return
    const timer = setInterval(() => {
      campaignContactService
        .get(campaignId)
        .then(setSearch)
        .catch(() => {
          /* transient error mid-search — keep polling */
        })
    }, POLL_INTERVAL_MS)
    return () => clearInterval(timer)
  }, [search?.status, campaignId])

  // Surface when a (re-)run finishes. Because FullEnrich is deterministic for a
  // given ICP, a fresh search can return the same people — so without this the
  // "Find again" result can look identical to the previous one. The paginated
  // list itself refetches via its own deps when `status`/`updated_at` change.
  useEffect(() => {
    const prev = prevStatusRef.current
    const current = search?.status
    prevStatusRef.current = current
    if (prev !== "running") return
    if (current === "ready") {
      const n = search?.contacts_found ?? 0
      toast.success(`Found ${n} contact${n === 1 ? "" : "s"}.`)
    } else if (current === "failed") {
      toast.error(search?.error ?? "Contact search failed.")
    }
  }, [search?.status, search?.contacts_found, search?.error])

  // The found people, paginated. Only fetched once a search is ready; refetched
  // when a (re-)run finishes (search.updated_at changes).
  const fetchContacts = useCallback(
    (params: PaginationParams): Promise<ListResult<CampaignContact>> =>
      ready
        ? campaignContactService.list(campaignId, params)
        : Promise.resolve({ items: [], total: 0 }),
    [ready, campaignId],
  )

  const {
    items: contacts,
    total,
    page,
    setPage,
    skip,
    hasNextPage,
    loading: listLoading,
    error: listError,
    refetch: refetchList,
  } = usePaginatedList<CampaignContact>(fetchContacts, {
    deps: [ready, campaignId, search?.updated_at],
  })

  async function handleGenerate() {
    setStarting(true)
    try {
      // Returns the row in the "running" state, which kicks off polling.
      setSearch(await campaignContactService.generate(campaignId))
      setPage(0)
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.message : "Failed to start contact search.",
      )
    } finally {
      setStarting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">Contacts</h2>
          <p className="text-muted-foreground">
            People at companies that match the linked product's ICP, found via
            FullEnrich.
          </p>
        </div>
        {icpReady && ready && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleGenerate}
            disabled={starting}
          >
            {starting ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <RefreshCw className="size-4" />
            )}
            Find again
          </Button>
        )}
      </div>

      {loading ? (
        <div className="space-y-3">
          <Skeleton className="h-9 w-full" />
          <Skeleton className="h-9 w-full" />
          <Skeleton className="h-9 w-2/3" />
        </div>
      ) : loadError ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
            <p className="text-sm text-muted-foreground">{loadError}</p>
            <Button variant="outline" size="sm" onClick={() => void load()}>
              <RefreshCw className="size-4" />
              Retry
            </Button>
          </CardContent>
        </Card>
      ) : productId == null ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
            <Sparkles className="size-7 text-muted-foreground" />
            <div className="max-w-md space-y-1">
              <p className="font-medium">Link a product first</p>
              <p className="text-sm text-muted-foreground">
                Finding contacts uses the linked product's Ideal Customer Profile.
                Link a product to this campaign, then generate its ICP.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : !icpReady ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
            <Sparkles className="size-7 text-muted-foreground" />
            <div className="max-w-md space-y-1">
              <p className="font-medium">Generate the ICP first</p>
              <p className="text-sm text-muted-foreground">
                Finding contacts uses the linked product's Ideal Customer Profile
                to search for matching companies and people. Generate the ICP on
                the product, then come back here.
              </p>
            </div>
            <Button asChild>
              <Link to={`/products/${productId}?tab=icp`}>Go to ICP</Link>
            </Button>
          </CardContent>
        </Card>
      ) : running ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
            <div>
              <p className="font-medium">Finding contacts…</p>
              <p className="text-sm text-muted-foreground">
                Fetching matching companies and searching for people inside them.
                This can take a little while.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : search?.status === "failed" ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
            <TriangleAlert className="size-6 text-destructive" />
            <div>
              <p className="font-medium">Contact search failed</p>
              <p className="text-sm text-muted-foreground">
                {search.error ?? "Something went wrong while finding contacts."}
              </p>
            </div>
            <Button onClick={handleGenerate} disabled={starting}>
              {starting ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <RefreshCw className="size-4" />
              )}
              Try again
            </Button>
          </CardContent>
        </Card>
      ) : ready ? (
        listLoading && contacts.length === 0 ? (
          <div className="space-y-3">
            <Skeleton className="h-9 w-full" />
            <Skeleton className="h-9 w-full" />
            <Skeleton className="h-9 w-2/3" />
          </div>
        ) : listError ? (
          <Card>
            <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
              <p className="text-sm text-muted-foreground">{listError}</p>
              <Button variant="outline" size="sm" onClick={refetchList}>
                <RefreshCw className="size-4" />
                Retry
              </Button>
            </CardContent>
          </Card>
        ) : total === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
              <Users className="size-7 text-muted-foreground" />
              <div className="max-w-md space-y-1">
                <p className="font-medium">No contacts found</p>
                <p className="text-sm text-muted-foreground">
                  No people matched across the companies we searched. Try
                  broadening the ICP (seniority, job functions, or company
                  filters) and run the search again.
                </p>
              </div>
              <Button onClick={handleGenerate} disabled={starting}>
                {starting ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <RefreshCw className="size-4" />
                )}
                Find again
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">
                {total ?? search.contacts_found ?? contacts.length}
              </span>{" "}
              {(total ?? search.contacts_found ?? contacts.length) === 1
                ? "contact"
                : "contacts"}{" "}
              across{" "}
              <span className="font-medium text-foreground">
                {search.companies_found ?? 0}
              </span>{" "}
              {(search.companies_found ?? 0) === 1 ? "company" : "companies"}.
            </p>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Seniority</TableHead>
                    <TableHead>Company</TableHead>
                    <TableHead>Industry</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead className="w-20">LinkedIn</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {contacts.map((contact) => (
                    <TableRow key={contact.id}>
                      <TableCell className="font-medium">
                        {contact.full_name || "—"}
                      </TableCell>
                      <TableCell>{contact.job_title || "—"}</TableCell>
                      <TableCell>{contact.seniority || "—"}</TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span>{contact.company_name || "—"}</span>
                          {contact.company_domain && (
                            <span className="text-xs text-muted-foreground">
                              {contact.company_domain}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {contact.company_industry || "—"}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {joinLocation(contact)}
                      </TableCell>
                      <TableCell>
                        {contact.linkedin_url ? (
                          <a
                            href={contact.linkedin_url}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
                          >
                            View
                            <ExternalLink className="size-3" />
                          </a>
                        ) : (
                          "—"
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <PaginationFooter
              page={page}
              skip={skip}
              count={contacts.length}
              total={total}
              hasNextPage={hasNextPage}
              onPrev={() => setPage((p) => Math.max(0, p - 1))}
              onNext={() => setPage((p) => p + 1)}
            />
          </div>
        )
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
            <Users className="size-7 text-muted-foreground" />
            <div className="max-w-md space-y-1">
              <p className="font-medium">No contacts found yet</p>
              <p className="text-sm text-muted-foreground">
                Fetch up to 50 companies that match the product's ICP, then
                search for the matching people inside them. You can re-run this
                any time.
              </p>
            </div>
            <Button onClick={handleGenerate} disabled={starting}>
              {starting ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Users className="size-4" />
              )}
              Find contacts
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
