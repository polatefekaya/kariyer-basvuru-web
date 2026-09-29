import config from '@/config/config'
import { supabase } from '@/lib/supabase'
import type { ApiResponse } from './types'

/**
 * Thrown for any non-2xx response (and for network / timeout failures with status 0).
 * `body` is the parsed JSON when the backend sent one — usually the ApiResponse envelope,
 * so `err.body?.message` is the user-facing text.
 */
export class ApiError extends Error {
  readonly status: number
  readonly method: string
  readonly url: string
  readonly body?: unknown

  constructor(status: number, method: string, url: string, body?: unknown) {
    super(
      (body && typeof body === 'object' && 'message' in body && typeof body.message === 'string'
        ? body.message
        : null) ?? (status === 0 ? `Network error: ${method} ${url}` : `${status} ${method} ${url}`),
    )
    this.status = status
    this.method = method
    this.url = url
    this.body = body
    this.name = 'ApiError'
  }
  /** True for 401/403 — the caller may want to redirect to login. */
  get isAuth() {
    return this.status === 401 || this.status === 403
  }
}

export interface RequestOptions {
  /** Override the base URL — `recruiting` targets kariyer-recruiting-service. */
  baseUrl?: string
  /**
   * Query string values — any plain object (interfaces welcome). Primitives are stringified,
   * arrays become repeated keys, null/undefined are dropped, anything else is ignored.
   */
  params?: object
  headers?: Record<string, string>
  signal?: AbortSignal
  /** Override the default 15s timeout (ms); 0 disables. */
  timeoutMs?: number
  /** Skip the Authorization header (public endpoints). */
  anonymous?: boolean
}

const BASE_URL = (config.API_BASE_URL ?? '').replace(/\/+$/, '')
const RECRUITING_BASE_URL = (config.RECRUITING_API_URL ?? '').replace(/\/+$/, '')

/** Custom event dispatched when the session can't be refreshed — mirrors kariyer-zamani-web. */
export const AUTH_LOGOUT_EVENT = 'auth_logout_required'

// ---------------------------------------------------------------------------
// Auth: Bearer token from the Supabase session, proactively refreshed near expiry.
// One shared promise so concurrent requests never trigger parallel refreshes.
// ---------------------------------------------------------------------------
let refreshPromise: Promise<string | null> | null = null

function refreshToken(): Promise<string | null> {
  if (!supabase) return Promise.resolve(null)
  refreshPromise ??= supabase.auth
    .refreshSession()
    .then(({ data }) => data.session?.access_token ?? null)
    .catch(() => null)
    .finally(() => {
      refreshPromise = null
    })
  return refreshPromise
}

async function accessToken(): Promise<string | null> {
  if (!supabase) return null
  const { data, error } = await supabase.auth.getSession()
  const session = data.session
  if (error || !session) return null
  const secondsLeft = (session.expires_at ?? 0) - Math.floor(Date.now() / 1000)
  if (secondsLeft < 60) return (await refreshToken()) ?? session.access_token
  return session.access_token
}

// ---------------------------------------------------------------------------
// Core request
// ---------------------------------------------------------------------------
function buildUrl(path: string, params?: object, baseUrl: string = BASE_URL) {
  const url = /^https?:\/\//i.test(path) ? path : `${baseUrl}/${path.replace(/^\/+/, '')}`
  if (!params) return url
  const qs = new URLSearchParams()
  const isPrimitive = (v: unknown): v is string | number | boolean =>
    typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean'
  for (const [k, v] of Object.entries(params as Record<string, unknown>)) {
    if (v == null) continue
    if (Array.isArray(v)) v.filter(isPrimitive).forEach((item) => qs.append(k, String(item)))
    else if (isPrimitive(v)) qs.set(k, String(v))
  }
  const s = qs.toString()
  return s ? `${url}${url.includes('?') ? '&' : '?'}${s}` : url
}

async function parseBody(res: Response): Promise<unknown> {
  const text = await res.text()
  if (!text) return undefined
  try {
    return JSON.parse(text)
  } catch {
    return text
  }
}

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
  opts: RequestOptions = {},
  retried = false,
): Promise<T> {
  const url = buildUrl(path, opts.params, opts.baseUrl ?? BASE_URL)
  const headers: Record<string, string> = { Accept: 'application/json', ...opts.headers }

  const isFormData = typeof FormData !== 'undefined' && body instanceof FormData
  if (body !== undefined && !isFormData) headers['Content-Type'] = 'application/json'

  if (!opts.anonymous) {
    const token = await accessToken()
    if (token) headers.Authorization = `Bearer ${token}`
  }

  // Timeout via AbortController, composed with the caller's own signal.
  const controller = new AbortController()
  const timeoutMs = opts.timeoutMs ?? config.API_TIMEOUT_MS
  const timer =
    timeoutMs > 0
      ? setTimeout(() => controller.abort(new DOMException('Timeout', 'TimeoutError')), timeoutMs)
      : undefined
  opts.signal?.addEventListener('abort', () => controller.abort(opts.signal!.reason), { once: true })

  let res: Response
  try {
    res = await fetch(url, {
      method,
      headers,
      body: body === undefined ? undefined : isFormData ? (body as FormData) : JSON.stringify(body),
      signal: controller.signal,
    })
  } catch (e) {
    clearTimeout(timer)
    throw new ApiError(0, method, url, e)
  }
  clearTimeout(timer)

  // 401 → refresh once and replay (never for auth endpoints themselves).
  if (res.status === 401 && !retried && !opts.anonymous && !/\/(login|register)\b/.test(url)) {
    const token = await refreshToken()
    if (token) return request<T>(method, path, body, opts, true)
    window.dispatchEvent(new CustomEvent(AUTH_LOGOUT_EVENT, { detail: { url } }))
  }

  const data = await parseBody(res)
  if (!res.ok) {
    if (config.IS_DEV && res.status >= 500) console.error(`[api] ${res.status} ${method} ${url}`, data)
    throw new ApiError(res.status, method, url, data)
  }
  return data as T
}

/**
 * Typed HTTP client. `T` is the *raw* response body; use `unwrap()` (or the `api.data.*`
 * variants) when the backend returns the `{ success, data }` envelope.
 *
 *   const job = await api.data.get<Job>(`/jobs/${id}`)          // → Job
 *   const raw = await api.get<ApiResponse<Job>>(`/jobs/${id}`)  // → envelope
 */
export const api = {
  get: <T>(path: string, opts?: RequestOptions) => request<T>('GET', path, undefined, opts),
  post: <T>(path: string, body?: unknown, opts?: RequestOptions) => request<T>('POST', path, body, opts),
  put: <T>(path: string, body?: unknown, opts?: RequestOptions) => request<T>('PUT', path, body, opts),
  patch: <T>(path: string, body?: unknown, opts?: RequestOptions) => request<T>('PATCH', path, body, opts),
  delete: <T>(path: string, body?: unknown, opts?: RequestOptions) => request<T>('DELETE', path, body, opts),

  /** Same verbs, but unwrap the `ApiResponse<T>` envelope and throw when `success` is false. */
  data: {
    get: <T>(path: string, opts?: RequestOptions) => request<ApiResponse<T>>('GET', path, undefined, opts).then(unwrap),
    post: <T>(path: string, body?: unknown, opts?: RequestOptions) =>
      request<ApiResponse<T>>('POST', path, body, opts).then(unwrap),
    put: <T>(path: string, body?: unknown, opts?: RequestOptions) =>
      request<ApiResponse<T>>('PUT', path, body, opts).then(unwrap),
    patch: <T>(path: string, body?: unknown, opts?: RequestOptions) =>
      request<ApiResponse<T>>('PATCH', path, body, opts).then(unwrap),
    delete: <T>(path: string, body?: unknown, opts?: RequestOptions) =>
      request<ApiResponse<T>>('DELETE', path, body, opts).then(unwrap),
  },
}

export function unwrap<T>(res: ApiResponse<T>): T {
  if (res && typeof res === 'object' && 'success' in res && res.success === false) {
    throw new ApiError(200, 'RESPONSE', '', res)
  }
  return res.data
}

/**
 * kariyer-recruiting-service. Same auth and retry behaviour, different origin, and no
 * `{ success, data }` envelope — that service answers with the payload directly and with
 * `{ error: { code, message, details } }` on failure.
 */
const withRecruitingBase = (opts?: RequestOptions): RequestOptions => ({
  ...opts,
  baseUrl: RECRUITING_BASE_URL,
})

export const recruitingApi = {
  get: <T>(path: string, opts?: RequestOptions) => request<T>('GET', path, undefined, withRecruitingBase(opts)),
  post: <T>(path: string, body?: unknown, opts?: RequestOptions) =>
    request<T>('POST', path, body, withRecruitingBase(opts)),
  put: <T>(path: string, body?: unknown, opts?: RequestOptions) =>
    request<T>('PUT', path, body, withRecruitingBase(opts)),
  patch: <T>(path: string, body?: unknown, opts?: RequestOptions) =>
    request<T>('PATCH', path, body, withRecruitingBase(opts)),
  delete: <T>(path: string, body?: unknown, opts?: RequestOptions) =>
    request<T>('DELETE', path, body, withRecruitingBase(opts)),
}

/** Field errors from a recruiting-service `VALIDATION_ERROR`, keyed as the API sends them. */
export function recruitingFieldErrors(error: unknown): Record<string, string[]> {
  if (error instanceof ApiError && error.body && typeof error.body === 'object' && 'error' in error.body) {
    const details = (error.body as { error?: { details?: unknown } }).error?.details
    if (details && typeof details === 'object') return details as Record<string, string[]>
  }
  return {}
}

/** The error code from a recruiting-service failure, e.g. `INVALID_STATUS_TRANSITION`. */
export function recruitingErrorCode(error: unknown): string | null {
  if (error instanceof ApiError && error.body && typeof error.body === 'object' && 'error' in error.body) {
    const body = (error.body as { error?: { code?: string } }).error
    return body?.code ?? null
  }
  return null
}
