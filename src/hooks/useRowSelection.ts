import { useCallback, useMemo, useState } from "react"

/**
 * Tracks a set of selected rows across a table, keyed by a numeric id. Stores
 * the full item (not just the id) so bulk actions have everything they need
 * even after the visible page changes. Pair with a `<Checkbox>` per row plus a
 * header checkbox driven by `headerState` / `toggleAll`.
 *
 * Pass a stable `getId` (e.g. a module-level `(x) => x.id`).
 */
export function useRowSelection<T>(getId: (item: T) => number) {
  const [selected, setSelected] = useState<Map<number, T>>(new Map())

  const toggle = useCallback(
    (item: T) =>
      setSelected((prev) => {
        const next = new Map(prev)
        const id = getId(item)
        if (next.has(id)) next.delete(id)
        else next.set(id, item)
        return next
      }),
    [getId],
  )

  const toggleAll = useCallback(
    (items: T[], checked: boolean) =>
      setSelected((prev) => {
        const next = new Map(prev)
        for (const item of items) {
          if (checked) next.set(getId(item), item)
          else next.delete(getId(item))
        }
        return next
      }),
    [getId],
  )

  const clear = useCallback(() => setSelected(new Map()), [])

  const isSelected = useCallback((id: number) => selected.has(id), [selected])

  const items = useMemo(() => Array.from(selected.values()), [selected])

  /** Checkbox state for a header that selects/clears the given page of rows. */
  const headerState = useCallback(
    (page: T[]): boolean | "indeterminate" => {
      if (page.length === 0) return false
      const chosen = page.filter((item) => selected.has(getId(item))).length
      if (chosen === 0) return false
      return chosen === page.length ? true : "indeterminate"
    },
    [selected, getId],
  )

  return { items, count: selected.size, toggle, toggleAll, clear, isSelected, headerState }
}
