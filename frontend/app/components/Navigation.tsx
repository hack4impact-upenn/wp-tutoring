import { Link, useLocation, useNavigate } from 'react-router';
import { Button } from './ui/button';
import { useAuth } from '../contexts/AuthContext';
import logo from '../../assets/51b2a5476f8be324b14fb9197d7339afe2398dbc.png';

interface NavigationProps {
  scrolled: boolean;
}

export function Navigation({ scrolled }: NavigationProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, user, signOut } = useAuth();

  const handleSignOut = () => {
    signOut();
    navigate('/');
  };

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? 'bg-background/95 backdrop-blur-sm shadow-md' : 'bg-background/80 backdrop-blur-sm'
      }`}
    >
      <div className="container mx-auto px-4 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo/Brand */}
          <Link to="/" className="flex items-center gap-3">
            <img src={logo} alt="WPTP Logo" className="h-12 w-auto" />
            <h2 className="text-xl font-semibold text-primary">
              West Philly Tutoring
            </h2>
          </Link>

          {/* Navigation Links */}
          <div className="flex items-center gap-8">
            <Link
              to="/"
              className={`transition-colors ${
                location.pathname === '/'
                  ? 'text-primary font-medium'
                  : 'text-foreground hover:text-primary'
              }`}
            >
              Home
            </Link>
            <Link
              to="/about"
              className={`transition-colors ${
                location.pathname === '/about'
                  ? 'text-primary font-medium'
                  : 'text-foreground hover:text-primary'
              }`}
            >
              About Us
            </Link>
            <Link
              to="/contact"
              className={`transition-colors ${
                location.pathname === '/contact'
                  ? 'text-primary font-medium'
                  : 'text-foreground hover:text-primary'
              }`}
            >
              Contact
            </Link>
            
            {isAuthenticated ? (
              <div className="flex items-center gap-4">
                <span className="text-sm text-foreground/70">
                  {user?.name}
                </span>
                <Button
                  onClick={handleSignOut}
                  variant="outline"
                  className="border-primary text-primary hover:bg-primary hover:text-primary-foreground"
                >
                  Sign Out
                </Button>
              </div>
            ) : (
              <Button
                onClick={() => navigate('/sign-in')}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                Sign In
              </Button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}