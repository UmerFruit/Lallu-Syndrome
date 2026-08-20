import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { LayoutDashboard, LogOut, Settings, Shield } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

type UserMenuProps = {
  onNavigate?: () => void;
};

export function UserMenu({ onNavigate }: Readonly<UserMenuProps>) {
  const { user, profile, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: Event) => {
      const target = event.target as Node;
      if (menuRef.current && !menuRef.current.contains(target)) {
        setOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    };

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  if (!user) return null;

  const displayName =
    profile?.display_name ||
    user.email ||
    'Account';

  const initial = displayName.charAt(0).toUpperCase();

  const closeAndNavigate = () => {
    setOpen(false);
    onNavigate?.();
  };

  const handleLogout = async () => {
    setOpen(false);
    onNavigate?.();
    await logout();
  };

  return (
    <div ref={menuRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex items-center gap-2 rounded-full border border-border-subtle bg-elevated/40 p-1 pr-2 text-sm font-medium text-text-secondary hover:text-text-primary hover:bg-elevated transition-colors duration-200"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        {profile?.avatar_url ? (
          <img
            src={profile.avatar_url}
            alt={displayName}
            className="h-7 w-7 rounded-full object-cover"
          />
        ) : (
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-accent/10 text-xs font-semibold text-accent">
            {initial}
          </span>
        )}

        <span className="hidden sm:inline">{displayName}</span>
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 z-50 mt-2 w-64 overflow-hidden rounded-lg border border-border-subtle bg-bg shadow-lg"
        >
          <div className="border-b border-border-subtle px-4 py-3">
            <p className="truncate text-sm font-medium text-text-primary">
              {displayName}
            </p>
            {user.email && (
              <p className="truncate text-xs text-text-secondary">{user.email}</p>
            )}
          </div>

          <div className="p-1">
            <Link
              to="/dashboard"
              onClick={closeAndNavigate}
              role="menuitem"
              className="flex items-center gap-2 rounded px-3 py-2 text-sm text-text-secondary hover:bg-elevated hover:text-text-primary transition-colors"
            >
              <LayoutDashboard size={16} />
              Dashboard
            </Link>
            {profile?.is_admin && (
              <Link
                to="/admin"
                onClick={closeAndNavigate}
                role="menuitem"
                className="flex items-center gap-2 rounded px-3 py-2 text-sm text-text-secondary hover:bg-elevated hover:text-text-primary transition-colors"
              >
                <Shield size={16} />
                Admin Panel
              </Link>
            )}

            <Link
              to="/settings/profile"
              onClick={closeAndNavigate}
              role="menuitem"
              className="flex items-center gap-2 rounded px-3 py-2 text-sm text-text-secondary hover:bg-elevated hover:text-text-primary transition-colors"
            >
              <Settings size={16} />
              Settings
            </Link>

            <button
              type="button"
              onClick={handleLogout}
              role="menuitem"
              className="flex w-full items-center gap-2 rounded px-3 py-2 text-sm text-text-secondary hover:bg-elevated hover:text-text-primary transition-colors"
            >
              <LogOut size={16} />
              Logout
            </button>
          </div>
        </div>
      )}
    </div>
  );
}