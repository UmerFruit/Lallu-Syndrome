import { type ReactNode, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, Sun, Moon } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { UserMenu } from '@/components/layout/UserMenu';

const navLinks = [
  { label: 'Articles', to: '/articles' },
  { label: 'About', to: '/about' },
  { label: 'Creator', to: '/creator' },
];

export function Navbar() {
  const { theme, toggleTheme } = useTheme();
  const { user } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  const isActive = (path: string) => {
    if (path === '/articles') return location.pathname.startsWith('/articles');
    if (path === '/about') return location.pathname === '/about';
    if (path === '/creator') return location.pathname === '/creator';
    return false;
  };

  return (
    <header className="sticky top-0 z-50 bg-bg/80 backdrop-blur-md border-b border-border-subtle">
      <nav className="max-w-content mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <Link
          to="/"
          className="font-serif text-lg font-semibold text-text-primary hover:text-accent transition-colors duration-200 tracking-tight"
          onClick={() => setMobileOpen(false)}
        >
          Lallu Syndrome
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={`px-3 py-1.5 text-sm font-medium rounded transition-colors duration-200 ${isActive(link.to)
                  ? 'text-text-primary'
                  : 'text-text-secondary hover:text-text-primary'
                }`}
            >
              {link.label}
            </Link>
          ))}

          {user ? (
            <UserMenu onNavigate={() => setMobileOpen(false)} />
          ) : (
            <Link
              to="/login"
              className="px-3 py-1.5 text-sm font-medium text-text-secondary hover:text-text-primary transition-colors duration-200"
            >
              Sign in
            </Link>
          )}

          <button
            type="button"
            onClick={toggleTheme}
            className="ml-2 p-2 rounded text-text-secondary hover:text-text-primary hover:bg-elevated transition-colors duration-200"
            aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </div>

        {/* Mobile controls */}
        <div className="flex md:hidden items-center gap-2">
          {user && <UserMenu onNavigate={() => setMobileOpen(false)} />}

          <button
            type="button"
            onClick={toggleTheme}
            className="p-2 rounded text-text-secondary hover:text-text-primary hover:bg-elevated transition-colors duration-200"
            aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          <button
            type="button"
            onClick={() => setMobileOpen((v) => !v)}
            className="p-2 rounded text-text-secondary hover:text-text-primary hover:bg-elevated transition-colors duration-200"
            aria-label="Toggle menu"
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </nav>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-border-subtle bg-bg animate-fade-in">
          <div className="px-4 py-4 space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className="block px-3 py-2.5 text-base font-medium text-text-secondary hover:text-text-primary hover:bg-elevated rounded transition-colors"
                onClick={() => setMobileOpen(false)}
              >
                {link.label}
              </Link>
            ))}

            {!user && (
              <Link
                to="/login"
                className="block px-3 py-2.5 text-base font-medium text-text-secondary hover:text-text-primary hover:bg-elevated rounded transition-colors"
                onClick={() => setMobileOpen(false)}
              >
                Sign in
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}

export function PageContainer({
  children,
  className,
}: Readonly<{ children: ReactNode; className?: string }>) {
  return (
    <div className={`max-w-content mx-auto px-4 sm:px-6 ${className ?? ''}`}>
      {children}
    </div>
  );
}