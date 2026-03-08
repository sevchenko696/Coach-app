import * as SecureStore from 'expo-secure-store'
import { API_BASE_URL } from '../constants/config'
import { getCache, setCache } from './cache'

const TOKEN_KEY = 'healeasy_auth_token'

export class ApiError extends Error {
  status: number
  constructor(message: string, status: number) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

export async function getToken(): Promise<string | null> {
  return SecureStore.getItemAsync(TOKEN_KEY)
}

export async function setToken(token: string): Promise<void> {
  await SecureStore.setItemAsync(TOKEN_KEY, token)
}

export async function clearToken(): Promise<void> {
  await SecureStore.deleteItemAsync(TOKEN_KEY)
}

// Paths that should be cached for offline use
const CACHEABLE_PATHS = ['/api/content', '/api/faqs', '/api/auth/me']

/** Central fetch wrapper — injects Bearer token, handles errors, caches GET responses */
export async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const method = (options.method || 'GET').toUpperCase()
  const isGet = method === 'GET'
  const isCacheable = isGet && CACHEABLE_PATHS.some(p => path.startsWith(p))
  const cacheKey = path

  const token = await getToken()
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const url = `${API_BASE_URL}${path}`

  try {
    const response = await fetch(url, { ...options, headers })

    if (!response.ok) {
      if (response.status === 401) {
        await clearToken()
      }
      const body = await response.json().catch(() => ({}))
      throw new ApiError(
        body.error || `Request failed (${response.status})`,
        response.status
      )
    }

    const data: T = await response.json()

    // Cache successful GET responses
    if (isCacheable) {
      setCache(cacheKey, data).catch(() => {})
    }

    return data
  } catch (err) {
    // On network failure for cacheable GET requests, serve from cache
    if (isCacheable && err instanceof TypeError) {
      const cached = await getCache<T>(cacheKey)
      if (cached) return cached
    }
    throw err
  }
}
