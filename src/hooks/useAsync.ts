import { useCallback, useEffect, useState } from "react"
import { ApiError } from "@/services/http"

interface AsyncState<T> {
  data: T | null
  error: string | null
  loading: boolean
}

/**
 * Generic data-fetching hook. Runs `fn` on mount and whenever `deps` change,
 * tracking loading/error/data and exposing `refetch`. Reusable by any feature
 * that loads data from a service.
 *
 * `deps` is the source of truth for when to re-run (same contract as the
 * dependency array you'd pass to useEffect). Keep `fn` consistent with `deps`.
 */
export function useAsync<T>(fn: () => Promise<T>, deps: unknown[]) {
  const [state, setState] = useState<AsyncState<T>>({
    data: null,
    error: null,
    loading: true,
  })
  const [reloadFlag, setReloadFlag] = useState(0)

  useEffect(() => {
    let active = true
    // Show the loading state while the (re)fetch is in flight.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setState((prev) => ({ ...prev, loading: true, error: null }))
    fn()
      .then((data) => {
        if (active) setState({ data, error: null, loading: false })
      })
      .catch((err: unknown) => {
        if (!active) return
        const message =
          err instanceof ApiError ? err.message : "Something went wrong. Try again."
        setState((prev) => ({ ...prev, error: message, loading: false }))
      })
    return () => {
      active = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, reloadFlag])

  const refetch = useCallback(() => setReloadFlag((n) => n + 1), [])

  return { ...state, refetch }
}
