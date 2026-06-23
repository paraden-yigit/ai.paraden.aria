/**
 * Centralized runtime configuration, sourced from Vite env vars.
 * Keeping this in one place means the rest of the app never reads
 * `import.meta.env` directly.
 */
export const config = {
  apiBaseUrl: (import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000").replace(
    /\/$/,
    "",
  ),
  apiKey: import.meta.env.VITE_API_KEY ?? "",
  // Marketing site (ai.paraden) URL — used for the "back to site", waitlist, and
  // legal links on the login screen.
  marketingUrl: (
    import.meta.env.VITE_MARKETING_URL ?? "http://localhost:3000"
  ).replace(/\/$/, ""),
} as const
