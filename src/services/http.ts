import { config } from "@/lib/config"
import type { ApiEnvelope, ValidationErrorItem } from "@/types/api"

/** Thrown for any non-successful API response. */
export class ApiError extends Error {
  status: number
  /** Validation error items, present on 422 responses. */
  details?: ValidationErrorItem[]

  constructor(message: string, status: number, details?: ValidationErrorItem[]) {
    super(message)
    this.name = "ApiError"
    this.status = status
    this.details = details
  }
}

interface RequestOptions {
  /** JSON-serializable request body. */
  body?: unknown
  /** Extra headers, merged over the defaults. */
  headers?: Record<string, string>
  /** Set to true to skip the automatic 401 -> refresh -> retry flow. */
  skipRefresh?: boolean
  signal?: AbortSignal
}

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE"

const SAFE_METHODS = new Set<HttpMethod>(["GET"])
const CSRF_COOKIE = "paraden_csrf"
const CSRF_HEADER = "X-CSRF-Token"

/** Called when the session can no longer be recovered (refresh failed). */
let onUnauthorized: (() => void) | null = null
export function setUnauthorizedHandler(handler: (() => void) | null) {
  onUnauthorized = handler
}

/** Read a (non-httpOnly) cookie by name. */
function readCookie(name: string): string | null {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
  const match = document.cookie.match(new RegExp(`(?:^|; )${escaped}=([^;]*)`))
  return match ? decodeURIComponent(match[1]) : null
}

/** Single-flight refresh: concurrent 401s share one refresh request. */
let refreshPromise: Promise<void> | null = null

function buildHeaders(method: HttpMethod, options: RequestOptions): Headers {
  const headers = new Headers(options.headers)
  // FormData sets its own multipart Content-Type (with boundary); only default
  // to JSON for plain bodies.
  if (
    !headers.has("Content-Type") &&
    options.body !== undefined &&
    !(options.body instanceof FormData)
  ) {
    headers.set("Content-Type", "application/json")
  }
  // App-level key gates the whole API — sent on every request.
  if (!config.apiKey) {
    console.warn(
      "[http] VITE_API_KEY is not set; requests will be rejected by the API. " +
        "Set it in your .env file.",
    )
  }
  headers.set("X-API-Key", config.apiKey)
  // Double-submit CSRF: echo the JS-readable CSRF cookie on state-changing
  // requests. The session tokens themselves are httpOnly cookies the browser
  // attaches automatically (see `credentials: "include"`), so there is no
  // Authorization header.
  if (!SAFE_METHODS.has(method)) {
    const csrf = readCookie(CSRF_COOKIE)
    if (csrf) headers.set(CSRF_HEADER, csrf)
  }
  return headers
}

async function parseEnvelope<T>(response: Response): Promise<ApiEnvelope<T>> {
  let payload: unknown = null
  const text = await response.text()
  if (text) {
    try {
      payload = JSON.parse(text)
    } catch {
      payload = null
    }
  }

  // Endpoints normally return the { success, message, data } envelope.
  if (payload && typeof payload === "object" && "success" in payload) {
    return payload as ApiEnvelope<T>
  }
  // Fallback for endpoints that don't (e.g. /health): wrap the raw body.
  return {
    success: response.ok,
    message: response.ok ? "" : response.statusText,
    data: (payload as T) ?? null,
  }
}

async function rawRequest<T>(
  method: HttpMethod,
  path: string,
  options: RequestOptions,
): Promise<ApiEnvelope<T>> {
  const response = await fetch(`${config.apiBaseUrl}${path}`, {
    method,
    headers: buildHeaders(method, options),
    body:
      options.body === undefined
        ? undefined
        : options.body instanceof FormData
          ? options.body
          : JSON.stringify(options.body),
    // Send/receive the httpOnly session cookies cross-subdomain.
    credentials: "include",
    signal: options.signal,
  })

  const envelope = await parseEnvelope<T>(response)

  if (!response.ok || !envelope.success) {
    const details = (envelope.data as { detail?: ValidationErrorItem[] } | null)?.detail
    throw new ApiError(
      envelope.message || response.statusText || "Request failed",
      response.status,
      Array.isArray(details) ? details : undefined,
    )
  }

  return envelope
}

/** Rotate the session via the httpOnly refresh cookie (single-flight). */
function refreshSession(): Promise<void> {
  if (refreshPromise) return refreshPromise

  refreshPromise = rawRequest("POST", "/api/auth/refresh", { skipRefresh: true })
    .then(() => undefined)
    .finally(() => {
      refreshPromise = null
    })

  return refreshPromise
}

async function request<T>(
  method: HttpMethod,
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  try {
    const envelope = await rawRequest<T>(method, path, options)
    return envelope.data as T
  } catch (error) {
    const canRefresh =
      error instanceof ApiError && error.status === 401 && !options.skipRefresh

    if (!canRefresh) throw error

    try {
      await refreshSession()
    } catch {
      // Session is unrecoverable — drop to logged-out so ProtectedRoute sends
      // the user to /login.
      onUnauthorized?.()
      throw error
    }

    // Retry once now that the session cookies have been refreshed.
    const envelope = await rawRequest<T>(method, path, { ...options, skipRefresh: true })
    return envelope.data as T
  }
}

/** Thin, typed HTTP client over the API. Every service builds on this. */
export const apiClient = {
  get: <T>(path: string, options?: RequestOptions) => request<T>("GET", path, options),
  post: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>("POST", path, { ...options, body }),
  put: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>("PUT", path, { ...options, body }),
  patch: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>("PATCH", path, { ...options, body }),
  delete: <T>(path: string, options?: RequestOptions) =>
    request<T>("DELETE", path, options),
}
