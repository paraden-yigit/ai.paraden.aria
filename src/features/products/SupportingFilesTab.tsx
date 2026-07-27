import { useEffect, useRef, useState } from "react"
import {
  CheckCircle2,
  ChevronDown,
  Link2,
  Loader2,
  Plus,
  Trash2,
  TriangleAlert,
  Upload,
} from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { AddFileFromUrlDialog } from "@/features/products/AddFileFromUrlDialog"
import { FileCategoryModal } from "@/features/products/wizard/FileCategoryModal"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { DataState } from "@/components/DataState"
import { ConfirmDialog } from "@/components/ConfirmDialog"
import { formatDateTime } from "@/lib/format"
import { useAsync } from "@/hooks/useAsync"
import { productService } from "@/services/product.service"
import { ApiError } from "@/services/http"
import {
  fileCategoryLabel,
  type ExtractionStatus,
  type ProductFile,
} from "@/types/product"

// Accepted upload types (kept in sync with the API's allowed list).
const ACCEPT =
  ".pdf,.doc,.docx,.xls,.xlsx,.txt,.md,.rtf,.jpg,.jpeg,.png," +
  "application/pdf," +
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document," +
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet," +
  "application/vnd.ms-excel,text/plain,text/markdown,text/rtf,application/rtf," +
  "image/jpeg,image/png"

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  const units = ["KB", "MB", "GB"]
  let value = bytes / 1024
  let unit = 0
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024
    unit += 1
  }
  return `${value.toFixed(1)} ${units[unit]}`
}

function StatusBadge({
  status,
  error,
}: {
  status: ExtractionStatus
  error: string | null
}) {
  if (status === "completed") {
    return (
      <Badge variant="secondary" className="gap-1">
        <CheckCircle2 className="size-3" />
        Extracted
      </Badge>
    )
  }
  if (status === "failed") {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge variant="destructive" className="cursor-default gap-1">
            <TriangleAlert className="size-3" />
            Failed
          </Badge>
        </TooltipTrigger>
        <TooltipContent>{error || "Extraction failed."}</TooltipContent>
      </Tooltip>
    )
  }
  // queued or processing
  return (
    <Badge variant="outline" className="gap-1">
      <Loader2 className="size-3 animate-spin" />
      {status === "processing" ? "Processing" : "Queued"}
    </Badge>
  )
}

interface SupportingFilesTabProps {
  productId: number
  /** Hide upload / delete controls and disable drag-drop (non-owners). */
  readOnly?: boolean
}

export function SupportingFilesTab({
  productId,
  readOnly = false,
}: SupportingFilesTabProps) {
  const {
    data: files,
    loading,
    error,
    refetch,
  } = useAsync<ProductFile[]>(
    () => productService.listFiles(productId),
    [productId],
  )

  const inputRef = useRef<HTMLInputElement | null>(null)
  const [uploading, setUploading] = useState(false)
  const [urlDialogOpen, setUrlDialogOpen] = useState(false)
  const [dragging, setDragging] = useState(false)
  const [fileToDelete, setFileToDelete] = useState<ProductFile | null>(null)
  const [deleting, setDeleting] = useState(false)
  // A file selected/dropped awaits a category in the modal before it's uploaded.
  const [pendingFile, setPendingFile] = useState<File | null>(null)

  // Poll while any file is still being extracted so the status badge advances.
  const hasPending = (files ?? []).some(
    (f) => f.extraction_status === "queued" || f.extraction_status === "processing",
  )
  useEffect(() => {
    if (!hasPending) return
    const id = setInterval(refetch, 2500)
    return () => clearInterval(id)
  }, [hasPending, refetch])

  async function uploadFile(file: File, category: string) {
    setUploading(true)
    try {
      await productService.uploadFile(productId, file, category)
      toast.success(`"${file.name}" uploaded.`)
      refetch()
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to upload file.")
    } finally {
      setUploading(false)
    }
  }

  function handleUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    // Reset the input so the same file can be re-selected later.
    event.target.value = ""
    if (!file) return
    // Tag the file before uploading it.
    setPendingFile(file)
  }

  function handleDrop(event: React.DragEvent<HTMLDivElement>) {
    if (readOnly) return
    event.preventDefault()
    setDragging(false)
    if (uploading) return
    const file = event.dataTransfer.files?.[0]
    if (file) setPendingFile(file)
  }

  function handleDragOver(event: React.DragEvent<HTMLDivElement>) {
    // Only react to file drags, and keep the drop effect while hovering.
    if (readOnly) return
    if (!Array.from(event.dataTransfer.types).includes("Files")) return
    event.preventDefault()
    if (!dragging) setDragging(true)
  }

  function handleDragLeave(event: React.DragEvent<HTMLDivElement>) {
    // Ignore leaves fired while moving between child elements.
    if (event.currentTarget.contains(event.relatedTarget as Node | null)) return
    setDragging(false)
  }

  async function handleDelete() {
    if (!fileToDelete) return
    setDeleting(true)
    try {
      await productService.removeFile(productId, fileToDelete.id)
      toast.success(`"${fileToDelete.filename}" deleted.`)
      setFileToDelete(null)
      refetch()
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to delete file.")
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div
      className="relative space-y-6"
      onDragEnter={handleDragOver}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {dragging && (
        <div className="pointer-events-none absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-primary bg-background/80 text-center backdrop-blur-sm">
          <Upload className="size-6 text-primary" />
          <p className="text-sm font-medium">Drop the file to upload it</p>
        </div>
      )}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">
            Supporting files
          </h2>
          <p className="text-muted-foreground">
            {readOnly
              ? "Documents attached to this product. Paraden reads these when writing this product's targeting profile and emails."
              : "Brochures, case studies, spec sheets: Paraden reads these when writing this product's targeting profile and emails. Upload PDF, Word, Excel, text, RTF or images up to 25 MB each, or add a page from a URL."}
          </p>
        </div>
        {!readOnly && (
          <>
            <input
              ref={inputRef}
              type="file"
              accept={ACCEPT}
              className="hidden"
              onChange={handleUpload}
            />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button disabled={uploading}>
                  {uploading ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Plus className="size-4" />
                  )}
                  Add supporting file
                  <ChevronDown className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onSelect={() => inputRef.current?.click()}>
                  <Upload className="size-4" />
                  Upload file
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => setUrlDialogOpen(true)}>
                  <Link2 className="size-4" />
                  From URL
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        )}
      </div>

      <DataState
        loading={loading}
        error={error}
        isEmpty={(files ?? []).length === 0}
        emptyMessage="No files uploaded yet."
        onRetry={refetch}
      >
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>File</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Size</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Uploaded</TableHead>
                {!readOnly && <TableHead className="w-12" />}
              </TableRow>
            </TableHeader>
            <TableBody>
              {(files ?? []).map((file) => (
                <TableRow key={file.id}>
                  <TableCell className="font-medium">{file.filename}</TableCell>
                  <TableCell>
                    {file.category ? (
                      <Badge variant="secondary" className="font-normal">
                        {fileCategoryLabel(file.category)}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatBytes(file.size_bytes)}
                  </TableCell>
                  <TableCell>
                    <StatusBadge
                      status={file.extraction_status}
                      error={file.extraction_error}
                    />
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDateTime(file.created_at)}
                  </TableCell>
                  {!readOnly && (
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8 text-destructive hover:text-destructive"
                        onClick={() => setFileToDelete(file)}
                      >
                        <Trash2 className="size-4" />
                        <span className="sr-only">Delete file</span>
                      </Button>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </DataState>

      <FileCategoryModal
        open={pendingFile !== null}
        onOpenChange={(open) => {
          if (!open) setPendingFile(null)
        }}
        fileName={pendingFile?.name ?? null}
        onConfirm={(category) => {
          if (pendingFile) void uploadFile(pendingFile, category)
          setPendingFile(null)
        }}
        onCancel={() => setPendingFile(null)}
      />

      <AddFileFromUrlDialog
        productId={productId}
        open={urlDialogOpen}
        onOpenChange={setUrlDialogOpen}
        onAdded={refetch}
      />

      <ConfirmDialog
        open={fileToDelete !== null}
        onOpenChange={(open) => !open && setFileToDelete(null)}
        title="Delete file?"
        description={
          fileToDelete
            ? `This will permanently delete "${fileToDelete.filename}". This action cannot be undone.`
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
