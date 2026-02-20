import { useState } from 'react';
import { useNavigate, Link } from 'react-router';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { UserCircle, GraduationCap } from 'lucide-react';

export function SignUpPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<'student' | 'tutor'>('student');
  const [error, setError] = useState('');
  const { signUp } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      await signUp(email, password, name, role);
      navigate(role === 'student' ? '/student-dashboard' : '/tutor-dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to sign up');
    }
  };

  return (
    <div className="pt-20 min-h-screen bg-background">
      <div className="container mx-auto px-4 py-20">
        <div className="max-w-md mx-auto">
          <h1 className="text-4xl font-bold text-primary mb-8 text-center">
            Sign Up
          </h1>

          {/* Role Selection */}
          <div className="grid grid-cols-2 gap-4 mb-8">
            <button
              type="button"
              onClick={() => setRole('student')}
              className={`p-6 rounded-lg border-2 transition-all ${
                role === 'student'
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-primary/50'
              }`}
            >
              <UserCircle className={`w-12 h-12 mx-auto mb-3 ${
                role === 'student' ? 'text-primary' : 'text-foreground/60'
              }`} />
              <div className="font-semibold text-center">Student</div>
            </button>
            <button
              type="button"
              onClick={() => setRole('tutor')}
              className={`p-6 rounded-lg border-2 transition-all ${
                role === 'tutor'
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-primary/50'
              }`}
            >
              <GraduationCap className={`w-12 h-12 mx-auto mb-3 ${
                role === 'tutor' ? 'text-primary' : 'text-foreground/60'
              }`} />
              <div className="font-semibold text-center">Tutor</div>
            </button>
          </div>

          {error && (
            <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-lg mb-6">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="name" className="block mb-2 text-foreground">
                Full Name
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Enter your full name"
              />
            </div>

            <div>
              <label htmlFor="email" className="block mb-2 text-foreground">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Enter your email"
              />
            </div>

            <div>
              <label htmlFor="password" className="block mb-2 text-foreground">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full px-4 py-3 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Enter your password (min 6 characters)"
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
            >
              Sign Up as {role === 'student' ? 'Student' : 'Tutor'}
            </Button>
          </form>

          <p className="text-center mt-6 text-foreground/70">
            Already have an account?{' '}
            <Link to="/sign-in" className="text-primary hover:underline">
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
