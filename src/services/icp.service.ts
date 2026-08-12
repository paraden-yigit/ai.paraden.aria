import type { Icp, IcpUpdate } from "@/types/icp"
import { apiClient } from "./http"

/**
 * Product ICP service — wraps the /api/products/:id/icp endpoints. The API
 * scopes every call to the session's client. `get` throws an ApiError with
 * status 404 until an ICP has been generated for the product.
 */
export const icpService = {
  get(productId: number): Promise<Icp> {
    return apiClient.get<Icp>(`/api/products/${productId}/icp`)
  },

  generate(productId: number): Promise<Icp> {
    return apiClient.post<Icp>(`/api/products/${productId}/icp/generate`)
  },

  update(productId: number, payload: IcpUpdate): Promise<Icp> {
    return apiClient.patch<Icp>(`/api/products/${productId}/icp`, payload)
  },
}
