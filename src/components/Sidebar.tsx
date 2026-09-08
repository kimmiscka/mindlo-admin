import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  FileText,
  Users,
  Activity,
  MapPin,
  Quote,
  Settings,
  LogOut,
  ChevronRight,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { ROLE_LABELS, ROLE_SECTIONS } from '../types';

const ALL_NAV = [
  { section: 'overview',   label: 'Overview',      icon: LayoutDashboard, path: '/overview' },
  { section: 'content',    label: 'Content',        icon: FileText,        path: '/content' },
  { section: 'users',      label: 'Users',          icon: Users,           path: '/users' },
  { section: 'activity',   label: 'Activity',       icon: Activity,        path: '/activity' },
  { section: 'directory',  label: 'Directory',      icon: MapPin,          path: '/directory' },
  { section: 'quotes',     label: 'Daily Quotes',   icon: Quote,           path: '/quotes' },
  { section: 'settings',   label: 'Settings',       icon: Settings,        path: '/settings' },
] as const;

export default function Sidebar() {
  const { admin, signOut } = useAuth();
  const navigate = useNavigate();

  const allowed = admin ? (ROLE_SECTIONS[admin.role] ?? []) : [];
  const nav = ALL_NAV.filter((item) => allowed.includes(item.section));

  const handleSignOut = async () => {
    await signOut();
    navigate('/login', { replace: true });
  };

  return (
    <aside className="fixed inset-y-0 left-0 w-60 flex flex-col bg-brand-teal text-white z-20">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-white/10">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-full bg-brand-pink flex items-center justify-center flex-shrink-0">
            <span className="text-xs font-bold text-white">M</span>
          </div>
          <div>
            <p className="font-bold text-base leading-tight">MindLo</p>
            <p className="text-[11px] text-white/60 leading-tight">Admin Console</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
        {nav.map(({ section, label, icon: Icon, path }) => (
          <NavLink
            key={section}
            to={path}
            className={({ isActive }) =>
              [
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-white/15 text-white'
                  : 'text-white/70 hover:bg-white/10 hover:text-white',
              ].join(' ')
            }
          >
            {({ isActive }) => (
              <>
                <Icon size={17} />
                <span className="flex-1">{label}</span>
                {isActive && <ChevronRight size={14} className="opacity-60" />}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Admin info + sign out */}
      {admin && (
        <div className="px-4 py-4 border-t border-white/10">
          <div className="mb-3">
            <p className="text-xs font-semibold text-white/90 truncate">{admin.email}</p>
            <p className="text-[11px] text-white/50 mt-0.5">{ROLE_LABELS[admin.role]}</p>
          </div>
          <button
            onClick={handleSignOut}
            className="flex items-center gap-2 text-xs text-white/60 hover:text-white transition-colors"
          >
            <LogOut size={13} />
            Sign out
          </button>
        </div>
      )}
    </aside>
  );
}
