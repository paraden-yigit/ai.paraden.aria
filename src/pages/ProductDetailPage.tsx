import { useCallback, useState } from "react"
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom"
import { ArrowLeft, Trash2 } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DataState } from "@/components/DataState"
import { ConfirmDialog } from "@/components/ConfirmDialog"
import { ProductInfoView } from "@/features/products/ProductInfoView"
import { ProductICPTab } from "@/features/products/ProductICPTab"
import { ProductAccessTab } from "@/features/products/ProductAccessTab"
import { SupportingFilesTab } from "@/features/products/SupportingFilesTab"
import { useAuth } from "@/features/auth/useAuth"
import { PERMISSIONS } from "@/lib/permissions"
import { useAsync } from "@/hooks/useAsync"
import { productService } from "@/services/product.service"
import { ApiError } from "@/services/http"
import type { ProductUpdate } from "@/types/product"

export function ProductDetailPage() {
  const { id } = useParams<{ id: string }>()
  const productId = Number(id)
  const navigate = useNavigate()

  // Managing the product (editing fields/files/ICP and its access list) needs
  // the "products_manage" permission; without it the page is read-only and the
  // Access tab is hidden (trigger and ?tab=access deep-link both gated).
  const { hasPermission } = useAuth()
  const canManage = hasPermission(PERMISSIONS.productsManage)

  // The active tab is reflected in ?tab= so it can be deep-linked (e.g. the
  // campaign Contacts page sends users straight to the ICP tab).
  const [searchParams, setSearchParams] = useSearchParams()
  const tabParam = searchParams.get("tab")
  const activeTab =
    tabParam === "icp" || tabParam === "files"
      ? tabParam
      : tabParam === "access" && canManage
        ? "access"
        : "info"

  const fetcher = useCallback(() => productService.get(productId), [productId])
  const { data: product, loading, error, refetch } = useAsync(fetcher, [productId])

  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)

  async function handleSave(payload: ProductUpdate) {
    try {
      await productService.update(productId, payload)
      toast.success("Product saved.")
      refetch()
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to save product.")
      // Re-throw so the inline editor stays open for the user to retry.
      throw err
    }
  }

  async function handleDelete() {
    setDeleting(true)
    try {
      await productService.remove(productId)
      toast.success("Product deleted.")
      navigate("/products", { replace: true })
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to delete product.")
      setDeleting(false)
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <Button variant="ghost" size="sm" asChild className="-ml-2">
        <Link to="/products">
          <ArrowLeft className="size-4" />
          Back to products
        </Link>
      </Button>

      <DataState
        loading={loading}
        error={error}
        isEmpty={!product}
        emptyMessage="Product not found."
        onRetry={refetch}
      >
        {product && (
          <>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">
                {product.name}
              </h1>
            </div>

            <Tabs
              value={activeTab}
              onValueChange={(value) =>
                setSearchParams(value === "info" ? {} : { tab: value }, {
                  replace: true,
                })
              }
            >
              <TabsList>
                <TabsTrigger value="info">Product Info</TabsTrigger>
                <TabsTrigger value="files">Supporting Files</TabsTrigger>
                <TabsTrigger value="icp">ICP</TabsTrigger>
                {canManage && <TabsTrigger value="access">Access</TabsTrigger>}
              </TabsList>

              <TabsContent value="info" className="mt-4 space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Product information</CardTitle>
                    <CardDescription>
                      The product name and brief. These answers are used to
                      generate this product's outreach.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ProductInfoView
                      product={product}
                      onSave={handleSave}
                      readOnly={!canManage}
                    />
                  </CardContent>
                </Card>

                {canManage && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Delete product</CardTitle>
                      <CardDescription>
                        Permanently remove this product and all its data
                        (including uploaded files). This action cannot be undone.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => setConfirmDelete(true)}
                      >
                        <Trash2 className="size-4" />
                        Delete product
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="icp" className="mt-4">
                <ProductICPTab productId={productId} readOnly={!canManage} />
              </TabsContent>

              <TabsContent value="files" className="mt-4">
                <SupportingFilesTab productId={productId} readOnly={!canManage} />
              </TabsContent>

              {canManage && (
                <TabsContent value="access" className="mt-4">
                  <ProductAccessTab productId={productId} />
                </TabsContent>
              )}
            </Tabs>
          </>
        )}
      </DataState>

      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title="Delete product?"
        description={
          product
            ? `This will permanently delete "${product.name}". This action cannot be undone.`
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
