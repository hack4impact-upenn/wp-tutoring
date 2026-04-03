import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { adminLogin as apiAdminLogin, adminMe as apiAdminMe } from '@/lib/actions';

interface User {
  id: string;
  email: string;
  name: string;
  role: 'student' | 'tutor' | 'admin';
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => void;
  isAuthenticated: boolean;
}

const TOKEN_KEY = 'wptp_token';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) {
      setLoading(false);
      return;
    }

    apiAdminMe(token)
      .then((admin) => {
        setUser({
          id: admin._id,
          email: admin.email,
          name: admin.name,
          role: 'admin',
        });
      })
      .catch(() => {
        localStorage.removeItem(TOKEN_KEY);
      })
      .finally(() => setLoading(false));
  }, []);

  const signIn = async (email: string, password: string) => {
    const result = await apiAdminLogin(email, password);

    localStorage.setItem(TOKEN_KEY, result.token);

    setUser({
      id: result.admin._id,
      email: result.admin.email,
      name: result.admin.name,
      role: 'admin',
    });
  };

  const signOut = () => {
    setUser(null);
    localStorage.removeItem(TOKEN_KEY);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signIn,
        signOut,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
