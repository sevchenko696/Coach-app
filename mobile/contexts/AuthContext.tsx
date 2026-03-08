import { createContext, useContext, useState, useEffect, useCallback, useRef, type ReactNode } from 'react'
import { AuthUser, login as authLogin, logout as authLogout, validateSession } from '../services/auth'
import { registerForPushNotifications, savePushToken, removePushToken } from '../services/notifications'

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
  const pushTokenRef = useRef<string | null>(null)

  const setupPushNotifications = useCallback(async () => {
    const token = await registerForPushNotifications()
    if (token) {
      pushTokenRef.current = token
      await savePushToken(token)
    }
  }, [])

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

  // Register for push notifications when authenticated
  useEffect(() => {
    if (status === 'authenticated') {
      setupPushNotifications()
    }
  }, [status, setupPushNotifications])

  const login = useCallback(async (phone: string, password: string) => {
    const result = await authLogin(phone, password)
    setUser(result.user)
    setStatus('authenticated')
    return { firstLogin: result.firstLogin }
  }, [])

  const logout = useCallback(async () => {
    // Remove push token before logging out
    if (pushTokenRef.current) {
      await removePushToken(pushTokenRef.current)
      pushTokenRef.current = null
    }
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
