// Shared company-filter option lists, used by both the company search form
// (src/features/fullenrich/CompanySearchForm.tsx) and the campaign ICP editor
// (src/features/campaigns/ICPForm.tsx). These mirror the backend
// app/icp_taxonomy.py (COMPANY_TYPES, REVENUE_RANGES).

// Multi-select option list, matching the company create form's dropdown.
export const COMPANY_TYPES: string[] = [
  "Partnership",
  "Nonprofit",
  "Educational",
  "Privately Held",
  "Public Company",
  "Self-Owned",
  "Self-Employed",
  "Government Agency",
]

// Headcount buckets map to FullEnrich's numeric `headcounts` min/max ranges.
export const HEADCOUNT_RANGES: { label: string; min: number; max?: number }[] = [
  { label: "1-10", min: 1, max: 10 },
  { label: "11-50", min: 11, max: 50 },
  { label: "51-200", min: 51, max: 200 },
  { label: "201-500", min: 201, max: 500 },
  { label: "501-1000", min: 501, max: 1000 },
  { label: "1001-5000", min: 1001, max: 5000 },
  { label: "5001-10000", min: 5001, max: 10000 },
  { label: "10001+", min: 10001 },
]

export const HEADCOUNT_RANGE_LABELS = HEADCOUNT_RANGES.map((r) => r.label)

// Revenue brackets, passed through to FullEnrich's `revenue_ranges` filter.
export const REVENUE_RANGES: string[] = [
  "<$1M",
  "$1M-$2M",
  "$2M-$5M",
  "$5M-$10M",
  "$10M-$50M",
  "$50M-$100M",
  "$100M-$500M",
  "$500M-$1B",
  ">$1B",
]
