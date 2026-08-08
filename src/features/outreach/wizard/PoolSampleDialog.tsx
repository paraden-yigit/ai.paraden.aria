import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { ContactPoolSample } from "@/types/outreach"

/** Company size as the provider knows it: an exact headcount when it has one,
 * otherwise the band it puts them in. */
function size(sample: ContactPoolSample): string {
  if (sample.company_headcount != null) {
    return new Intl.NumberFormat("en-GB").format(sample.company_headcount)
  }
  return sample.company_headcount_range ?? "—"
}

interface PoolSampleDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  samples: ContactPoolSample[]
}

/**
 * A page of the people the profile currently matches.
 *
 * Nameless by design — the point is to check the aim ("these are agency
 * marketing managers, not enterprise CMOs") before anyone commits to writing to
 * them, and a name adds nothing to that judgement.
 */
export function PoolSampleDialog({
  open,
  onOpenChange,
  samples,
}: PoolSampleDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[85vh] flex-col sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>A sample of the pool</DialogTitle>
          <DialogDescription>
            {samples.length} people from the first page of this profile's
            matches, as the provider describes them — anyone whose company it
            could not name is left out. No names: this is a sample of who is out
            there, not a list to write to.
          </DialogDescription>
        </DialogHeader>

        {/* The whole page is here, so the table scrolls inside the dialog
          * rather than the dialog growing past the viewport. The header stays
          * put — fifty rows of "Seniority" is unreadable without it. */}
        <div className="min-h-0 flex-1 overflow-auto rounded-lg border">
          <Table>
            <TableHeader className="sticky top-0 z-10 bg-card">
              <TableRow>
                <TableHead>Company</TableHead>
                <TableHead>Domain</TableHead>
                <TableHead>Sector</TableHead>
                <TableHead>Size</TableHead>
                <TableHead>Job title</TableHead>
                <TableHead>Function</TableHead>
                <TableHead>Seniority</TableHead>
                <TableHead>Location</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {samples.map((sample, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">
                    {sample.company_name ?? "—"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {sample.company_domain ?? "—"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {sample.company_industry ?? "—"}
                  </TableCell>
                  <TableCell className="text-muted-foreground tabular-nums">
                    {size(sample)}
                  </TableCell>
                  <TableCell>{sample.job_title ?? "—"}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {sample.job_function ?? "—"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {sample.seniority ?? "—"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {sample.location ?? "—"}
                    {sample.location_is_company && sample.location && (
                      // Their company's head office, not where they are — a
                      // different claim, and worth not blurring.
                      <span className="ml-1 text-xs opacity-70">(HQ)</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </DialogContent>
    </Dialog>
  )
}
