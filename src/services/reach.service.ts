import { buildQuery } from "@/lib/query"
import type { ReachAllowance } from "@/types/outreach"
import { apiClient } from "./http"

/**
 * How much reach the signed-in user has in a month — their plan's per-seat
 * figure with add-ons included. The campaign wizard shows it beside the
 * allocation being made against it.
 */
export const reachService = {
  /** `excludeRunId` leaves a campaign's own claim out of `allocated`, so
   * editing one does not count it against itself. */
  allowance(excludeRunId?: number): Promise<ReachAllowance> {
    return apiClient.get<ReachAllowance>(
      `/api/reach/allowance${buildQuery({ exclude_run_id: excludeRunId })}`,
    )
  },
}
