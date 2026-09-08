import { useEffect, useState } from 'react';
import { Activity as ActivityIcon, RefreshCw } from 'lucide-react';
import TopBar from '../components/TopBar';
import { supabase } from '../lib/supabase';
import type { AuditLog } from '../types';

const PAGE = 25;

export default function Activity() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);

  const load = async (p: number) => {
    setLoading(true);
    const from = p * PAGE;
    const { data, count } = await supabase
      .from('audit_logs')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, from + PAGE - 1);
    setLogs((data as AuditLog[]) ?? []);
    setTotal(count ?? 0);
    setPage(p);
    setLoading(false);
  };

  useEffect(() => { load(0); }, []);

  const fmt = (iso: string) =>
    new Date(iso).toLocaleString('en-ZA', {
      day: 'numeric', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });

  return (
    <div className="flex flex-col min-h-screen">
      <TopBar title="Activity" subtitle="Immutable audit log of all admin actions" />
      <main className="flex-1 p-6">
        <div className="bg-white rounded-xl border border-gray-200">
          {/* Header */}
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-gray-900">Audit log</h2>
              <p className="text-xs text-gray-400 mt-0.5">{total} total events</p>
            </div>
            <button
              onClick={() => load(0)}
              className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-brand-teal transition-colors"
            >
              <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
              Refresh
            </button>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  {['When', 'Admin', 'Action', 'Resource', 'Details'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-10 text-center text-sm text-gray-400">
                      Loading…
                    </td>
                  </tr>
                ) : logs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-12 text-center">
                      <ActivityIcon size={24} className="text-gray-300 mx-auto mb-2" />
                      <p className="text-sm text-gray-400">No audit events yet.</p>
                      <p className="text-xs text-gray-300 mt-1">Admin actions will appear here automatically.</p>
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50/50">
                      <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                        {fmt(log.created_at)}
                      </td>
                      <td className="px-4 py-3 text-xs font-medium text-gray-700 max-w-[140px] truncate">
                        {log.admin_email}
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-mono text-xs bg-gray-100 px-1.5 py-0.5 rounded text-gray-700">
                          {log.action}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500">
                        {log.resource_type ?? '—'}
                        {log.resource_id && (
                          <span className="ml-1 text-gray-300">#{log.resource_id.slice(0, 8)}</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-400 max-w-[200px] truncate">
                        {log.details ? JSON.stringify(log.details) : '—'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {total > PAGE && (
            <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
              <span>
                {page * PAGE + 1}–{Math.min((page + 1) * PAGE, total)} of {total}
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => load(page - 1)}
                  disabled={page === 0}
                  className="px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <button
                  onClick={() => load(page + 1)}
                  disabled={(page + 1) * PAGE >= total}
                  className="px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
