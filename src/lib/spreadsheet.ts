import * as XLSX from "xlsx"

/** File extensions the upload accepts, and the `accept` attribute for them. */
export const SPREADSHEET_EXTENSIONS = [".csv", ".xlsx", ".xls"] as const
export const SPREADSHEET_ACCEPT =
  ".csv,.xlsx,.xls,text/csv," +
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet," +
  "application/vnd.ms-excel"

/** Whether this looks like a file we can parse, by extension. */
export function isSpreadsheetFile(file: File): boolean {
  return SPREADSHEET_EXTENSIONS.some((ext) =>
    file.name.toLowerCase().endsWith(ext),
  )
}

/**
 * Every cell in the first column of a spreadsheet, header row included.
 *
 * Unlike `parseCsvFile`, this assumes nothing about a header: a file of domains
 * usually has none, and whichever it has, a row that is not a domain is dropped
 * by whoever reads these values. Blank cells are skipped.
 */
export async function readFirstColumn(file: File): Promise<string[]> {
  const buffer = await file.arrayBuffer()

  let sheet: XLSX.WorkSheet | undefined
  try {
    const workbook = XLSX.read(buffer, { type: "array" })
    sheet = workbook.Sheets[workbook.SheetNames[0]]
  } catch {
    sheet = undefined
  }
  if (!sheet) {
    throw new Error(
      "We couldn't read this file. Please upload a CSV or Excel file.",
    )
  }

  const matrix = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
    header: 1,
    blankrows: false,
    defval: "",
  })

  return matrix
    .map((row) => String((row as unknown[])[0] ?? "").trim())
    .filter(Boolean)
}

export interface ParsedCsv {
  /** Trimmed header cells from the first row. */
  headers: string[]
  /** Data rows, each padded to `headers.length` (cells trimmed to strings). */
  rows: string[][]
}

/**
 * Parse a user-selected spreadsheet into headers + rows.
 *
 * CSV and xlsx alike: SheetJS reads both from the same bytes and this only ever
 * looked at the first sheet, so accepting workbooks was a matter of letting them
 * through the file picker rather than of parsing them differently. A workbook
 * with several sheets uses the first, which is where an export puts its data.
 *
 * Throws a user-facing Error when the file can't be read, has no header row, or
 * has no data rows.
 */
export async function parseCsvFile(file: File): Promise<ParsedCsv> {
  const buffer = await file.arrayBuffer()

  let sheet: XLSX.WorkSheet
  try {
    const workbook = XLSX.read(buffer, { type: "array" })
    const firstSheetName = workbook.SheetNames[0]
    sheet = workbook.Sheets[firstSheetName]
  } catch {
    throw new Error(
      "We couldn't read this file. Please upload a CSV or Excel file.",
    )
  }
  if (!sheet) {
    throw new Error(
      "We couldn't read this file. Please upload a CSV or Excel file.",
    )
  }

  const matrix = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
    header: 1,
    blankrows: false,
    defval: "",
  })

  if (matrix.length === 0) {
    throw new Error("This file is empty.")
  }

  const headers = (matrix[0] as unknown[]).map((cell) =>
    String(cell ?? "").trim(),
  )
  if (headers.every((h) => h === "")) {
    throw new Error("This file has no column headers in its first row.")
  }

  const rows = matrix
    .slice(1)
    .map((row) =>
      headers.map((_, i) => String((row as unknown[])[i] ?? "").trim()),
    )
    // Drop rows where every cell is blank.
    .filter((cells) => cells.some((cell) => cell !== ""))

  if (rows.length === 0) {
    throw new Error("This file has headers but no data rows.")
  }

  return { headers, rows }
}
