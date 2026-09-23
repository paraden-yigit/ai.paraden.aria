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

/** The person's name as the sample carries it. */
function who(sample: ContactPoolSample): string {
  return (
    (sample.full_name ??
      [sample.first_name, sample.last_name].filter(Boolean).join(" ")).trim() ||
    "—"
  )
}

interface PoolSampleDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  samples: ContactPoolSample[]
}

/**
 * A page of the people the profile currently matches.
 *
 * Who they are, where they work and what they do — enough to check the aim
 * ("these are agency marketing managers, not enterprise CMOs") before anyone
 * commits to writing to them. Nothing here can contact them: no address, no
 * profile URL.
 *
 * Three columns, deliberately. The provider knows more about each person —
 * sector, headcount, seniority, location — but this table answers one question,
 * "are these the right people", and the name, the company and the title settle
 * it. The rest was mostly em dashes anyway: the search endpoint leaves those
 * fields empty, and nine columns of blanks read as a broken table rather than
 * as a provider that does not return them.
 */
export function PoolSampleDialog({
  open,
  onOpenChange,
  samples,
}: PoolSampleDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[85vh] flex-col sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>A sample of the pool</DialogTitle>
          <DialogDescription>
            {samples.length} people from the first page of this profile's
            matches, as the provider describes them — anyone whose company it
            could not name is left out. Nothing here can contact them: this is
            a sample of who is out there, not a list to write to.
          </DialogDescription>
        </DialogHeader>

        {/* The whole page is here, so the table scrolls inside the dialog
          * rather than the dialog growing past the viewport. The header stays
          * put — fifty rows deep, a column of job titles needs its label. */}
        <div className="min-h-0 flex-1 overflow-auto rounded-lg border">
          <Table>
            <TableHeader className="sticky top-0 z-10 bg-card">
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Company</TableHead>
                <TableHead>Job title</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {samples.map((sample, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium whitespace-nowrap">
                    {who(sample)}
                  </TableCell>
                  <TableCell className="font-medium">
                    {sample.company_name ?? "—"}
                  </TableCell>
                  <TableCell>{sample.job_title ?? "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </DialogContent>
    </Dialog>
  )
}
