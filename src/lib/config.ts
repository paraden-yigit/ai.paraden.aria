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
  // Aria's own public origin. Needed to build an invite link that can be copied
  // out and pasted somewhere else — `window.location.origin` would work in the
  // browser, but a configured value is what makes the link right behind a proxy
  // or on a custom domain.
  appUrl: (
    import.meta.env.VITE_APP_URL ?? window.location.origin
  ).replace(/\/$/, ""),
} as const
