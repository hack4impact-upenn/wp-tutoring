import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface User {
  id: string;
  email: string;
  name: string;
  role: 'student' | 'tutor' | 'admin';
}

interface AuthContextType {
  user: User | null;
  signUp: (email: string, password: string, name: string, role: 'student' | 'tutor') => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // Check for existing session
    const storedUser = localStorage.getItem('wptp_user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const signUp = async (email: string, password: string, name: string, role: 'student' | 'tutor') => {
    // Get existing users
    const usersData = localStorage.getItem('wptp_users');
    const users = usersData ? JSON.parse(usersData) : [];

    // Check if user already exists
    if (users.find((u: any) => u.email === email)) {
      throw new Error('User with this email already exists');
    }

    // Create new user
    const newUser = {
      id: Date.now().toString(),
      email,
      password, // In production, this would be hashed
      name,
      role,
    };

    users.push(newUser);
    localStorage.setItem('wptp_users', JSON.stringify(users));

    // Auto sign in
    const { password: _, ...userWithoutPassword } = newUser;
    setUser(userWithoutPassword);
    localStorage.setItem('wptp_user', JSON.stringify(userWithoutPassword));
  };

  const signIn = async (email: string, password: string) => {
    // Check for admin credentials
    if (email === 'admin@wptp.edu' && password === 'admin123') {
      const adminUser: User = {
        id: 'admin',
        email: 'admin@wptp.edu',
        name: 'Admin',
        role: 'admin',
      };
      setUser(adminUser);
      localStorage.setItem('wptp_user', JSON.stringify(adminUser));
      return;
    }

    // Check regular users
    const usersData = localStorage.getItem('wptp_users');
    const users = usersData ? JSON.parse(usersData) : [];

    const foundUser = users.find((u: any) => u.email === email && u.password === password);
    if (!foundUser) {
      throw new Error('Invalid email or password');
    }

    const { password: _, ...userWithoutPassword } = foundUser;
    setUser(userWithoutPassword);
    localStorage.setItem('wptp_user', JSON.stringify(userWithoutPassword));
  };

  const signOut = () => {
    setUser(null);
    localStorage.removeItem('wptp_user');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        signUp,
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
