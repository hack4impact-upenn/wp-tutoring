import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router';
import { Button } from './ui/button';
import { useAuth } from '../contexts/AuthContext';
import { Menu, X } from 'lucide-react';
import logo from '../../assets/51b2a5476f8be324b14fb9197d7339afe2398dbc.png';

interface NavigationProps {
  scrolled: boolean;
}

export function Navigation({ scrolled }: NavigationProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, user, signOut } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleSignOut = () => {
    signOut();
    navigate('/');
    setMobileOpen(false);
  };

  const linkClass = (path: string) =>
    `transition-colors ${
      location.pathname === path
        ? 'text-primary font-medium'
        : 'text-foreground hover:text-primary'
    }`;

  const navLinks = (
    <>
      <Link to="/" className={linkClass('/')} onClick={() => setMobileOpen(false)}>
        Home
      </Link>
      <Link to="/about" className={linkClass('/about')} onClick={() => setMobileOpen(false)}>
        About Us
      </Link>
      <Link to="/contact" className={linkClass('/contact')} onClick={() => setMobileOpen(false)}>
        Contact
      </Link>
    </>
  );

  const authSection = isAuthenticated ? (
    <div className="flex items-center gap-4">
      <span className="text-sm text-foreground/70">{user?.name}</span>
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
      onClick={() => { navigate('/admin-dashboard'); setMobileOpen(false); }}
      className="bg-primary text-primary-foreground hover:bg-primary/90"
    >
      Sign In
    </Button>
  );

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? 'bg-background/95 backdrop-blur-sm shadow-md' : 'bg-background/80 backdrop-blur-sm'
      }`}
    >
      <div className="container mx-auto px-4 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3">
            <img src={logo} alt="WPTP Logo" className="h-12 w-auto" />
            <h2 className="text-xl font-semibold text-primary hidden sm:block">
              West Philly Tutoring
            </h2>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks}
            {authSection}
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden p-2 text-foreground"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden bg-background/95 backdrop-blur-sm border-t shadow-lg">
          <div className="container mx-auto px-4 py-4 flex flex-col gap-4">
            {navLinks}
            {authSection}
          </div>
        </div>
      )}
    </nav>
  );
}
