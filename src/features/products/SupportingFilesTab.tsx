import { useEffect, useRef, useState } from "react"
import {
  CheckCircle2,
  Loader2,
  Trash2,
  TriangleAlert,
  Upload,
} from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
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
import type { ExtractionStatus, ProductFile } from "@/types/product"

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
}

export function SupportingFilesTab({ productId }: SupportingFilesTabProps) {
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
  const [fileToDelete, setFileToDelete] = useState<ProductFile | null>(null)
  const [deleting, setDeleting] = useState(false)

  // Poll while any file is still being extracted so the status badge advances.
  const hasPending = (files ?? []).some(
    (f) => f.extraction_status === "queued" || f.extraction_status === "processing",
  )
  useEffect(() => {
    if (!hasPending) return
    const id = setInterval(refetch, 2500)
    return () => clearInterval(id)
  }, [hasPending, refetch])

  async function handleUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    // Reset the input so the same file can be re-selected later.
    event.target.value = ""
    if (!file) return
    setUploading(true)
    try {
      await productService.uploadFile(productId, file)
      toast.success(`"${file.name}" uploaded.`)
      refetch()
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to upload file.")
    } finally {
      setUploading(false)
    }
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
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">
            Supporting files
          </h2>
          <p className="text-muted-foreground">
            Upload documents (PDF, Word, Excel, text, RTF, or images). We extract
            their text content automatically.
          </p>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT}
          className="hidden"
          onChange={handleUpload}
        />
        <Button onClick={() => inputRef.current?.click()} disabled={uploading}>
          {uploading ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Upload className="size-4" />
          )}
          Upload file
        </Button>
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
                <TableHead>Size</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Uploaded</TableHead>
                <TableHead className="w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {(files ?? []).map((file) => (
                <TableRow key={file.id}>
                  <TableCell className="font-medium">{file.filename}</TableCell>
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
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </DataState>

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
