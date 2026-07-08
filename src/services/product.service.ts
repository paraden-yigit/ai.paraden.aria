import { buildQuery } from "@/lib/query"
import type { ListResult, PaginationParams } from "@/types/api"
import type {
  Product,
  ProductCreate,
  ProductFile,
  ProductUpdate,
} from "@/types/product"
import { apiClient } from "./http"
import { normalizeList } from "./normalizeList"

/**
 * Products service — wraps the user-scoped /api/products endpoints (including a
 * product's supporting files). The API scopes every call to the session's
 * client, so there's no client_id to pass. Methods are `this`-free so they can
 * be passed as references.
 */
export const productService = {
  async list(params: PaginationParams = {}): Promise<ListResult<Product>> {
    const data = await apiClient.get<unknown>(
      `/api/products${buildQuery({ skip: params.skip, limit: params.limit })}`,
    )
    return normalizeList<Product>(data)
  },

  get(id: number): Promise<Product> {
    return apiClient.get<Product>(`/api/products/${id}`)
  },

  create(payload: ProductCreate): Promise<Product> {
    return apiClient.post<Product>("/api/products/new", payload)
  },

  update(id: number, payload: ProductUpdate): Promise<Product> {
    return apiClient.patch<Product>(`/api/products/${id}`, payload)
  },

  remove(id: number): Promise<unknown> {
    return apiClient.delete(`/api/products/${id}`)
  },

  // --- Supporting files ---

  listFiles(productId: number): Promise<ProductFile[]> {
    return apiClient.get<ProductFile[]>(`/api/products/${productId}/files`)
  },

  uploadFile(productId: number, file: File): Promise<ProductFile> {
    const body = new FormData()
    body.append("file", file)
    return apiClient.post<ProductFile>(`/api/products/${productId}/files`, body)
  },

  removeFile(productId: number, fileId: number): Promise<unknown> {
    return apiClient.delete(`/api/products/${productId}/files/${fileId}`)
  },
}
