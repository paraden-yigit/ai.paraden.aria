import type { Icp } from "@/types/icp"

// Friendlier phrasings for the seniority taxonomy values when they appear in
// running text. Anything unmapped falls back to its lowercased form.
const SENIORITY_PHRASES: Record<string, string> = {
  Owner: "owners",
  Founder: "founders",
  "C-Level": "C-level executives",
  VP: "VPs",
  Head: "heads of department",
  Director: "directors",
  Manager: "managers",
  Senior: "senior staff",
  Entry: "entry-level staff",
  Intern: "interns",
}

/** Lowercase for running text while keeping short all-caps acronyms (IT, AI, HR). */
function smartLowercase(value: string): string {
  return value
    .split(" ")
    .map((word) =>
      word === word.toUpperCase() && word.length <= 4 ? word : word.toLowerCase(),
    )
    .join(" ")
}

/** "A", "A and B", "A, B and C", or "A, B, C and 4 more". */
function readableList(items: string[], max = 3, moreWord = "more"): string {
  if (items.length === 0) return ""
  const shown = items.slice(0, max)
  const rest = items.length - shown.length
  if (shown.length === 1) return rest > 0 ? `${shown[0]} and ${rest} ${moreWord}` : shown[0]
  const head = shown.slice(0, -1).join(", ")
  const last = shown[shown.length - 1]
  return rest > 0
    ? `${head}, ${last} and ${rest} ${moreWord}`
    : `${head} and ${last}`
}

function seniorityPhrase(values: string[]): string {
  return readableList(
    values.map((v) => SENIORITY_PHRASES[v] ?? v.toLowerCase()),
    3,
  )
}

function headcountPhrase(min: number | null, max: number | null): string {
  if (min != null && max != null) return `with ${min} to ${max} people`
  if (min != null) return `with at least ${min} people`
  if (max != null) return `with up to ${max} people`
  return ""
}

/**
 * Compose the profile into short plain-English sentences so a non-technical
 * user can read who their campaigns will look for. Purely derived from the
 * saved values, so it always reflects the current state. Empty fields are
 * simply skipped; a fully empty profile returns a single honest sentence.
 */
export function composeIcpSummary(icp: Icp): string[] {
  const sentences: string[] = []

  const who = seniorityPhrase(icp.seniority)
  const funcs = readableList(
    icp.job_functions.map(smartLowercase),
    3,
    "other departments",
  )
  if (who && funcs) {
    sentences.push(`We look for ${who} working in ${funcs}.`)
  } else if (who) {
    sentences.push(`We look for ${who}.`)
  } else if (funcs) {
    sentences.push(`We look for people working in ${funcs}.`)
  }

  // Industry names can contain their own commas ("Technology, Information and
  // Internet"), so show only two before folding the rest into a count.
  const industries = readableList(
    icp.industries.map(smartLowercase),
    2,
    "related sectors",
  )
  const size = headcountPhrase(icp.headcount_min, icp.headcount_max)
  if (industries && size) {
    sentences.push(`Their companies sit in ${industries}, ${size}.`)
  } else if (industries) {
    sentences.push(`Their companies sit in ${industries}.`)
  } else if (size) {
    sentences.push(`Their companies are ones ${size}.`)
  }

  const countries = readableList(icp.countries, 3, "other markets")
  if (countries) sentences.push(`Based in ${countries}.`)

  const themes = readableList(icp.keywords.map(smartLowercase), 4, "related themes")
  if (themes) sentences.push(`Matching themes like ${themes}.`)

  if (sentences.length === 0) {
    sentences.push(
      "This profile is empty so far. Fine-tune it below, or regenerate it from your product brief.",
    )
  }
  return sentences
}
