import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react"
import { adminLogin as apiAdminLogin, adminMe as apiAdminMe } from "@/lib/api"

interface User {
  id: string
  email: string
  name: string
  role: "student" | "tutor" | "admin"
}

export type AdminSessionPayload = {
  _id: string
  email: string
  name: string
  role: string
}

interface AuthContextType {
  user: User | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  /** Persist JWT and admin profile (used after invite completion). */
  setAdminSession: (token: string, admin: AdminSessionPayload) => void
  signOut: () => void
  isAuthenticated: boolean
}

const TOKEN_KEY = "wptp_token"

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  const setAdminSession = useCallback((token: string, admin: AdminSessionPayload) => {
    localStorage.setItem(TOKEN_KEY, token)
    setUser({
      id: admin._id,
      email: admin.email,
      name: admin.name,
      role: "admin",
    })
  }, [])

  const signOut = useCallback(() => {
    setUser(null)
    localStorage.removeItem(TOKEN_KEY)
  }, [])

  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY)
    if (!token) {
      setLoading(false)
      return
    }

    apiAdminMe(token)
      .then((admin) => {
        if (localStorage.getItem(TOKEN_KEY) !== token) return
        setUser({
          id: admin._id,
          email: admin.email,
          name: admin.name,
          role: "admin",
        })
      })
      .catch(() => {
        if (localStorage.getItem(TOKEN_KEY) === token) {
          localStorage.removeItem(TOKEN_KEY)
        }
      })
      .finally(() => setLoading(false))
  }, [])

  const signIn = useCallback(
    async (email: string, password: string) => {
      const result = await apiAdminLogin(email, password)
      setAdminSession(result.token, result.admin)
    },
    [setAdminSession],
  )

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signIn,
        setAdminSession,
        signOut,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
