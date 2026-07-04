import { useRef, useState } from "react"
import { useNavigate } from "react-router-dom"
import {
  Building2,
  ExternalLink,
  Loader2,
  MapPin,
  Pencil,
  Search,
  SearchX,
  Users,
} from "lucide-react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { CompanyForm } from "@/features/companies/CompanyForm"
import { companyService } from "@/services/company.service"
import { fullEnrichService } from "@/services/fullenrich.service"
import { ApiError } from "@/services/http"
import type { Company, CompanyCreate } from "@/types/company"

type Step = "lookup" | "manual" | "review"

/** Provenance tag stamped on companies created through this "Add company" flow. */
const COMPANY_SOURCE = "add_company_button"

/** Strip protocol / `www.` / path so domains compare and match consistently. */
function normalizeDomain(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .replace(/\/.*$/, "")
}

function normalizeLinkedInUrl(value: string): string {
  const trimmed = value.trim()
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`
}

/** An existing company matching the draft by domain or LinkedIn URL, if any. */
function findDuplicate(
  draft: CompanyCreate,
  companies: Company[],
): Company | undefined {
  const domain = draft.domain ? normalizeDomain(draft.domain) : ""
  const linkedin = draft.linkedin_url?.trim().toLowerCase() ?? ""
  return companies.find((company) => {
    if (domain && company.domain && normalizeDomain(company.domain) === domain) {
      return true
    }
    if (linkedin && company.linkedin_url?.trim().toLowerCase() === linkedin) {
      return true
    }
    return false
  })
}

interface AddCompanyFlowProps {
  /** The client's companies, used to short-circuit on duplicates. */
  existingCompanies: Company[]
  /** Close the surrounding dialog (e.g. on cancel). */
  onClose: () => void
}

/**
 * The "Add company" dialog body: look a company up by domain / LinkedIn URL via
 * FullEnrich, fall back to manual entry when nothing matches, then review the
 * details before saving. Approving creates the company (or, if it already
 * exists for this client, skips the save) and opens its page.
 */
export function AddCompanyFlow({ existingCompanies, onClose }: AddCompanyFlowProps) {
  const navigate = useNavigate()

  const [step, setStep] = useState<Step>("lookup")
  const [input, setInput] = useState("")
  const [looking, setLooking] = useState(false)
  const [notFound, setNotFound] = useState(false)
  const [draft, setDraft] = useState<CompanyCreate | null>(null)
  // Whether the current draft originated from a FullEnrich lookup (vs manual
  // entry). Lookup-sourced companies are saved already-enriched.
  const [fromLookup, setFromLookup] = useState(false)
  const [saving, setSaving] = useState(false)
  const abortRef = useRef<AbortController | null>(null)

  async function handleFind() {
    const value = input.trim()
    if (!value) {
      toast.error("Enter a company domain or LinkedIn URL.")
      return
    }

    // "linkedin.com" anywhere in the value means we're finding by LinkedIn URL;
    // otherwise treat the value as the company's website domain.
    const body = value.toLowerCase().includes("linkedin.com")
      ? { linkedin_url: normalizeLinkedInUrl(value) }
      : { domain: normalizeDomain(value) }

    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    setLooking(true)
    setNotFound(false)
    try {
      const { company } = await fullEnrichService.lookupCompany(body, controller.signal)
      if (company) {
        setDraft(company)
        setFromLookup(true)
        setStep("review")
      } else {
        setNotFound(true)
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return
      toast.error(err instanceof ApiError ? err.message : "Company lookup failed.")
    } finally {
      if (abortRef.current === controller) setLooking(false)
    }
  }

  function startManualEntry() {
    // Manual entry — the company is not coming from a FullEnrich lookup.
    setFromLookup(false)
    // Prefill whatever the user typed so they don't retype the identifier.
    if (!draft) {
      const value = input.trim()
      if (value) {
        setDraft(
          value.toLowerCase().includes("linkedin.com")
            ? { name: "", domain: "", linkedin_url: normalizeLinkedInUrl(value) }
            : { name: "", domain: normalizeDomain(value) },
        )
      }
    }
    setStep("manual")
  }

  async function handleApprove() {
    if (!draft) return

    // A company must be identifiable by a URL or LinkedIn URL — never save without one.
    if (!draft.domain?.trim() && !draft.linkedin_url?.trim()) {
      toast.warning("Add a company URL or a LinkedIn URL before saving.")
      setStep("manual")
      return
    }

    // Already in the client's companies — skip the save and open the existing one.
    const existing = findDuplicate(draft, existingCompanies)
    if (existing) {
      toast.info(`"${existing.name || existing.domain}" is already in your companies.`)
      onClose()
      navigate(`/companies/${existing.id}`)
      return
    }

    setSaving(true)
    try {
      const created = await companyService.create({
        ...draft,
        source: COMPANY_SOURCE,
        // A looked-up company arrives with FullEnrich data — mark it enriched.
        enrich_status: fromLookup ? "successful" : "pending",
      })
      toast.success(`Company "${created.name || created.domain}" added.`)
      onClose()
      navigate(`/companies/${created.id}`)
    } catch (err) {
      // It may exist beyond the loaded page — find it by domain and open it.
      if (err instanceof ApiError && draft.domain) {
        try {
          const { items } = await companyService.search(draft.domain, { limit: 1 })
          if (items[0]) {
            toast.info(`"${items[0].name || items[0].domain}" is already in your companies.`)
            onClose()
            navigate(`/companies/${items[0].id}`)
            return
          }
        } catch {
          // fall through to the generic error
        }
      }
      toast.error(err instanceof ApiError ? err.message : "Failed to add company.")
    } finally {
      setSaving(false)
    }
  }

  if (step === "manual") {
    return (
      <>
        <DialogHeader>
          <DialogTitle>Add company</DialogTitle>
          <DialogDescription>Enter the company details manually.</DialogDescription>
        </DialogHeader>
        <CompanyForm
          company={draft ?? undefined}
          requireUrlOrLinkedin
          onSubmit={async (payload) => {
            setDraft(payload)
            setStep("review")
          }}
          onCancel={() => setStep("lookup")}
          submitLabel="Review"
        />
      </>
    )
  }

  if (step === "review" && draft) {
    return (
      <>
        <DialogHeader>
          <DialogTitle>Review company</DialogTitle>
          <DialogDescription>
            Confirm the details below, then add the company to your list.
          </DialogDescription>
        </DialogHeader>

        <CompanyDraftCard draft={draft} />

        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => setStep("manual")}
            disabled={saving}
          >
            <Pencil className="size-4" />
            Edit details
          </Button>
          <Button type="button" onClick={handleApprove} disabled={saving}>
            {saving && <Loader2 className="size-4 animate-spin" />}
            Add company
          </Button>
        </div>
      </>
    )
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>Add company</DialogTitle>
        <DialogDescription>
          Find a company by its website domain or LinkedIn URL.
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-4">
        <div className="flex items-start gap-2">
          <Input
            autoFocus
            placeholder="anthropic.com or linkedin.com/company/anthropic"
            value={input}
            onChange={(e) => {
              setInput(e.target.value)
              setNotFound(false)
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault()
                void handleFind()
              }
            }}
            disabled={looking}
          />
          <Button type="button" onClick={handleFind} disabled={looking}>
            {looking ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Search className="size-4" />
            )}
            Find company
          </Button>
        </div>

        {notFound ? (
          <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed p-8 text-center">
            <SearchX className="size-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              No companies found for “{input.trim()}”.
            </p>
            <Button type="button" variant="outline" onClick={startManualEntry}>
              <Pencil className="size-4" />
              Enter company details manually
            </Button>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            
            <Button type="button" variant="ghost" size="sm" onClick={startManualEntry}>
              Enter details manually
            </Button>
          </div>
        )}
      </div>
    </>
  )
}

/** A read-only summary of the company draft shown before saving. */
function CompanyDraftCard({ draft }: { draft: CompanyCreate }) {
  const hq = [draft.hq_city, draft.hq_region, draft.hq_country].filter(Boolean).join(", ")
  const headcount =
    draft.headcount != null ? draft.headcount.toLocaleString() : draft.headcount_range

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <CardTitle className="flex items-center gap-2">
            <Building2 className="size-4 shrink-0 text-muted-foreground" />
            {draft.name || draft.domain || "New company"}
          </CardTitle>
          {draft.domain && (
            <a
              href={`https://${normalizeDomain(draft.domain)}`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
            >
              {draft.domain}
              <ExternalLink className="size-3" />
            </a>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        {draft.description && (
          <p className="text-muted-foreground line-clamp-4">{draft.description}</p>
        )}

        <div className="flex flex-wrap gap-2">
          {draft.industry && <Badge variant="secondary">{draft.industry}</Badge>}
          {draft.company_type && <Badge variant="outline">{draft.company_type}</Badge>}
          {draft.year_founded != null && (
            <Badge variant="outline">Founded {draft.year_founded}</Badge>
          )}
        </div>

        <div className="flex flex-wrap gap-x-4 gap-y-1 text-muted-foreground">
          {headcount && (
            <span className="flex items-center gap-1">
              <Users className="size-3.5" />
              {headcount} employees
            </span>
          )}
          {hq && (
            <span className="flex items-center gap-1">
              <MapPin className="size-3.5" />
              {hq}
            </span>
          )}
          {draft.linkedin_url && (
            <a
              href={draft.linkedin_url}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1 hover:text-foreground"
            >
              LinkedIn
              <ExternalLink className="size-3" />
            </a>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
