import type { CtaTypeOption } from "@/types/ctaType"
import { apiClient } from "./http"

/**
 * Read-only access to the admin-curated CTA type catalog. The campaign wizard's
 * "Call to action" step lists these for the user to pick from.
 */
export const ctaTypeService = {
  list(): Promise<CtaTypeOption[]> {
    return apiClient.get<CtaTypeOption[]>("/api/cta-types")
  },
}
