import { useCallback, useEffect, useState } from "react"
import { ArrowRight, Loader2, Search, Sparkles } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { LabelWithHint } from "@/features/campaigns/wizard/LabelWithHint"
import { campaignUploadService } from "@/services/campaign-upload.service"
import { ApiError } from "@/services/http"
import type {
  CampaignImportJob,
  ImportJobKind,
  UploadResult,
} from "@/types/campaign-upload"

const POLL_MS = 2500
const DEFAULT_LIST_SIZE = 4

/** Where the step is: reporting what landed, working through one of the two
 * background phases, or asking how many people to find per company. */
type Phase = "summary" | "enriching" | "ask" | "fetching"

interface StepImportProps {
  campaignId: number
  /** What the upload just saved, bucketed by what each row still needs. */
  result: UploadResult
  onDone: () => void
}

/**
 * The step between mapping a spreadsheet and reviewing it, for everything the
 * file didn't bring with it.
 *
 * A file is accepted as long as it identifies companies, so what lands is often
 * unfinished in one of two ways: people named without an address, and companies
 * named without anybody at all. This step says which of those it found, then
 * works through them — finding work emails, and finding contacts scored against
 * the campaign's targeting profile — before handing over to the review.
 *
 * Both phases are background jobs on the API (either can run for minutes), so
 * each is started and then polled.
 */
export function StepImport({ campaignId, result, onDone }: StepImportProps) {
  const [phase, setPhase] = useState<Phase>("summary")
  const [job, setJob] = useState<CampaignImportJob | null>(null)
  const [starting, setStarting] = useState(false)
  const [listSize, setListSize] = useState(String(DEFAULT_LIST_SIZE))

  const needsEmail = result.contacts_needing_email
  const needsContacts = result.companies_without_contacts
  const listNum = Number(listSize)
  const listValid = Number.isInteger(listNum) && listNum >= 1 && listNum <= 25

  // Which phase, if any, is being polled right now.
  const activeKind: ImportJobKind | null =
    phase === "enriching"
      ? "enrich_emails"
      : phase === "fetching"
        ? "fetch_contacts"
        : null

  /** Report what a finished phase did, then move on to whatever is still owed.
   * A phase that had nothing to do says nothing — there is no result to report
   * and the user didn't ask for one. */
  const finish = useCallback(
    (kind: ImportJobKind, done: CampaignImportJob) => {
      if (done.total > 0) {
        if (kind === "enrich_emails") {
          const found = done.result?.found ?? 0
          toast.success(
            found
              ? `Found ${found} work email address${found === 1 ? "" : "es"}.`
              : "No work email addresses could be found.",
          )
        } else {
          const created = done.result?.contacts_created ?? 0
          toast.success(
            created
              ? `Found ${created} contact${created === 1 ? "" : "s"}.`
              : "No contacts could be found at those companies.",
          )
        }
      }
      if (kind === "enrich_emails" && needsContacts > 0) {
        setJob(null)
        setPhase("ask")
        return
      }
      onDone()
    },
    [needsContacts, onDone],
  )

  /** Take a job reading, and hand on if that reading was the last one. */
  const applyJob = useCallback(
    (kind: ImportJobKind, next: CampaignImportJob) => {
      setJob(next)
      if (next.status === "ready") finish(kind, next)
    },
    [finish],
  )

  const start = useCallback(
    async (kind: ImportJobKind) => {
      setStarting(true)
      try {
        const started =
          kind === "enrich_emails"
            ? await campaignUploadService.startEnrichment(campaignId)
            : await campaignUploadService.startFetch(campaignId, listNum)
        setPhase(kind === "enrich_emails" ? "enriching" : "fetching")
        // A phase with nothing left to do comes back "ready" rather than
        // "running", and hands straight on — the user never watches a progress
        // bar that will never fill.
        applyJob(kind, started)
      } catch (err) {
        toast.error(
          err instanceof ApiError ? err.message : "Couldn't start that step.",
        )
      } finally {
        setStarting(false)
      }
    },
    [applyJob, campaignId, listNum],
  )

  // Poll the running phase until it reports back.
  useEffect(() => {
    if (!activeKind || job?.status !== "running") return
    const id = setInterval(async () => {
      try {
        applyJob(activeKind, await campaignUploadService.job(campaignId, activeKind))
      } catch {
        /* transient — keep polling */
      }
    }, POLL_MS)
    return () => clearInterval(id)
  }, [activeKind, applyJob, campaignId, job?.status])

  if (phase === "summary") {
    return (
      <SummaryPhase
        result={result}
        busy={starting}
        onContinue={() => {
          if (needsEmail > 0) return void start("enrich_emails")
          if (needsContacts > 0) return setPhase("ask")
          onDone()
        }}
        onSkip={onDone}
        continueLabel={
          needsEmail > 0
            ? "Find their email addresses"
            : needsContacts > 0
              ? "Find contacts"
              : "Continue"
        }
      />
    )
  }

  if (phase === "ask") {
    return (
      <div className="space-y-6">
        <div className="space-y-5 rounded-lg border p-6">
          <div className="flex items-center gap-2">
            <Search className="size-5 text-muted-foreground" />
            <p className="text-sm font-medium">
              {needsContacts}{" "}
              {needsContacts === 1 ? "company has" : "companies have"} no
              contacts
            </p>
          </div>
          <p className="text-xs text-muted-foreground">
            We&apos;ll find people at{" "}
            {needsContacts === 1 ? "it" : "them"} and rank them against this
            campaign&apos;s targeting profile, the same way the next step does.
          </p>
          <div className="max-w-xs space-y-2">
            <LabelWithHint
              htmlFor="import-list-size"
              label="Contacts per company"
              hint="How many contacts to find at each company. If a company has fewer, we keep it as-is."
            />
            <Input
              id="import-list-size"
              type="number"
              min={1}
              max={25}
              value={listSize}
              onChange={(e) => setListSize(e.target.value)}
              disabled={starting}
              aria-invalid={!listValid}
            />
          </div>
        </div>
        <div className="flex items-center justify-between gap-2">
          <Button
            type="button"
            variant="ghost"
            onClick={onDone}
            disabled={starting}
          >
            Skip
          </Button>
          <Button
            type="button"
            onClick={() => void start("fetch_contacts")}
            disabled={starting || !listValid}
          >
            {starting && <Loader2 className="size-4 animate-spin" />}
            Find contacts
            <ArrowRight className="size-4" />
          </Button>
        </div>
      </div>
    )
  }

  // A phase is running (or failed and is waiting on the user).
  const failed = job?.status === "failed"
  const kind = activeKind ?? "enrich_emails"
  return (
    <div className="space-y-6">
      <div className="space-y-4 rounded-lg border p-6">
        <div className="flex items-center gap-2">
          {failed ? (
            <Sparkles className="size-5 text-muted-foreground" />
          ) : (
            <Loader2 className="size-5 animate-spin text-muted-foreground" />
          )}
          <p className="text-sm font-medium">
            {kind === "enrich_emails"
              ? "Finding work email addresses"
              : "Finding contacts"}
          </p>
        </div>
        {failed ? (
          <p className="text-xs text-destructive">
            {job?.error ?? "That step didn't finish. Try it again."}
          </p>
        ) : (
          <p className="text-xs text-muted-foreground">
            {job?.completed ?? 0} of {job?.total ?? 0}{" "}
            {kind === "enrich_emails" ? "contacts" : "companies"} done. This can
            take a few minutes — you can leave this open.
          </p>
        )}
      </div>
      {failed && (
        <div className="flex items-center justify-between gap-2">
          <Button type="button" variant="ghost" onClick={onDone}>
            Skip
          </Button>
          <Button
            type="button"
            onClick={() => void start(kind)}
            disabled={starting}
          >
            {starting && <Loader2 className="size-4 animate-spin" />}
            Try again
          </Button>
        </div>
      )}
    </div>
  )
}

/** What the upload landed, split by what each row still needs. */
function SummaryPhase({
  result,
  busy,
  continueLabel,
  onContinue,
  onSkip,
}: {
  result: UploadResult
  busy: boolean
  continueLabel: string
  onContinue: () => void
  onSkip: () => void
}) {
  const pending =
    result.contacts_needing_email > 0 || result.companies_without_contacts > 0
  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-medium">
          Imported {result.contacts_created}{" "}
          {result.contacts_created === 1 ? "contact" : "contacts"} across{" "}
          {result.companies_created}{" "}
          {result.companies_created === 1 ? "company" : "companies"}.
        </p>
        {result.excluded_skipped > 0 && (
          // Say when rows were dropped: a file that quietly imports short looks
          // like a broken upload rather than the exclusion list doing its job.
          <p className="mt-1 text-xs text-muted-foreground">
            {result.excluded_skipped}{" "}
            {result.excluded_skipped === 1 ? "row was" : "rows were"} skipped —
            on your exclusion list.
          </p>
        )}
      </div>

      <ul className="divide-y rounded-lg border">
        <BucketRow
          count={result.contacts_ready}
          label={
            result.contacts_ready === 1
              ? "contact is ready to go"
              : "contacts are ready to go"
          }
          detail="They came with an email address."
        />
        <BucketRow
          count={result.contacts_needing_email}
          label={
            result.contacts_needing_email === 1
              ? "contact needs an email address"
              : "contacts need an email address"
          }
          detail="We'll look up their work emails."
        />
        <BucketRow
          count={result.companies_without_contacts}
          label={
            result.companies_without_contacts === 1
              ? "company has no contacts"
              : "companies have no contacts"
          }
          detail="We'll find people at them."
        />
      </ul>

      <div className="flex items-center justify-between gap-2">
        {pending ? (
          <Button type="button" variant="ghost" onClick={onSkip} disabled={busy}>
            Skip for now
          </Button>
        ) : (
          <span />
        )}
        <Button type="button" onClick={onContinue} disabled={busy}>
          {busy && <Loader2 className="size-4 animate-spin" />}
          {continueLabel}
          <ArrowRight className="size-4" />
        </Button>
      </div>
    </div>
  )
}

/** One bucket of the import. Empty buckets are dimmed rather than hidden, so the
 * three numbers always add up to the file in front of the user. */
function BucketRow({
  count,
  label,
  detail,
}: {
  count: number
  label: string
  detail: string
}) {
  return (
    <li className="flex items-baseline gap-3 p-3">
      <span
        className={
          count > 0
            ? "w-12 shrink-0 text-right text-sm font-semibold tabular-nums"
            : "w-12 shrink-0 text-right text-sm font-semibold tabular-nums text-muted-foreground"
        }
      >
        {count}
      </span>
      <span className="min-w-0">
        <span className="block text-sm">{label}</span>
        {count > 0 && (
          <span className="block text-xs text-muted-foreground">{detail}</span>
        )}
      </span>
    </li>
  )
}
