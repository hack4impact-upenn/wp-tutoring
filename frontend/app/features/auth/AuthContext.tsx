import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { adminLogin as apiAdminLogin, adminMe as apiAdminMe } from "@/lib/api"
import { adminKeys, authKeys } from "@/lib/query-keys"

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
  /** Stored admin JWT for API calls (null if signed out). Reactive for React Query `enabled`. */
  adminToken: string | null
  /** True while validating stored JWT on first load (token present, /me in flight). */
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  /** Persist JWT and admin profile (used after invite completion). */
  setAdminSession: (token: string, admin: AdminSessionPayload) => void
  signOut: () => void
  isAuthenticated: boolean
  /** Admin password login request in flight. */
  signInPending: boolean
}

const TOKEN_KEY = "wptp_token"

function mapAdminToUser(admin: { _id: string; email: string; name: string; role: string }): User {
  return {
    id: admin._id,
    email: admin.email,
    name: admin.name,
    role: "admin",
  }
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient()
  const [token, setToken] = useState<string | null>(() =>
    typeof window !== "undefined" ? localStorage.getItem(TOKEN_KEY) : null,
  )

  const sessionQuery = useQuery({
    queryKey: authKeys.me(token ?? ""),
    queryFn: async () => {
      if (!token) return null
      return apiAdminMe(token)
    },
    enabled: !!token,
    staleTime: 5 * 60 * 1000,
    retry: false,
  })

  useEffect(() => {
    if (!sessionQuery.isError || !token) return
    localStorage.removeItem(TOKEN_KEY)
    setToken(null)
    queryClient.removeQueries({ queryKey: authKeys.all })
    queryClient.removeQueries({ queryKey: adminKeys.all })
  }, [sessionQuery.isError, token, queryClient])

  const loginMutation = useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) =>
      apiAdminLogin(email, password),
    onSuccess: (data) => {
      localStorage.setItem(TOKEN_KEY, data.token)
      setToken(data.token)
      queryClient.setQueryData(authKeys.me(data.token), data.admin)
    },
  })

  const setAdminSession = useCallback(
    (newToken: string, admin: AdminSessionPayload) => {
      localStorage.setItem(TOKEN_KEY, newToken)
      setToken(newToken)
      queryClient.setQueryData(authKeys.me(newToken), admin)
    },
    [queryClient],
  )

  const signOut = useCallback(() => {
    setToken(null)
    localStorage.removeItem(TOKEN_KEY)
    queryClient.removeQueries({ queryKey: authKeys.all })
    queryClient.removeQueries({ queryKey: adminKeys.all })
  }, [queryClient])

  const signIn = useCallback(
    async (email: string, password: string) => {
      await loginMutation.mutateAsync({ email, password })
    },
    [loginMutation],
  )

  const user = sessionQuery.data ? mapAdminToUser(sessionQuery.data) : null
  const loading = !!token && sessionQuery.isPending && !sessionQuery.data

  return (
    <AuthContext.Provider
      value={{
        user,
        adminToken: token,
        loading,
        signIn,
        setAdminSession,
        signOut,
        isAuthenticated: !!user,
        signInPending: loginMutation.isPending,
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
