import { useEffect, useState } from "react"

import { clientService } from "@/services/client.service"
import { outreachService } from "@/services/outreach.service"
import { productService } from "@/services/product.service"

export interface SetupState {
  loading: boolean
  messagingDone: boolean
  productDone: boolean
  campaignDone: boolean
  allDone: boolean
}

/** Read the three setup signals in parallel; every failure counts as not-done. */
export function useSetupState(): SetupState {
  const [state, setState] = useState<SetupState>({
    loading: true,
    messagingDone: false,
    productDone: false,
    campaignDone: false,
    allDone: false,
  })

  useEffect(() => {
    let active = true
    const load = async () => {
      const [company, products, runs] = await Promise.allSettled([
        clientService.get(),
        productService.list({ limit: 1 }),
        outreachService.list({ limit: 1 }),
      ])

      // Company messaging lives on the client: any core answer counts as started.
      const messagingDone =
        company.status === "fulfilled" &&
        [
          company.value.value_proposition,
          company.value.industry,
        ].some((v) => !!v?.trim())

      const productDone =
        products.status === "fulfilled" && products.value.items.length > 0

      const campaignDone =
        runs.status === "fulfilled" &&
        (runs.value.items.length > 0 || (runs.value.total ?? 0) > 0)

      if (!active) return
      setState({
        loading: false,
        messagingDone,
        productDone,
        campaignDone,
        allDone: messagingDone && productDone && campaignDone,
      })
    }
    void load()
    return () => {
      active = false
    }
  }, [])

  return state
}
