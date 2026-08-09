import { useState } from "react"
import { Loader2, Table2, Users } from "lucide-react"

import { Button } from "@/components/ui/button"
import { TagInput } from "@/components/form/TagInput"
import { JOB_FUNCTIONS } from "@/features/companies/job-functions"
import { SENIORITY } from "@/features/companies/seniority"
import { formatPoolSize } from "@/lib/format"
import { cn } from "@/lib/utils"
import { placeService } from "@/services/place.service"
import type { OutreachIcpDraft, RunPoolSample } from "@/types/outreach"
import { PoolSampleDialog } from "./PoolSampleDialog"
import { ProfileField } from "./ProfileField"
import { StepFrame } from "./StepFrame"
import { useContactPoolSize } from "./useContactPoolSize"

/** Defined out here so the reference is stable — `TagInput` keys both its
 * lookup and its response cache on it. */
const findPlaces = (query: string, signal: AbortSignal) =>
  placeService.suggest(query, signal)

interface StepContactsProps {
  value: OutreachIcpDraft
  onChange: (next: OutreachIcpDraft) => void
  /** Each completed pool answer, so the page can save the snapshot with the
   * profile. Stable reference. */
  onPool: (pool: RunPoolSample) => void
}

/**
 * The people half of a Flow run's profile, with the pool it currently reaches.
 *
 * The pool size is a real FullEnrich people-search, run against both halves of
 * the profile — the company filters from the previous step ride along inside the
 * same people search, so the number is how many *reachable people* there are
 * rather than how many companies they work at. It is the only honest feedback
 * this step can give: a profile that matches eleven people is a mistake worth
 * seeing here, not after a launch.
 *
 * Nothing is counted until one of the fields below is answered. Sized from the
 * previous step alone the number would be "everyone at those companies", which
 * reads as though these fields had been taken into account while they are all
 * still blank.
 */
export function StepContacts({ value, onChange, onPool }: StepContactsProps) {
  const pool = useContactPoolSize(value, onPool)

  function set<K extends keyof OutreachIcpDraft>(
    key: K,
    next: OutreachIcpDraft[K],
  ) {
    onChange({ ...value, [key]: next })
  }

  return (
    <StepFrame
      title="And who at those companies?"
      blurb="Job titles are matched as written, so use the words the prospects would. Departments and seniority come from a fixed list, which is what keeps them matchable."
    >
      <ProfileField
        label="Department"
        description="Where in the company they work. Start typing to see the departments we can match."
      >
        {({ id, describedBy }) => (
          <TagInput
            id={id}
            aria-describedby={describedBy}
            value={value.departments}
            onChange={(next) => set("departments", next)}
            suggestions={JOB_FUNCTIONS}
            placeholder="Search departments…"
          />
        )}
      </ProfileField>
      <ProfileField
        label="Job titles"
        description="The titles worth reaching, in their words rather than ours. Type one and press Enter."
      >
        {({ id, describedBy }) => (
          <TagInput
            id={id}
            aria-describedby={describedBy}
            value={value.job_titles}
            onChange={(next) => set("job_titles", next)}
            placeholder="Head of Finance"
          />
        )}
      </ProfileField>
      <ProfileField
        label="Seniority"
        description="How senior they are. Start typing to see the levels we can match."
      >
        {({ id, describedBy }) => (
          <TagInput
            id={id}
            aria-describedby={describedBy}
            value={value.seniority}
            onChange={(next) => set("seniority", next)}
            suggestions={SENIORITY}
            placeholder="Search seniority…"
          />
        )}
      </ProfileField>
      <ProfileField
        label="Location"
        description="Where the person is, which is not always where their company is. Start typing and pick from the list — a country on its own works, or a city within one."
      >
        {({ id, describedBy }) => (
          <TagInput
            id={id}
            aria-describedby={describedBy}
            value={value.locations}
            onChange={(next) => set("locations", next)}
            fetchSuggestions={findPlaces}
            placeholder="Istanbul, Turkey"
          />
        )}
      </ProfileField>

      <PoolSize {...pool} />
    </StepFrame>
  )
}

/** The live count under the fields: what this profile reaches right now, and a
 * way into the people behind the number. */
function PoolSize({
  empty,
  loading,
  total,
  samples,
  error,
}: ReturnType<typeof useContactPoolSize>) {
  const [showSample, setShowSample] = useState(false)

  return (
    <div className="rounded-lg border bg-muted/30 p-4">
      {/* Every state keeps this row the same height: the button stays mounted
        * and is disabled while a count runs, rather than vanishing and taking
        * the row's height with it. */}
      <div className="flex h-8 items-center gap-2 text-sm font-medium">
        <Users className="size-4" aria-hidden />
        Pool size
        {loading && (
          <span className="flex items-center gap-1.5 font-normal text-muted-foreground">
            <Loader2 className="size-3.5 animate-spin" aria-hidden />
            Populating…
          </span>
        )}
        {samples.length > 0 && !error && (
          <>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="ml-auto"
              // The sample on hand answers the last search, not the one running.
              disabled={loading}
              onClick={() => setShowSample(true)}
            >
              <Table2 className="size-4" />
              View sample
            </Button>
            <PoolSampleDialog
              open={showSample}
              onOpenChange={setShowSample}
              samples={samples}
            />
          </>
        )}
      </div>
      <p
        aria-live="polite"
        // min-h holds the row that the number occupies, so clearing the number
        // for a recount leaves the panel exactly where it was — nothing below it
        // jumps while the answer changes.
        className={cn(
          "mt-2 flex min-h-8 items-baseline text-sm text-muted-foreground",
          total !== null && !loading && !error && "text-foreground",
        )}
      >
        {error ? (
          error
        ) : empty ? (
          "Add a department, job title, seniority or location above, and we will count how many people this profile reaches."
        ) : (
          <>
            {/* A stale count under a spinner is worse than no count: it looks
              * like the answer to the filters now on screen. */}
            <span className="text-2xl font-semibold tabular-nums">
              {loading || total === null ? "—" : formatPoolSize(total)}
            </span>
            {!loading && total !== null && (
              <span className="ml-2 text-muted-foreground">
                {total === 1 ? "person matches" : "people match"} this profile
                {total === 0 && " — try loosening a filter"}
              </span>
            )}
          </>
        )}
      </p>
    </div>
  )
}
