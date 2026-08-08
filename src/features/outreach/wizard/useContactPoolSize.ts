import { useEffect, useMemo, useState } from "react"

import { contactPoolService } from "@/services/contactPool.service"
import type {
  ContactPoolFilters,
  ContactPoolSample,
  OutreachIcpDraft,
} from "@/types/outreach"
import { HEADCOUNT_MAX, HEADCOUNT_MIN } from "./headcountScale"

// One request per pause in editing, not one per keystroke: each is a billed
// FullEnrich search.
const DEBOUNCE_MS = 700

/** The wizard's profile in the shape the endpoint wants.
 *
 * The ends of the size range are dropped when they sit at the ends of the
 * scale — "0" is not a floor and "300,000+" is not a ceiling, and sending them
 * as one would quietly exclude every company whose headcount is unknown. */
export function toPoolFilters(icp: OutreachIcpDraft): ContactPoolFilters {
  return {
    company_domains: icp.company_domains,
    industries: icp.industries,
    company_locations: icp.company_locations,
    headcount_min: icp.headcount_min > HEADCOUNT_MIN ? icp.headcount_min : null,
    headcount_max: icp.headcount_max < HEADCOUNT_MAX ? icp.headcount_max : null,
    departments: icp.departments,
    job_titles: icp.job_titles,
    seniority: icp.seniority,
    locations: icp.locations,
  }
}

/** The fields this step owns. Company filters and uploaded domains reach the
 * search too, but on their own they are the *previous* step's answer. */
const CONTACT_FIELDS = [
  "departments",
  "job_titles",
  "seniority",
  "locations",
] as const

/**
 * Whether this step has been answered at all.
 *
 * A pool sized from company filters alone is "everyone at these companies",
 * which is a number nobody asked for and a provider search nobody needs — and
 * showing it on the contacts step reads as if the contact fields had been taken
 * into account when they are all still blank.
 */
function hasContactFilter(filters: ContactPoolFilters): boolean {
  return CONTACT_FIELDS.some((field) => filters[field].length > 0)
}

export interface ContactPoolState {
  /** No contact filter has been set yet, so there is nothing to size. */
  empty: boolean
  /** A search is in flight. The last total stays on screen while it runs. */
  loading: boolean
  /** The last total we got back, or null before the first answer. */
  total: number | null
  /** The first page from that same search — what "View sample" shows. */
  samples: ContactPoolSample[]
  error: string | null
}

/**
 * How many people the profile currently reaches, kept in step with it.
 *
 * Debounced, and the previous request is aborted when the profile changes
 * again, so a burst of edits costs one search. The last total is left on screen
 * while the next one runs — a number that blinks to nothing on every keystroke
 * is harder to read than one that is briefly a beat behind.
 */
export function useContactPoolSize(icp: OutreachIcpDraft): ContactPoolState {
  const filters = useMemo(() => toPoolFilters(icp), [icp])
  const empty = !hasContactFilter(filters)

  const [total, setTotal] = useState<number | null>(null)
  const [samples, setSamples] = useState<ContactPoolSample[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (empty) return
    const controller = new AbortController()
    const timer = setTimeout(() => {
      setLoading(true)
      contactPoolService
        .size(filters, controller.signal)
        .then((result) => {
          if (controller.signal.aborted) return
          setTotal(result.total)
          setSamples(result.samples)
          setError(null)
        })
        .catch((err: unknown) => {
          if (controller.signal.aborted) return
          setError(
            err instanceof Error
              ? err.message
              : "Could not size the pool right now.",
          )
        })
        .finally(() => {
          if (!controller.signal.aborted) setLoading(false)
        })
    }, DEBOUNCE_MS)
    return () => {
      clearTimeout(timer)
      controller.abort()
    }
  }, [filters, empty])

  return {
    empty,
    loading,
    total: empty ? null : total,
    samples: empty ? [] : samples,
    error,
  }
}
