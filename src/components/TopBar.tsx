import { Bell } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { ROLE_LABELS } from '../types';

interface TopBarProps {
  title: string;
  subtitle?: string;
}

export default function TopBar({ title, subtitle }: TopBarProps) {
  const { admin } = useAuth();

  return (
    <header className="h-14 flex items-center justify-between px-6 bg-white border-b border-gray-200 sticky top-0 z-10">
      <div>
        <h1 className="text-base font-semibold text-gray-900 leading-tight">{title}</h1>
        {subtitle && <p className="text-xs text-gray-400">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-4">
        <button className="relative text-gray-400 hover:text-brand-teal transition-colors">
          <Bell size={18} />
        </button>
        {admin && (
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-brand-teal flex items-center justify-center">
              <span className="text-xs font-bold text-white uppercase">
                {admin.email.slice(0, 1)}
              </span>
            </div>
            <div className="hidden sm:block text-right">
              <p className="text-xs font-medium text-gray-700 leading-tight max-w-[140px] truncate">
                {admin.email}
              </p>
              <p className="text-[10px] text-gray-400">{ROLE_LABELS[admin.role]}</p>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
