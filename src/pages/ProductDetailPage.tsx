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
import { SupportingFilesTab } from "@/features/products/SupportingFilesTab"
import { useAsync } from "@/hooks/useAsync"
import { productService } from "@/services/product.service"
import { ApiError } from "@/services/http"
import type { ProductUpdate } from "@/types/product"

export function ProductDetailPage() {
  const { id } = useParams<{ id: string }>()
  const productId = Number(id)
  const navigate = useNavigate()

  // The active tab is reflected in ?tab= so it can be deep-linked (e.g. the
  // campaign Contacts page sends users straight to the targeting tab). The old
  // "files" tab merged into Product Info, so its deep links land there.
  const [searchParams, setSearchParams] = useSearchParams()
  const tabParam = searchParams.get("tab")
  const activeTab = tabParam === "icp" ? "icp" : "info"

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

  // The nine brief answers, for the completeness hint. Empty answers degrade
  // targeting and email quality, so the surface says how far along it is.
  const briefFields = product
    ? [
        product.offering,
        product.audience,
        product.problem_solved,
        product.buyer_challenges,
        product.proof_points,
        product.buyer_outcome,
        product.winning_emails,
        product.supporting_data,
        product.email_approver,
      ]
    : []
  const answered = briefFields.filter((v) => !!v?.trim()).length

  return (
    <div className="mx-auto max-w-6xl space-y-6">
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
                <TabsTrigger value="icp">Targeting</TabsTrigger>
              </TabsList>

              <TabsContent value="info" className="mt-4 space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Teach ARIA about this product</CardTitle>
                    <CardDescription>
                      {answered} of 9 questions answered. Everything here feeds
                      the targeting profile and the outreach emails: the more
                      you answer, the better both get.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ProductInfoView product={product} onSave={handleSave} />
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <SupportingFilesTab productId={productId} />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Delete product</CardTitle>
                    <CardDescription>
                      Permanently remove this product and all its data (including
                      uploaded files). This action cannot be undone.
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
              </TabsContent>

              <TabsContent value="icp" className="mt-4">
                <ProductICPTab productId={productId} />
              </TabsContent>
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
