import * as XLSX from "xlsx"

/** A single data row, keyed by the file's column label (header cell). */
export type SpreadsheetRow = Record<string, string>

/** The parsed contents of an uploaded spreadsheet. */
export interface ParsedSpreadsheet {
  /** Column headers, in order, taken from the first row of the first sheet. */
  columns: string[]
  /** Data rows keyed by column label, with the header (label) row skipped. */
  rows: SpreadsheetRow[]
}

/**
 * Read an uploaded CSV or XLSX file: its column headers (first row) plus every
 * data row keyed by those headers. Only the first sheet is used. SheetJS handles
 * both formats from the same `read` call.
 *
 * The first row is treated as labels and skipped for the data rows — so callers
 * import the rows beneath the header, never the header itself.
 */
export async function parseSpreadsheet(file: File): Promise<ParsedSpreadsheet> {
  const buffer = await file.arrayBuffer()
  const workbook = XLSX.read(buffer, { type: "array" })

  const sheetName = workbook.SheetNames[0]
  if (!sheetName) {
    throw new Error("The file has no sheets.")
  }

  const sheet = workbook.Sheets[sheetName]
  // header: 1 → rows as arrays so we can read the raw header row verbatim.
  const matrix = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
    header: 1,
    blankrows: false,
    defval: "",
  })

  const headerRow = (matrix[0] ?? []).map((cell) => String(cell ?? "").trim())
  const columns = headerRow.filter((label) => label.length > 0)

  if (columns.length === 0) {
    throw new Error("Couldn't find a header row with column names.")
  }

  // Skip the first row (the labels) and key each remaining row by column label.
  const rows: SpreadsheetRow[] = matrix.slice(1).map((cells) => {
    const row: SpreadsheetRow = {}
    headerRow.forEach((label, index) => {
      if (label) row[label] = String(cells[index] ?? "").trim()
    })
    return row
  })

  return { columns, rows }
}
