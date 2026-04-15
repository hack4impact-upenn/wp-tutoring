/** In dev, prefer same-origin /api + Vite proxy so we don't hit the wrong process on :8000. */
function resolveApiBase(): string {
  const raw = import.meta.env.VITE_API_BASE_URL
  const explicit =
    typeof raw === 'string' && raw.trim() !== '' ? raw.replace(/\/$/, '') : ''

  if (import.meta.env.DEV) {
    if (!explicit) return ''
    // Direct loopback :8000 often points at a stale/wrong server; use Vite proxy instead.
    if (
      explicit === 'http://127.0.0.1:8000' ||
      explicit === 'http://localhost:8000'
    ) {
      return ''
    }
    return explicit
  }

  return explicit || 'http://127.0.0.1:8000'
}

const API_BASE_URL = resolveApiBase()

export class APIError extends Error {
  status: number
  constructor(message: string, status: number) {
    super(message)
    this.status = status
  }
}

export async function apiFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`

  let response: Response
  try {
    response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    })
  } catch {
    throw new APIError(
      `Cannot reach the API. Start the backend (e.g. npm run dev:backend from the repo root). ` +
        `In development, /api is proxied to the URL in VITE_DEV_API_PROXY (default http://127.0.0.1:8000). ` +
        `Restart Vite after changing VITE_* env vars.`,
      0,
    )
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => null)
    const detail = errorData?.detail
    const message =
      (typeof detail === 'string' ? detail : Array.isArray(detail) ? JSON.stringify(detail) : detail?.message) ||
      errorData?.error ||
      `API request failed: ${response.status}`
    throw new APIError(message, response.status)
  }

  const rawText = await response.text()
  if (!rawText.trim()) {
    return {} as T
  }
  try {
    return JSON.parse(rawText) as T
  } catch {
    throw new APIError('API returned invalid JSON', response.status)
  }
}

const ADMIN_TOKEN_KEY = 'wptp_token'

export function getAdminToken(): string | null {
  if (typeof localStorage === 'undefined') return null
  return localStorage.getItem(ADMIN_TOKEN_KEY)
}
