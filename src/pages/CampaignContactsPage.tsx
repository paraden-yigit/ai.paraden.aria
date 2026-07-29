import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Link } from "react-router-dom"
import {
  Loader2,
  RefreshCw,
  Search,
  Sparkles,
  TriangleAlert,
  Users,
} from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { ConfirmDialog } from "@/components/ConfirmDialog"
import {
  CompaniesAccordion,
  type AccordionCompany,
} from "@/features/campaigns/wizard/CompaniesAccordion"
import { useCampaignContext } from "@/features/campaigns/useCampaignContext"
import { useAuth } from "@/features/auth/useAuth"
import { PERMISSIONS } from "@/lib/permissions"
import { icpService } from "@/services/icp.service"
import { campaignContactService } from "@/services/campaign-contact.service"
import { excludedCompanyService } from "@/services/excluded-company.service"
import { ApiError } from "@/services/http"
import type { Icp } from "@/types/icp"
import type {
  CampaignContact,
  CampaignContactSearch,
  CampaignContactSearchStatus,
} from "@/types/campaign-contact"

const POLL_INTERVAL_MS = 2000
// The contacts/list endpoint caps a page at 200; loop pages to load them all so
// companies aren't split across pages in the grouped view.
const PAGE_SIZE = 200
const MAX_PAGES = 25

/** Group the flat contact list into expandable companies (same shape the wizard
 * accordion renders). Contacts arrive ordered by company, so first-seen order is
 * preserved. */
function groupByCompany(contacts: CampaignContact[]): AccordionCompany[] {
  const byKey = new Map<string, AccordionCompany>()
  const order: string[] = []
  for (const c of contacts) {
    const key = `${c.company_name ?? ""}|${c.company_domain ?? ""}`
    let group = byKey.get(key)
    if (!group) {
      group = {
        name: c.company_name,
        domain: c.company_domain,
        industry: c.company_industry,
        linkedin_url: c.company_linkedin_url,
        contacts: [],
      }
      byKey.set(key, group)
      order.push(key)
    }
    group.contacts.push({
      full_name: c.full_name,
      job_title: c.job_title,
      email: c.email,
      linkedin_url: c.linkedin_url,
    })
  }
  return order.map((k) => byKey.get(k) as AccordionCompany)
}

export function CampaignContactsPage() {
  const { campaign } = useCampaignContext()
  const campaignId = campaign.id
  // The ICP now lives on the campaign's linked product; contacts are gated on it.
  const productId = campaign.product_id
  // Excluding a company needs the exclusion-list permission.
  const { hasPermission } = useAuth()
  const canExclude = hasPermission(PERMISSIONS.exclusionLists)

  const [icp, setIcp] = useState<Icp | null>(null)
  const [search, setSearch] = useState<CampaignContactSearch | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [starting, setStarting] = useState(false)
  // Tracks the previous search status so we can react to a run *completing*
  // (running -> ready/failed) rather than to every poll.
  const prevStatusRef = useRef<CampaignContactSearchStatus | undefined>(undefined)

  // The campaign's contacts (all pages), grouped into companies for display.
  const [contacts, setContacts] = useState<CampaignContact[]>([])
  const [contactsLoading, setContactsLoading] = useState(false)
  const [contactsError, setContactsError] = useState<string | null>(null)

  const icpReady = icp?.status === "ready"
  const running = search?.status === "running"

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

  // Surface when a (re-)run finishes.
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

  // Load ALL of the campaign's contacts (looping pages) so companies group
  // cleanly. Re-runs whenever a search finishes (search.updated_at changes).
  const loadContacts = useCallback(async () => {
    setContactsLoading(true)
    setContactsError(null)
    try {
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
      setContacts(all)
    } catch (err) {
      setContactsError(
        err instanceof ApiError ? err.message : "Failed to load contacts.",
      )
    } finally {
      setContactsLoading(false)
    }
  }, [campaignId])

  // Load the campaign's contacts regardless of whether a FullEnrich search has
  // run — CSV-uploaded contacts have no search row but should still show. Refetch
  // when a search completes (updated_at changes) to pick up newly found people.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadContacts()
  }, [loadContacts, search?.updated_at])

  // Client-side search over the full loaded list (name, title, email, company).
  const [query, setQuery] = useState("")
  const filteredContacts = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return contacts
    return contacts.filter((c) =>
      [
        c.full_name,
        c.job_title,
        c.email,
        c.company_name,
        c.company_domain,
      ].some((field) => field?.toLowerCase().includes(q)),
    )
  }, [contacts, query])

  const companies = useMemo(
    () => groupByCompany(filteredContacts),
    [filteredContacts],
  )
  const hasContacts = contacts.length > 0

  // Exclude-company flow: confirm, create the exclusion (the API sweeps the
  // company's people out of every campaign), then reload the list.
  const [companyToExclude, setCompanyToExclude] =
    useState<AccordionCompany | null>(null)
  const [excluding, setExcluding] = useState(false)

  async function handleExclude() {
    const company = companyToExclude
    if (!company) return
    const label = company.name || company.domain || "this company"
    setExcluding(true)
    try {
      await excludedCompanyService.create({
        name: company.name ?? company.domain ?? "Unnamed company",
        domain: company.domain,
        linkedin_url: company.linkedin_url ?? null,
      })
      toast.success(`${label} added to the exclusion list.`)
      setCompanyToExclude(null)
      void loadContacts()
    } catch (err) {
      toast.error(
        err instanceof ApiError
          ? err.message
          : `Could not add ${label} to the exclusion list. Nothing was changed.`,
      )
    } finally {
      setExcluding(false)
    }
  }

  async function handleGenerate() {
    setStarting(true)
    try {
      // Returns the row in the "running" state, which kicks off polling.
      setSearch(await campaignContactService.generate(campaignId))
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
            Everyone in this campaign: contacts you uploaded, plus people Paraden
            found to match the product's targeting profile.
          </p>
        </div>
        {icpReady && hasContacts && !running && (
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
            Find more
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
      ) : hasContacts ? (
        // The campaign has contacts (uploaded and/or discovered) — show them
        // grouped by company, regardless of any FullEnrich search state.
        <div className="space-y-4">
          <div className="relative max-w-md">
            <Search
              className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name, title, email or company…"
              aria-label="Search contacts"
              className="pl-9"
            />
          </div>
          <p className="text-sm text-muted-foreground">
            {query.trim() ? (
              <>
                <span className="font-medium text-foreground">
                  {filteredContacts.length}
                </span>{" "}
                of {contacts.length}{" "}
                {contacts.length === 1 ? "contact" : "contacts"} match, across{" "}
                <span className="font-medium text-foreground">
                  {companies.length}
                </span>{" "}
                {companies.length === 1 ? "company" : "companies"}.
              </>
            ) : (
              <>
                <span className="font-medium text-foreground">
                  {contacts.length}
                </span>{" "}
                {contacts.length === 1 ? "contact" : "contacts"} across{" "}
                <span className="font-medium text-foreground">
                  {companies.length}
                </span>{" "}
                {companies.length === 1 ? "company" : "companies"}. Expand a
                company to see its people, and click a person for their details.
              </>
            )}
          </p>
          {companies.length === 0 ? (
            <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed p-10 text-center">
              <Search className="size-6 text-muted-foreground" />
              <p className="text-sm font-medium">No one matches your search</p>
              <p className="text-xs text-muted-foreground">
                Try a shorter name, or clear the search to see everyone.
              </p>
            </div>
          ) : (
            /* No height cap here (unlike the wizard): the list gets the page. */
            <CompaniesAccordion
              companies={companies}
              className="max-h-none"
              onExcludeCompany={canExclude ? setCompanyToExclude : undefined}
            />
          )}
        </div>
      ) : contactsLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-9 w-full" />
          <Skeleton className="h-9 w-full" />
          <Skeleton className="h-9 w-2/3" />
        </div>
      ) : contactsError ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
            <p className="text-sm text-muted-foreground">{contactsError}</p>
            <Button variant="outline" size="sm" onClick={() => void loadContacts()}>
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

      <ConfirmDialog
        open={companyToExclude !== null}
        onOpenChange={(open) => {
          if (!open && !excluding) setCompanyToExclude(null)
        }}
        title={`Exclude ${companyToExclude?.name ?? companyToExclude?.domain ?? "this company"}?`}
        description="Everyone at this company comes off your campaigns, and Paraden never contacts them again. You can take the company off the Exclusion list later, but people already removed stay removed."
        confirmLabel="Exclude company"
        destructive
        loading={excluding}
        onConfirm={handleExclude}
      />
    </div>
  )
}
