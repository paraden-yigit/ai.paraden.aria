import { buildQuery } from "@/lib/query"
import type { ListResult, PaginationParams } from "@/types/api"
import type {
  Product,
  ProductAssignments,
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

  addFileFromUrl(productId: number, url: string): Promise<ProductFile> {
    return apiClient.post<ProductFile>(
      `/api/products/${productId}/files/from-url`,
      { url },
    )
  },

  removeFile(productId: number, fileId: number): Promise<unknown> {
    return apiClient.delete(`/api/products/${productId}/files/${fileId}`)
  },

  // --- Access assignments (owners only) ---

  /** The teams and users this product is assigned to. */
  getAssignments(productId: number): Promise<ProductAssignments> {
    return apiClient.get<ProductAssignments>(
      `/api/products/${productId}/assignments`,
    )
  },

  /** Replace the product's access list wholesale (empty = owner-only). */
  setAssignments(
    productId: number,
    payload: ProductAssignments,
  ): Promise<ProductAssignments> {
    return apiClient.put<ProductAssignments>(
      `/api/products/${productId}/assignments`,
      payload,
    )
  },
}
