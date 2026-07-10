import { useEffect, useState } from "react"

import { brandProfileService } from "@/services/brand-profile.service"
import { campaignService } from "@/services/campaign.service"
import { icpService } from "@/services/icp.service"
import { productService } from "@/services/product.service"

// How many products to probe for a ready targeting profile before giving up;
// keeps the dashboard cheap for clients with long product lists.
const MAX_ICP_PROBES = 5

export interface SetupState {
  loading: boolean
  brandProfileDone: boolean
  productDone: boolean
  targetingDone: boolean
  campaignDone: boolean
  /** The first product's id, for deep-linking the targeting step. */
  firstProductId: number | null
  allDone: boolean
}

/** Read the four setup signals in parallel; every failure counts as not-done. */
export function useSetupState(): SetupState {
  const [state, setState] = useState<SetupState>({
    loading: true,
    brandProfileDone: false,
    productDone: false,
    targetingDone: false,
    campaignDone: false,
    firstProductId: null,
    allDone: false,
  })

  useEffect(() => {
    let active = true
    const load = async () => {
      const [brand, products, campaigns] = await Promise.allSettled([
        brandProfileService.get(),
        productService.list({ limit: MAX_ICP_PROBES }),
        campaignService.list({ limit: 1 }),
      ])

      const brandProfileDone =
        brand.status === "fulfilled" &&
        [
          brand.value.value_proposition,
          brand.value.market_positioning,
          brand.value.email_tone,
          brand.value.email_opening,
          brand.value.email_closing,
          brand.value.closing_question,
          brand.value.dos_and_donts,
          brand.value.competitors,
        ].some((v) => !!v?.trim())

      const productItems =
        products.status === "fulfilled" ? products.value.items : []
      const productDone = productItems.length > 0
      const firstProductId = productItems[0]?.id ?? null

      const campaignDone =
        campaigns.status === "fulfilled" &&
        (campaigns.value.items.length > 0 || (campaigns.value.total ?? 0) > 0)

      // A targeting profile counts once any probed product has one ready.
      const probes = await Promise.allSettled(
        productItems.slice(0, MAX_ICP_PROBES).map((p) => icpService.get(p.id)),
      )
      const targetingDone = probes.some(
        (r) => r.status === "fulfilled" && r.value.status === "ready",
      )

      if (!active) return
      setState({
        loading: false,
        brandProfileDone,
        productDone,
        targetingDone,
        campaignDone,
        firstProductId,
        allDone: brandProfileDone && productDone && targetingDone && campaignDone,
      })
    }
    void load()
    return () => {
      active = false
    }
  }, [])

  return state
}
