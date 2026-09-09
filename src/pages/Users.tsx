import { useState, useEffect } from 'react';
import { Search, AlertCircle, RefreshCw, Eye, Lock } from 'lucide-react';
import TopBar from '../components/TopBar';
import { useAuth } from '../hooks/useAuth';
import { getUserList, countAppUsers, getUserDetail, logUserAccess, deleteUserAndData } from '../lib/contentApi';
import type { AppUser, UserDetail } from '../types';

const PAGE_SIZE = 25;

export default function Users() {
  const { admin } = useAuth();
  const [users, setUsers] = useState<AppUser[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserDetail | null>(null);
  const [showSensitiveWarning, setShowSensitiveWarning] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [error, setError] = useState('');

  const loadUsers = async (p: number, q: string) => {
    setLoading(true);
    setError('');
    try {
      const offset = p * PAGE_SIZE;
      const [list, count] = await Promise.all([
        getUserList(q || undefined, PAGE_SIZE, offset),
        countAppUsers(q || undefined),
      ]);
      setUsers(list);
      setTotal(count);
      setPage(p);

      // Log list access
      if (admin) {
        logUserAccess(admin.id, admin.email, admin.id, 'view_user_list', undefined, { search: q, page: p }).catch(() => {});
      }
    } catch (e: unknown) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers(0, '');
  }, []);

  const handleUserSelect = async (user: AppUser) => {
    if (!admin) return;
    try {
      const detail = await getUserDetail(user.id);
      setSelectedUser(detail);
      logUserAccess(admin.id, admin.email, user.id, 'view_user_detail').catch(() => {});
    } catch (e: unknown) {
      setError(String(e));
    }
  };

  const handleViewSensitiveData = async () => {
    if (!admin || !selectedUser) return;
    if (admin.role !== 'super_admin') {
      setError('Only Super Admins can access sensitive user data.');
      return;
    }

    // Log sensitive access with required reason
    const reason = prompt('Why do you need to access this user\'s private check-in data? (Required for audit trail)');
    if (!reason) return;

    try {
      logUserAccess(admin.id, admin.email, selectedUser.id, 'view_checkin_text', reason, { warning_acknowledged: true }).catch(() => {});
      setShowSensitiveWarning(false);
      // In production, would fetch actual check-in text here
      alert('Private check-in text view: [would show sensitive data with full audit trail]');
    } catch (e: unknown) {
      setError(String(e));
    }
  };

  const handleDeleteUser = async () => {
    if (!admin || !deleteConfirmId) return;
    if (admin.role !== 'super_admin') {
      setError('Only Super Admins can delete user accounts.');
      return;
    }

    try {
      await deleteUserAndData(deleteConfirmId, admin.id, admin.email);
      setDeleteConfirmId(null);
      setSelectedUser(null);
      await loadUsers(page, search);
      alert('User account deleted (POPIA erasure).');
    } catch (e: unknown) {
      setError(String(e));
    }
  };

  if (!admin || admin.role !== 'super_admin') {
    return (
      <div className="flex flex-col min-h-screen">
        <TopBar title="Users" subtitle="User account management" />
        <main className="flex-1 p-6">
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-start gap-3">
            <Lock size={18} className="flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Access Denied</p>
              <p className="text-sm mt-1">User management is restricted to Super Admins only.</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <TopBar title="Users" subtitle="App user accounts and safeguarding" />
      <main className="flex-1 p-6 space-y-6">

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">{error}</div>
        )}

        {/* Search */}
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <Search size={16} className="absolute left-3 top-3 text-gray-400" />
            <input
              type="text"
              placeholder="Search by email or username…"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                loadUsers(0, e.target.value);
              }}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-teal/30"
            />
          </div>
          <button
            onClick={() => loadUsers(page, search)}
            className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-brand-teal border border-gray-200 px-3 py-2 rounded-lg"
          >
            <RefreshCw size={13} />
          </button>
        </div>

        {/* User list */}
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="px-5 py-4 border-b border-gray-100">
            <p className="text-sm font-semibold text-gray-900">{total} users</p>
          </div>

          {loading ? (
            <div className="px-5 py-10 text-center text-sm text-gray-400">Loading…</div>
          ) : users.length === 0 ? (
            <div className="px-5 py-10 text-center text-sm text-gray-400">No users found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    {['Username', 'Email', 'Age', 'Area', 'Joined', 'Last Active', 'Check-ins'].map((h) => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-gray-50/50 cursor-pointer" onClick={() => handleUserSelect(u)}>
                      <td className="px-4 py-3 font-medium text-gray-900">{u.username || '—'}</td>
                      <td className="px-4 py-3 text-xs text-gray-600">{u.email}</td>
                      <td className="px-4 py-3 text-xs text-gray-600">{u.age_band || '—'}</td>
                      <td className="px-4 py-3 text-xs text-gray-600">{u.area || '—'}</td>
                      <td className="px-4 py-3 text-xs text-gray-500">
                        {new Date(u.created_at).toLocaleDateString('en-ZA')}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500">
                        {u.last_active ? new Date(u.last_active).toLocaleDateString('en-ZA') : '—'}
                      </td>
                      <td className="px-4 py-3 text-xs font-medium text-brand-teal">{u.total_checkins}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {total > PAGE_SIZE && (
            <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
              <span>
                {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, total)} of {total}
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => loadUsers(page - 1, search)}
                  disabled={page === 0}
                  className="px-3 py-1.5 border border-gray-200 rounded-lg disabled:opacity-40"
                >
                  Previous
                </button>
                <button
                  onClick={() => loadUsers(page + 1, search)}
                  disabled={(page + 1) * PAGE_SIZE >= total}
                  className="px-3 py-1.5 border border-gray-200 rounded-lg disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>

        {/* User detail panel */}
        {selectedUser && (
          <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">{selectedUser.username}</h2>
                  <p className="text-xs text-gray-400">{selectedUser.email}</p>
                </div>
                <button
                  onClick={() => setSelectedUser(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              {/* Safeguarding flag */}
              {selectedUser.has_safeguarding_flag && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                  <div className="flex items-start gap-2">
                    <AlertCircle size={16} className="text-red-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-red-700">Safeguarding flag</p>
                      <p className="text-xs text-red-600 mt-0.5">
                        {selectedUser.safeguarding_flag_type?.toUpperCase()} — flagged{' '}
                        {new Date(selectedUser.safeguarding_flagged_at!).toLocaleDateString('en-ZA')}
                      </p>
                      <p className="text-xs text-red-600 mt-1">This requires human protocol-based response.</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Stats */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500 uppercase">Check-ins</p>
                  <p className="text-lg font-semibold text-gray-900 mt-1">{selectedUser.total_checkins}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500 uppercase">Completed</p>
                  <p className="text-lg font-semibold text-gray-900 mt-1">
                    {selectedUser.total_articles_completed +
                      selectedUser.total_exercises_completed +
                      selectedUser.total_quizzes_completed}
                  </p>
                </div>
              </div>

              {/* Info */}
              <div className="space-y-2 mb-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Age:</span>
                  <span className="font-medium">{selectedUser.age_band || '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Area:</span>
                  <span className="font-medium">{selectedUser.area || '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">School:</span>
                  <span className="font-medium">{selectedUser.school || '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Joined:</span>
                  <span className="font-medium">
                    {new Date(selectedUser.created_at).toLocaleDateString('en-ZA')}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="space-y-2 border-t border-gray-200 pt-4">
                <button
                  onClick={() => setShowSensitiveWarning(true)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50"
                >
                  <Eye size={14} /> View private check-in text
                </button>
                <button
                  onClick={() => setDeleteConfirmId(selectedUser.id)}
                  className="w-full px-4 py-2 text-sm font-medium bg-red-500 text-white rounded-lg hover:bg-red-600"
                >
                  Delete account
                </button>
              </div>

              {/* Sensitive warning */}
              {showSensitiveWarning && (
                <div className="fixed inset-0 bg-black/40 z-[51] flex items-center justify-center p-4">
                  <div className="bg-white rounded-xl p-4 max-w-sm w-full">
                    <p className="font-semibold text-gray-900 mb-2">⚠️ Sensitive Data Access</p>
                    <p className="text-sm text-gray-600 mb-4">
                      You are about to view a user's private check-in text. This action is logged and requires a documented reason.
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setShowSensitiveWarning(false)}
                        className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleViewSensitiveData}
                        className="flex-1 px-3 py-2 text-sm font-medium bg-brand-teal text-white rounded-lg"
                      >
                        Proceed
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Delete confirmation */}
              {deleteConfirmId === selectedUser.id && (
                <div className="fixed inset-0 bg-black/40 z-[51] flex items-center justify-center p-4">
                  <div className="bg-white rounded-xl p-4 max-w-sm w-full">
                    <p className="font-semibold text-gray-900 mb-2">Delete user account?</p>
                    <p className="text-sm text-gray-600 mb-4">
                      This will permanently delete {selectedUser.username}'s account and all associated data (POPIA erasure right). This action cannot be undone.
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setDeleteConfirmId(null)}
                        className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleDeleteUser}
                        className="flex-1 px-3 py-2 text-sm font-medium bg-red-500 text-white rounded-lg hover:bg-red-600"
                      >
                        Delete permanently
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
