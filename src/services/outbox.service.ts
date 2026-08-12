import { buildQuery } from "@/lib/query"
import type { ListResult, PaginationParams } from "@/types/api"
import type { OutboxItem } from "@/types/outbox"
import { apiClient } from "./http"
import { normalizeList } from "./normalizeList"

export const outboxService = {
  /** Everything queued to go out as the signed-in sender, soonest first. */
  async list(params: PaginationParams = {}): Promise<ListResult<OutboxItem>> {
    const data = await apiClient.get<unknown>(
      `/api/outbox${buildQuery({ skip: params.skip, limit: params.limit })}`,
    )
    return normalizeList<OutboxItem>(data)
  },
}
