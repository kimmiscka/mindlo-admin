import { useEffect, useState } from 'react';
import {
  Users, FileText, MessageSquare, TrendingUp,
  Activity, Calendar, ArrowUpRight,
} from 'lucide-react';
import TopBar from '../components/TopBar';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';

interface StatTile {
  label: string;
  value: string | number;
  icon: typeof Users;
  color: string;
  bg: string;
  change?: string;
}

interface AuditRow {
  id: string;
  admin_email: string;
  action: string;
  resource_type?: string;
  created_at: string;
}

export default function Overview() {
  const { admin } = useAuth();
  const [recentLogs, setRecentLogs] = useState<AuditRow[]>([]);
  const [logsLoading, setLogsLoading] = useState(true);

  useEffect(() => {
    supabase
      .from('audit_logs')
      .select('id, admin_email, action, resource_type, created_at')
      .order('created_at', { ascending: false })
      .limit(8)
      .then(({ data }) => {
        setRecentLogs((data as AuditRow[]) ?? []);
        setLogsLoading(false);
      });
  }, []);

  const tiles: StatTile[] = [
    {
      label: 'Total articles',
      value: 87,
      icon: FileText,
      color: 'text-brand-teal',
      bg: 'bg-brand-teal-pale',
      change: '+16 this month',
    },
    {
      label: 'Daily quotes',
      value: 30,
      icon: MessageSquare,
      color: 'text-brand-pink-dark',
      bg: 'bg-brand-pink/10',
    },
    {
      label: 'Admin users',
      value: '—',
      icon: Users,
      color: 'text-violet-600',
      bg: 'bg-violet-50',
    },
    {
      label: 'Audit events today',
      value: recentLogs.filter((l) =>
        l.created_at.startsWith(new Date().toISOString().slice(0, 10))
      ).length,
      icon: Activity,
      color: 'text-amber-600',
      bg: 'bg-amber-50',
    },
  ];

  const fmt = (iso: string) =>
    new Date(iso).toLocaleString('en-ZA', {
      day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
    });

  return (
    <div className="flex flex-col min-h-screen">
      <TopBar
        title="Overview"
        subtitle={`Welcome back${admin ? `, ${admin.email.split('@')[0]}` : ''}`}
      />
      <main className="flex-1 p-6 space-y-6">

        {/* Stat tiles */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {tiles.map((t) => (
            <div key={t.label} className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="flex items-start justify-between mb-3">
                <div className={`w-9 h-9 rounded-lg ${t.bg} flex items-center justify-center`}>
                  <t.icon size={18} className={t.color} />
                </div>
                <ArrowUpRight size={14} className="text-gray-300 mt-1" />
              </div>
              <p className="text-2xl font-bold text-gray-900">{t.value}</p>
              <p className="text-xs text-gray-500 mt-0.5">{t.label}</p>
              {t.change && (
                <p className="text-[11px] text-green-600 font-medium mt-1 flex items-center gap-1">
                  <TrendingUp size={10} /> {t.change}
                </p>
              )}
            </div>
          ))}
        </div>

        {/* Recent audit activity */}
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-900">Recent admin activity</h2>
            <a href="/activity" className="text-xs text-brand-teal hover:underline font-medium">
              View all
            </a>
          </div>
          <div className="divide-y divide-gray-50">
            {logsLoading ? (
              <div className="px-5 py-8 text-center text-sm text-gray-400">Loading…</div>
            ) : recentLogs.length === 0 ? (
              <div className="px-5 py-8 text-center">
                <Calendar size={22} className="text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-400">No admin actions recorded yet.</p>
                <p className="text-xs text-gray-300 mt-1">Actions will appear here as the team uses the console.</p>
              </div>
            ) : (
              recentLogs.map((log) => (
                <div key={log.id} className="px-5 py-3 flex items-center gap-3">
                  <div className="w-7 h-7 rounded-full bg-brand-teal-pale flex items-center justify-center flex-shrink-0">
                    <span className="text-[11px] font-bold text-brand-teal uppercase">
                      {log.admin_email.slice(0, 1)}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-800 truncate">
                      <span className="font-medium">{log.admin_email.split('@')[0]}</span>
                      {' · '}
                      <span className="font-mono text-xs bg-gray-100 px-1 py-0.5 rounded">
                        {log.action}
                      </span>
                      {log.resource_type && (
                        <span className="text-gray-400"> on {log.resource_type}</span>
                      )}
                    </p>
                  </div>
                  <p className="text-[11px] text-gray-400 flex-shrink-0">{fmt(log.created_at)}</p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Quick-links */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {[
            { label: 'Manage content', href: '/content', icon: FileText },
            { label: 'Daily quotes', href: '/quotes', icon: MessageSquare },
            { label: 'Directory', href: '/directory', icon: Activity },
          ].map(({ label, href, icon: Icon }) => (
            <a
              key={label}
              href={href}
              className="flex items-center gap-3 bg-white rounded-xl border border-gray-200 px-4 py-3
                         hover:border-brand-teal hover:shadow-sm transition-all group"
            >
              <Icon size={16} className="text-brand-teal group-hover:scale-110 transition-transform" />
              <span className="text-sm font-medium text-gray-700">{label}</span>
              <ArrowUpRight size={13} className="ml-auto text-gray-300 group-hover:text-brand-teal transition-colors" />
            </a>
          ))}
        </div>

      </main>
    </div>
  );
}
