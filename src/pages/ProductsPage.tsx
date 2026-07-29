import { useCallback, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Plus } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { DataState } from "@/components/DataState"
import { PaginationFooter } from "@/components/PaginationFooter"
import { ConfirmDialog } from "@/components/ConfirmDialog"
import { ProductCards } from "@/features/products/ProductCards"
import { useAuth } from "@/features/auth/useAuth"
import { PERMISSIONS } from "@/lib/permissions"
import { usePaginatedList } from "@/hooks/usePaginatedList"
import { productService } from "@/services/product.service"
import { ApiError } from "@/services/http"
import type { Product } from "@/types/product"

export function ProductsPage() {
  // Managing products (create/edit/delete) needs the "products_manage"
  // permission; without it the list is read-only.
  const { hasPermission } = useAuth()
  const canManage = hasPermission(PERMISSIONS.productsManage)
  const navigate = useNavigate()

  const fetchProducts = useCallback(
    (params: { skip?: number; limit?: number }) => productService.list(params),
    [],
  )

  const {
    items: products,
    total,
    page,
    setPage,
    skip,
    hasNextPage,
    loading,
    error,
    refetch,
  } = usePaginatedList<Product>(fetchProducts)

  const [productToDelete, setProductToDelete] = useState<Product | null>(null)
  const [deleting, setDeleting] = useState(false)

  function startCreate() {
    navigate("/products/new")
  }

  async function handleDelete() {
    if (!productToDelete) return
    setDeleting(true)
    try {
      await productService.remove(productToDelete.id)
      toast.success(`Product "${productToDelete.name}" deleted.`)
      setProductToDelete(null)
      refetch()
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to delete product.")
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Products</h1>
          <p className="text-muted-foreground">
            {canManage
              ? "Manage your products."
              : "Products you have access to."}
          </p>
        </div>
        {canManage && (
          <Button onClick={startCreate}>
            <Plus className="size-4" />
            New product
          </Button>
        )}
      </div>

      <DataState
        loading={loading}
        error={error}
        isEmpty={products.length === 0}
        emptyMessage={
          canManage
            ? "No products yet. Products teach Paraden what you sell, and every campaign starts from one."
            : "No products yet. You'll see products here once an owner gives you access."
        }
        emptyAction={
          canManage ? (
            <Button onClick={startCreate}>
              <Plus className="size-4" />
              Create your first product
            </Button>
          ) : undefined
        }
        onRetry={refetch}
      >
        <ProductCards
          products={products}
          onDelete={canManage ? setProductToDelete : undefined}
        />
        <PaginationFooter
          page={page}
          skip={skip}
          count={products.length}
          total={total}
          hasNextPage={hasNextPage}
          onPrev={() => setPage((p) => Math.max(0, p - 1))}
          onNext={() => setPage((p) => p + 1)}
        />
      </DataState>

      <ConfirmDialog
        open={productToDelete !== null}
        onOpenChange={(open) => !open && setProductToDelete(null)}
        title="Delete product?"
        description={
          productToDelete
            ? `This will permanently delete "${productToDelete.name}". This action cannot be undone.`
            : ""
        }
        confirmLabel="Delete"
        destructive
        loading={deleting}
        onConfirm={handleDelete}
      />
    </div>
  )
}
