'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  Calendar,
  FileText,
  Shield,
  Bell,
  Settings,
  Clock,
  X,
} from 'lucide-react';

const navItems = [
  { href: '/admin', label: 'Resumen', icon: LayoutDashboard, exact: true },
  { href: '/admin/guests', label: 'Invitados', icon: Users },
  { href: '/admin/timeline', label: 'Timeline', icon: Calendar },
  { href: '/admin/content', label: 'Contenido', icon: FileText },
  { href: '/admin/content/time-gated', label: 'Contenido Programado', icon: Clock, nested: true },
  { href: '/admin/moderation', label: 'Moderación', icon: Shield },
  { href: '/admin/notifications', label: 'Notificaciones', icon: Bell },
  { href: '/admin/config', label: 'Configuración', icon: Settings },
];

interface AdminSidebarProps {
  open: boolean;
  onClose: () => void;
}

export default function AdminSidebar({ open, onClose }: AdminSidebarProps) {
  const pathname = usePathname();

  function isActive(href: string, exact?: boolean) {
    if (exact) return pathname === href;
    return pathname === href || pathname.startsWith(href + '/');
  }

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 bg-black/30 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 z-50 h-full w-64 bg-white border-r border-charcoal/10
          transform transition-transform duration-200 ease-in-out
          lg:translate-x-0 lg:static lg:z-auto
          ${open ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {/* Header */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-charcoal/10">
          <Link href="/admin" className="font-bold text-charcoal type-heading-6" onClick={onClose}>
            Admin Panel
          </Link>
          <button
            onClick={onClose}
            className="lg:hidden p-1 rounded-md hover:bg-charcoal/5 text-charcoal/60"
            aria-label="Cerrar menú"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="p-3 space-y-1 overflow-y-auto h-[calc(100%-4rem)]">
          {navItems.map((item) => {
            const active = isActive(item.href, item.exact);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={`
                  flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors
                  ${item.nested ? 'pl-10' : ''}
                  ${active
                    ? 'bg-ocean/10 text-ocean font-medium'
                    : 'text-charcoal/70 hover:bg-charcoal/5 hover:text-charcoal'
                  }
                `}
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
