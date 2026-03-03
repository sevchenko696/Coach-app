import { apiFetch, setToken, clearToken, getToken } from './api'

interface LoginResponse {
  success: boolean
  user: { id: string; name: string }
  firstLogin: boolean
  token: string
}

interface MeResponse {
  user: {
    id: string
    name: string
    phone: string
    dob: string
    batch_id: string | null
    created_at: string
    batches?: { name: string; start_date: string; zoom_link: string | null } | null
  }
}

export interface AuthUser {
  id: string
  name: string
}

export async function login(phone: string, password: string): Promise<{ user: AuthUser; firstLogin: boolean }> {
  const data = await apiFetch<LoginResponse>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ phone, password }),
  })
  await setToken(data.token)
  return { user: data.user, firstLogin: data.firstLogin }
}

export async function logout(): Promise<void> {
  try {
    await apiFetch('/api/auth/logout', {
      method: 'POST',
      body: JSON.stringify({ role: 'user' }),
    })
  } catch {
    // Ignore errors during logout — clear token regardless
  }
  await clearToken()
}

export async function validateSession(): Promise<AuthUser | null> {
  const token = await getToken()
  if (!token) return null

  try {
    const data = await apiFetch<MeResponse>('/api/auth/me')
    return { id: data.user.id, name: data.user.name }
  } catch {
    await clearToken()
    return null
  }
}
