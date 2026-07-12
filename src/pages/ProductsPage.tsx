import { useCallback, useState } from "react"
import { Plus } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { DataState } from "@/components/DataState"
import { PaginationFooter } from "@/components/PaginationFooter"
import { ConfirmDialog } from "@/components/ConfirmDialog"
import { ProductCards } from "@/features/products/ProductCards"
import { ProductForm } from "@/features/products/ProductForm"
import { usePaginatedList } from "@/hooks/usePaginatedList"
import { productService } from "@/services/product.service"
import { ApiError } from "@/services/http"
import type { Product, ProductCreate } from "@/types/product"

export function ProductsPage() {
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

  const [createOpen, setCreateOpen] = useState(false)
  const [creating, setCreating] = useState(false)
  const [productToDelete, setProductToDelete] = useState<Product | null>(null)
  const [deleting, setDeleting] = useState(false)

  async function handleCreate(payload: ProductCreate) {
    setCreating(true)
    try {
      await productService.create(payload)
      toast.success(`Product "${payload.name}" created.`)
      setCreateOpen(false)
      refetch()
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to create product.")
    } finally {
      setCreating(false)
    }
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
          <p className="text-muted-foreground">Manage your products.</p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="size-4" />
          New product
        </Button>
      </div>

      <DataState
        loading={loading}
        error={error}
        isEmpty={products.length === 0}
        emptyMessage="No products yet. Products teach ARIA what you sell, and every campaign starts from one."
        emptyAction={
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="size-4" />
            Create your first product
          </Button>
        }
        onRetry={refetch}
      >
        <ProductCards products={products} onDelete={setProductToDelete} />
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

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New product</DialogTitle>
            <DialogDescription>Add a product to your list.</DialogDescription>
          </DialogHeader>
          <ProductForm
            onSubmit={handleCreate}
            onCancel={() => setCreateOpen(false)}
            submitting={creating}
            submitLabel="Create product"
          />
        </DialogContent>
      </Dialog>

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
