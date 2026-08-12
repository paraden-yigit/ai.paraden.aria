import { useRef, useState } from "react"
import { ClipboardList, Download, FileUp, Upload } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"
import { SPREADSHEET_ACCEPT } from "@/lib/spreadsheet"

/**
 * The two ways a list of company domains gets in: a file, or a paste.
 *
 * Shared by the wizard's Companies step and the dashboard's "add more" dialog,
 * because adding companies to a campaign that exists should not feel like a
 * different job from adding them to one that does not.
 */
export function DomainSource({
  onFile,
  onPaste,
}: {
  onFile: (file: File) => void
  onPaste: (text: string) => void
}) {
  const fileInput = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)
  const [pasted, setPasted] = useState("")

  return (
    <Tabs defaultValue="upload">
      <TabsList>
        <TabsTrigger value="upload">
          <Download className="size-4" />
          Upload file
        </TabsTrigger>
        <TabsTrigger value="paste">
          <ClipboardList className="size-4" />
          Paste manually
        </TabsTrigger>
      </TabsList>

      <TabsContent value="upload">
        <div
          onDragOver={(e) => {
            e.preventDefault()
            setDragging(true)
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault()
            setDragging(false)
            const file = e.dataTransfer.files?.[0]
            if (file) onFile(file)
          }}
          className={cn(
            "flex flex-col items-center rounded-xl border border-dashed px-6 py-10 text-center transition-colors",
            dragging && "border-primary bg-primary/5",
          )}
        >
          <div className="flex size-14 items-center justify-center rounded-full bg-primary/10 ring-8 ring-primary/5">
            <FileUp className="size-6 text-primary" aria-hidden />
          </div>
          <h3 className="mt-5 text-lg font-semibold">Upload company domains</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Your file must contain a single column with
          </p>
          <Badge variant="outline" className="mt-2 rounded-md px-3 py-1 font-normal">
            Company domains
          </Badge>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <span className="text-sm text-muted-foreground">Drag &amp; drop or</span>
            <input
              ref={fileInput}
              type="file"
              accept={SPREADSHEET_ACCEPT}
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) onFile(file)
                // Let the same file be chosen twice in a row.
                e.target.value = ""
              }}
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => fileInput.current?.click()}
            >
              <Upload className="size-4" />
              Select file
              <span className="text-muted-foreground">CSV, XLSX</span>
            </Button>
          </div>
        </div>
      </TabsContent>

      <TabsContent value="paste">
        <div className="space-y-3">
          <Textarea
            value={pasted}
            onChange={(e) => setPasted(e.target.value)}
            rows={8}
            placeholder={"acme.com\nhttps://www.globex.co.uk\ninitech.io"}
            aria-label="Company domains, one per line"
          />
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs text-muted-foreground">
              One per line. Full URLs are fine — we keep the domain.
            </p>
            <Button
              type="button"
              disabled={!pasted.trim()}
              onClick={() => {
                onPaste(pasted)
                setPasted("")
              }}
            >
              Add domains
            </Button>
          </div>
        </div>
      </TabsContent>
    </Tabs>
  )
}
