import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import { AuthUser, login as authLogin, logout as authLogout, validateSession } from '../services/auth'

type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated'

interface AuthContextValue {
  status: AuthStatus
  user: AuthUser | null
  login: (phone: string, password: string) => Promise<{ firstLogin: boolean }>
  logout: () => Promise<void>
  refresh: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>('loading')
  const [user, setUser] = useState<AuthUser | null>(null)

  const checkSession = useCallback(async () => {
    const sessionUser = await validateSession()
    if (sessionUser) {
      setUser(sessionUser)
      setStatus('authenticated')
    } else {
      setUser(null)
      setStatus('unauthenticated')
    }
  }, [])

  useEffect(() => {
    checkSession()
  }, [checkSession])

  const login = useCallback(async (phone: string, password: string) => {
    const result = await authLogin(phone, password)
    setUser(result.user)
    setStatus('authenticated')
    return { firstLogin: result.firstLogin }
  }, [])

  const logout = useCallback(async () => {
    await authLogout()
    setUser(null)
    setStatus('unauthenticated')
  }, [])

  return (
    <AuthContext.Provider value={{ status, user, login, logout, refresh: checkSession }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
