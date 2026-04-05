const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000"

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
        "Content-Type": "application/json",
        ...options.headers,
      },
    })
  } catch {
    throw new APIError(
      `Cannot reach the API at ${API_BASE_URL}. Use the same computer the server runs on, confirm ` +
        `uvicorn is listening (e.g. port 8000), and restart Vite after changing frontend/.env.`,
      0,
    )
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => null)
    const detail = errorData?.detail
    const message =
      (typeof detail === "string" ? detail : Array.isArray(detail) ? JSON.stringify(detail) : detail?.message) ||
      errorData?.error ||
      `API request failed: ${response.status}`
    throw new APIError(message, response.status)
  }

  const raw = await response.text()
  if (!raw.trim()) {
    return {} as T
  }
  try {
    return JSON.parse(raw) as T
  } catch {
    throw new APIError("API returned invalid JSON", response.status)
  }
}

const ADMIN_TOKEN_KEY = "wptp_token"

export function getAdminToken(): string | null {
  if (typeof localStorage === "undefined") return null
  return localStorage.getItem(ADMIN_TOKEN_KEY)
}
