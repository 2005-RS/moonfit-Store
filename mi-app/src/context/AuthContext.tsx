import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import {
  clearAuthSession,
  fetchCurrentUserProfile,
  getStoredAuthSession,
  loginUser,
  saveAuthSession,
  type AuthProfile,
  type AuthSession,
} from '../lib/auth'

type AuthContextValue = {
  session: AuthSession | null
  profile: AuthProfile | null
  profileError: string
  isProfileLoading: boolean
  isAuthenticated: boolean
  isAdmin: boolean
  login: (email: string, password: string) => Promise<AuthSession>
  logout: () => void
  refreshProfile: () => Promise<void>
}

const AUTH_EVENT_NAME = 'moonfit-auth-changed'

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(() => getStoredAuthSession())
  const [profile, setProfile] = useState<AuthProfile | null>(null)
  const [profileError, setProfileError] = useState('')
  const [isProfileLoading, setIsProfileLoading] = useState(false)

  const refreshProfile = async () => {
    if (!getStoredAuthSession()) {
      setProfile(null)
      setProfileError('')
      setIsProfileLoading(false)
      return
    }

    setIsProfileLoading(true)
    setProfileError('')

    try {
      const nextProfile = await fetchCurrentUserProfile()
      setProfile(nextProfile)
    } catch (requestError) {
      setProfile(null)
      setProfileError(
        requestError instanceof Error
          ? requestError.message
          : 'No se pudo validar la sesion actual.',
      )
    } finally {
      setIsProfileLoading(false)
    }
  }

  useEffect(() => {
    const syncSession = () => {
      const nextSession = getStoredAuthSession()
      setSession(nextSession)

      if (!nextSession) {
        setProfile(null)
        setProfileError('')
        setIsProfileLoading(false)
      }
    }

    window.addEventListener('storage', syncSession)
    window.addEventListener(AUTH_EVENT_NAME, syncSession as EventListener)

    return () => {
      window.removeEventListener('storage', syncSession)
      window.removeEventListener(AUTH_EVENT_NAME, syncSession as EventListener)
    }
  }, [])

  useEffect(() => {
    if (!session?.accessToken) {
      setProfile(null)
      setProfileError('')
      setIsProfileLoading(false)
      return
    }

    void refreshProfile()
  }, [session?.accessToken])

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      profile,
      profileError,
      isProfileLoading,
      isAuthenticated: Boolean(session?.accessToken),
      isAdmin: session?.user.role === 'ADMIN',
      login: async (email, password) => {
        const nextSession = await loginUser({ email, password })
        saveAuthSession(nextSession)
        setSession(nextSession)
        return nextSession
      },
      logout: () => {
        clearAuthSession()
        setProfile(null)
        setProfileError('')
        setIsProfileLoading(false)
        setSession(null)
      },
      refreshProfile,
    }),
    [isProfileLoading, profile, profileError, session],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

function useAuth() {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }

  return context
}

export { AUTH_EVENT_NAME, AuthProvider, useAuth }
