import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { fetchCurrentUser, getCachedUser, hasSession, loginUser, logoutUser, registerUser } from '../utils/session'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => getCachedUser())
  const [loading, setLoading] = useState(true)
  const [authError, setAuthError] = useState('')

  useEffect(() => {
    let mounted = true

    const bootstrap = async () => {
      if (!hasSession()) {
        if (mounted) setLoading(false)
        return
      }

      try {
        const currentUser = await fetchCurrentUser()
        if (mounted) {
          setUser(currentUser)
          setAuthError('')
        }
      } catch (error) {
        logoutUser()
        if (mounted) {
          setUser(null)
          setAuthError(error.message || 'Session expired')
        }
      } finally {
        if (mounted) setLoading(false)
      }
    }

    bootstrap()
    return () => {
      mounted = false
    }
  }, [])

  const signIn = async (credentials) => {
    const nextUser = await loginUser(credentials)
    setUser(nextUser)
    setAuthError('')
    return nextUser
  }

  const signUp = async (payload) => {
    const nextUser = await registerUser(payload)
    setUser(nextUser)
    setAuthError('')
    return nextUser
  }

  const signOut = () => {
    logoutUser()
    setUser(null)
  }

  const value = useMemo(() => ({ user, loading, authError, signIn, signUp, signOut }), [user, loading, authError])
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within an AuthProvider')
  return context
}
