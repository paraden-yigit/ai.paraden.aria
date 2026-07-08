import { useCallback } from "react"

import { useAsync } from "@/hooks/useAsync"
import { productService } from "@/services/product.service"
import type { SelectOption } from "@/components/form/SelectField"

// One page is plenty for a selector; products lists are small per client.
const MAX_OPTIONS = 200

/**
 * Loads the client's products as `SelectOption[]` (id → string value, name →
 * label) for a product-picker `SelectField`. Wraps `useAsync`, so it exposes
 * `loading`/`error`/`refetch` too.
 */
export function useProductOptions() {
  const fetchOptions = useCallback(async (): Promise<SelectOption[]> => {
    const { items } = await productService.list({ limit: MAX_OPTIONS })
    return items.map((product) => ({
      value: String(product.id),
      label: product.name,
    }))
  }, [])

  const { data, loading, error, refetch } = useAsync(fetchOptions, [])
  return { options: data ?? [], loading, error, refetch }
}
