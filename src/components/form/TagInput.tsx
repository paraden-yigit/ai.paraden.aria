import { useEffect, useId, useMemo, useRef, useState } from "react"
import { Loader2, X } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

// Cap the recommendation list so a long taxonomy (hundreds of industries) stays
// a menu rather than a wall; the user narrows it by typing.
const MAX_SUGGESTIONS = 8

// Wait for a pause in typing before asking, and for enough characters to mean
// something. Short, because a fetched list comes from our own API rather than a
// billed provider — the delay is only there to stop a request per keystroke.
const DEBOUNCE_MS = 150
const MIN_FETCH_QUERY = 2

/** Answers already received, per fetcher, so re-typing a prefix is free.
 * Keyed weakly on the fetch function, so two fields with different sources
 * never read each other's answers. */
const FETCH_CACHE = new WeakMap<object, Map<string, string[]>>()

function cacheFor(fetcher: object): Map<string, string[]> {
  let cache = FETCH_CACHE.get(fetcher)
  if (!cache) {
    cache = new Map()
    FETCH_CACHE.set(fetcher, cache)
  }
  return cache
}

export interface TagInputProps {
  /** The chosen values, in the order they were added. */
  value: string[]
  onChange: (next: string[]) => void
  /** Values recommended as the user types. Omit for a free-text tag list. */
  suggestions?: string[]
  /**
   * Where to fetch recommendations from, for a list too long to ship to the
   * browser (the location fields, whose places come from our own API). Must be a
   * stable reference — define it outside the component — since it keys both the
   * lookup effect and the response cache.
   */
  fetchSuggestions?: (query: string, signal: AbortSignal) => Promise<string[]>
  /**
   * Whether a value that was never recommended can be added. Defaults to true
   * for a free-text field and false whenever there is a source of
   * recommendations, fixed or fetched — a field backed by a list is only useful
   * if what it holds is in that list.
   */
  allowCustom?: boolean
  placeholder?: string
  disabled?: boolean
  id?: string
  "aria-describedby"?: string
}

/** Case-insensitive membership, so "sales" does not get added next to "Sales". */
function includesLoose(list: string[], candidate: string): boolean {
  const needle = candidate.trim().toLowerCase()
  return list.some((item) => item.toLowerCase() === needle)
}

/**
 * A tag list you type into: each value becomes a removable chip inside the
 * field.
 *
 * Three ways to fill it, one component. With neither source it is free text —
 * Enter commits whatever was typed, punctuation and all, which is what an
 * open-ended field like job titles needs. With `suggestions` it recommends from
 * a fixed list held in the browser (industries, departments, seniority). With
 * `fetchSuggestions` it recommends from a list too long to ship, asked for as
 * you type (the location fields). Either way, unless `allowCustom` says
 * otherwise, only what was recommended can be added — which is what keeps the
 * values matchable by whoever searches on them later.
 */
export function TagInput({
  value,
  onChange,
  suggestions,
  fetchSuggestions,
  allowCustom = !suggestions && !fetchSuggestions,
  placeholder,
  disabled,
  id,
  "aria-describedby": describedBy,
}: TagInputProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const listId = useId()
  const [query, setQuery] = useState("")
  // Which recommendation the arrow keys are on; -1 is "none highlighted".
  const [active, setActive] = useState(-1)
  // The last answer from `fetchSuggestions`, and whether one is in flight.
  const [fetched, setFetched] = useState<string[]>([])
  const [searching, setSearching] = useState(false)

  const trimmed = query.trim()
  const fetchable = trimmed.length >= MIN_FETCH_QUERY

  useEffect(() => {
    if (!fetchSuggestions || !fetchable) return
    const cache = cacheFor(fetchSuggestions)
    const controller = new AbortController()
    const timer = setTimeout(() => {
      const cached = cache.get(trimmed)
      if (cached) {
        setFetched(cached)
        return
      }
      setSearching(true)
      fetchSuggestions(trimmed, controller.signal)
        .then((places) => {
          cache.set(trimmed, places)
          if (!controller.signal.aborted) setFetched(places)
        })
        // An aborted or failed lookup leaves the last answer on screen. Nothing
        // is recoverable here: with no recommendations the field adds nothing,
        // which is the strictness working, not a bug to paper over.
        .catch(() => {})
        .finally(() => {
          if (!controller.signal.aborted) setSearching(false)
        })
    }, DEBOUNCE_MS)
    return () => {
      clearTimeout(timer)
      controller.abort()
    }
  }, [fetchSuggestions, trimmed, fetchable])

  /** Everything this field is currently allowed to hold: the fixed list, or
   * whatever the last lookup offered. Null means free text. */
  const options = suggestions ?? (fetchSuggestions ? fetched : null)

  const matches = useMemo(() => {
    const q = trimmed.toLowerCase()
    if (!q) return []
    if (fetchSuggestions) {
      // Already matched and ranked by whoever answered; only drop what is on
      // the field already.
      return fetchable
        ? fetched
            .filter((place) => !includesLoose(value, place))
            .slice(0, MAX_SUGGESTIONS)
        : []
    }
    if (!suggestions) return []
    const unpicked = suggestions.filter((option) => !includesLoose(value, option))
    // Anything starting with what was typed comes first: typing "sa" should
    // offer Sales before Human Resources' "Compensation".
    const starts = unpicked.filter((o) => o.toLowerCase().startsWith(q))
    const contains = unpicked.filter(
      (o) => !o.toLowerCase().startsWith(q) && o.toLowerCase().includes(q),
    )
    return [...starts, ...contains].slice(0, MAX_SUGGESTIONS)
  }, [suggestions, fetchSuggestions, fetched, fetchable, trimmed, value])

  const open = matches.length > 0 || (searching && fetchable)

  function add(raw: string) {
    const tag = raw.trim()
    if (!tag) return
    // A field backed by a list takes only what that list offered — the fixed
    // one, or the answer to the query being typed.
    if (!allowCustom && options && !includesLoose(options, tag)) return
    // Add the list's own casing rather than whatever was typed.
    const canonical = options?.find((o) => o.toLowerCase() === tag.toLowerCase())
    if (!includesLoose(value, tag)) onChange([...value, canonical ?? tag])
    setQuery("")
    setActive(-1)
  }

  function remove(tag: string) {
    onChange(value.filter((item) => item !== tag))
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown" && open) {
      event.preventDefault()
      setActive((current) => (current + 1) % matches.length)
      return
    }
    if (event.key === "ArrowUp" && open) {
      event.preventDefault()
      setActive((current) => (current <= 0 ? matches.length - 1 : current - 1))
      return
    }
    if (event.key === "Escape") {
      setQuery("")
      setActive(-1)
      return
    }
    // Enter is the only way to commit: a free-text value is often a phrase with
    // a comma in it ("Brighton, UK"), so a comma cannot also mean "next tag".
    if (event.key === "Enter") {
      event.preventDefault()
      // A highlighted recommendation wins; otherwise take what was typed, which
      // `add` will refuse if the field only accepts its own list.
      if (active >= 0 && matches[active]) add(matches[active])
      else if (matches.length === 1 && !allowCustom) add(matches[0])
      else add(query)
      return
    }
    // Backspace on an empty box takes the last chip back off, the usual way out
    // of a mistake without reaching for the mouse.
    if (event.key === "Backspace" && query === "" && value.length > 0) {
      remove(value[value.length - 1])
    }
  }

  return (
    <div className="relative">
      {/* The whole box is the field: clicking anywhere in it focuses the input,
        * and the border carries the focus ring rather than the input itself. */}
      <div
        onClick={() => inputRef.current?.focus()}
        className={cn(
          // px-1.5 on the box plus px-1.5 on the input lines the placeholder up
          // with a plain Input's px-3.
          "flex min-h-9 w-full flex-wrap items-center gap-1.5 rounded-md border border-input bg-transparent px-1.5 py-1 text-base shadow-xs transition-[color,box-shadow] md:text-sm dark:bg-input/30",
          "focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/50",
          disabled && "pointer-events-none opacity-50",
        )}
      >
        {value.map((tag) => (
          <Badge
            key={tag}
            variant="secondary"
            // Rounded rectangles rather than the Badge's default pill, and
            // roomier: these are values sitting in a field, not status marks.
            className="gap-1.5 rounded-md px-2.5 py-1 pr-1.5 text-sm font-normal"
          >
            <span className="truncate">{tag}</span>
            <button
              type="button"
              tabIndex={-1}
              onClick={(e) => {
                e.stopPropagation()
                remove(tag)
              }}
              aria-label={`Remove ${tag}`}
              className="rounded-sm p-0.5 opacity-60 hover:bg-foreground/10 hover:opacity-100"
            >
              <X className="size-3.5" />
            </button>
          </Badge>
        ))}
        <input
          ref={inputRef}
          id={id}
          value={query}
          disabled={disabled}
          role="combobox"
          aria-expanded={open}
          aria-controls={open ? listId : undefined}
          aria-autocomplete={options ? "list" : "none"}
          aria-describedby={describedBy}
          placeholder={value.length === 0 ? placeholder : undefined}
          onChange={(e) => {
            setQuery(e.target.value)
            setActive(-1)
          }}
          onKeyDown={handleKeyDown}
          onBlur={() => {
            // Free text keeps what was typed; a taxonomy field drops it, since
            // an unmatched half-word is not a value.
            if (allowCustom) add(query)
            else {
              setQuery("")
              setActive(-1)
            }
          }}
          className="min-w-24 flex-1 bg-transparent px-1.5 py-1 outline-none placeholder:text-muted-foreground"
        />
      </div>

      {open && (
        <ul
          id={listId}
          role="listbox"
          className="absolute top-full left-0 z-50 mt-1 max-h-64 w-full overflow-y-auto rounded-md border bg-popover p-1 text-popover-foreground shadow-md"
        >
          {matches.map((option, index) => (
            <li key={option}>
              <button
                type="button"
                role="option"
                aria-selected={index === active}
                // The input must keep focus, or the blur handler closes the
                // menu before the click ever lands.
                onMouseDown={(e) => e.preventDefault()}
                onMouseEnter={() => setActive(index)}
                onClick={() => add(option)}
                className={cn(
                  "flex w-full items-center rounded-sm px-2 py-1.5 text-left text-sm",
                  index === active && "bg-accent text-accent-foreground",
                )}
              >
                <span className="truncate">{option}</span>
              </button>
            </li>
          ))}
          {searching && matches.length === 0 && (
            <li className="flex items-center gap-2 px-2 py-1.5 text-sm text-muted-foreground">
              <Loader2 className="size-3.5 animate-spin" />
              Searching…
            </li>
          )}
        </ul>
      )}
    </div>
  )
}
