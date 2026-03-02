'use client';

import { useAuth } from '@/contexts/AuthContext';
import { usePathname, useRouter } from 'next/navigation';
import { Menu, LogOut, ChevronRight } from 'lucide-react';
import Link from 'next/link';

const breadcrumbLabels: Record<string, string> = {
  admin: 'Admin',
  guests: 'Invitados',
  timeline: 'Timeline',
  content: 'Contenido',
  'time-gated': 'Programado',
  moderation: 'Moderación',
  notifications: 'Notificaciones',
  config: 'Configuración',
};

interface AdminHeaderProps {
  onToggleSidebar: () => void;
}

export default function AdminHeader({ onToggleSidebar }: AdminHeaderProps) {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  const segments = pathname.split('/').filter(Boolean);
  // Filter out "api" and "verify" segments from breadcrumbs
  const breadcrumbSegments = segments.filter(
    (s) => s !== 'api' && s !== 'verify'
  );

  async function handleLogout() {
    await logout();
    router.push('/');
  }

  return (
    <header className="h-16 bg-white border-b border-charcoal/10 flex items-center justify-between px-4 shrink-0">
      {/* Left: hamburger + breadcrumbs */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="lg:hidden p-1.5 rounded-md hover:bg-charcoal/5 text-charcoal/60"
          aria-label="Abrir menú"
        >
          <Menu size={20} />
        </button>

        <nav className="flex items-center gap-1 text-sm text-charcoal/60">
          {breadcrumbSegments.map((segment, i) => {
            const href = '/' + breadcrumbSegments.slice(0, i + 1).join('/');
            const label = breadcrumbLabels[segment] || segment;
            const isLast = i === breadcrumbSegments.length - 1;

            return (
              <span key={href} className="flex items-center gap-1">
                {i > 0 && <ChevronRight size={14} className="text-charcoal/30" />}
                {isLast ? (
                  <span className="text-charcoal font-medium">{label}</span>
                ) : (
                  <Link href={href} className="hover:text-charcoal transition-colors">
                    {label}
                  </Link>
                )}
              </span>
            );
          })}
        </nav>
      </div>

      {/* Right: user info + logout */}
      <div className="flex items-center gap-3">
        {user && (
          <div className="flex items-center gap-2">
            {user.photoURL ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={user.photoURL}
                alt={user.displayName || 'Admin'}
                className="w-8 h-8 rounded-full"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-ocean/20 flex items-center justify-center text-ocean text-sm font-medium">
                {(user.displayName || user.email || 'A').charAt(0).toUpperCase()}
              </div>
            )}
            <span className="hidden sm:block text-sm text-charcoal/80 max-w-[120px] truncate">
              {user.displayName || user.email}
            </span>
          </div>
        )}
        <button
          onClick={handleLogout}
          className="p-1.5 rounded-md hover:bg-charcoal/5 text-charcoal/60 hover:text-charcoal transition-colors"
          aria-label="Cerrar sesión"
        >
          <LogOut size={18} />
        </button>
      </div>
    </header>
  );
}
