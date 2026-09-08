import { useEffect, useState } from 'react';
import { UserPlus, Shield, Trash2, AlertCircle, Check } from 'lucide-react';
import TopBar from '../components/TopBar';
import { supabase } from '../lib/supabase';
import { logAudit } from '../lib/audit';
import { useAuth } from '../hooks/useAuth';
import type { AdminUser, AdminRole } from '../types';
import { ROLE_LABELS } from '../types';
import RoleGate from '../components/RoleGate';

const ROLES: { value: AdminRole; label: string; desc: string }[] = [
  { value: 'super_admin',       label: 'Super Admin',         desc: 'Full access to all sections' },
  { value: 'content_manager',   label: 'Content Manager',     desc: 'Content, Directory, Daily Quotes' },
  { value: 'support_moderator', label: 'Support / Moderator', desc: 'Users and Activity only' },
];

function AdminRow({ user, currentId, onRefresh }: { user: AdminUser; currentId: string; onRefresh: () => void }) {
  const { admin } = useAuth();
  const [removing, setRemoving] = useState(false);

  const remove = async () => {
    if (!confirm(`Remove admin access for ${user.email}?`)) return;
    setRemoving(true);
    await supabase.from('admin_users').delete().eq('id', user.id);
    if (admin) await logAudit(admin.id, admin.email, { action: 'remove_admin', resource_type: 'admin_user', resource_id: user.id, details: { email: user.email } });
    setRemoving(false);
    onRefresh();
  };

  return (
    <div className="flex items-center gap-3 px-5 py-3">
      <div className="w-8 h-8 rounded-full bg-brand-teal-pale flex items-center justify-center flex-shrink-0">
        <span className="text-xs font-bold text-brand-teal uppercase">{user.email.slice(0, 1)}</span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-800 truncate">
          {user.email}
          {user.id === currentId && (
            <span className="ml-2 text-[10px] bg-brand-teal text-white px-1.5 py-0.5 rounded-full font-semibold">You</span>
          )}
        </p>
        <p className="text-xs text-gray-400">{ROLE_LABELS[user.role]}</p>
      </div>
      {user.id !== currentId && (
        <button onClick={remove} disabled={removing} className="text-gray-300 hover:text-red-400 transition-colors disabled:opacity-40">
          <Trash2 size={14} />
        </button>
      )}
    </div>
  );
}

export default function Settings() {
  const { admin } = useAuth();
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);

  // Invite form state
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<AdminRole>('content_manager');
  const [invitePassword, setInvitePassword] = useState('');
  const [inviting, setInviting] = useState(false);
  const [inviteMsg, setInviteMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  const loadAdmins = async () => {
    setLoading(true);
    const { data } = await supabase.from('admin_users').select('*').order('created_at');
    setAdmins((data as AdminUser[]) ?? []);
    setLoading(false);
  };

  useEffect(() => { loadAdmins(); }, []);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!admin) return;
    setInviting(true);
    setInviteMsg(null);

    // 1. Create the Supabase auth user (requires Admin API — we call signUp and
    //    immediately add them to admin_users so they can log in after confirming).
    const { data: signUpData, error: signUpErr } = await supabase.auth.signUp({
      email: inviteEmail.trim(),
      password: invitePassword,
    });

    if (signUpErr || !signUpData.user) {
      setInviteMsg({ type: 'err', text: signUpErr?.message ?? 'Sign-up failed.' });
      setInviting(false);
      return;
    }

    // 2. Insert into admin_users.
    const { error: insertErr } = await supabase.from('admin_users').insert({
      id: signUpData.user.id,
      email: inviteEmail.trim().toLowerCase(),
      role: inviteRole,
    });

    if (insertErr) {
      setInviteMsg({ type: 'err', text: insertErr.message });
    } else {
      await logAudit(admin.id, admin.email, {
        action: 'add_admin',
        resource_type: 'admin_user',
        resource_id: signUpData.user.id,
        details: { email: inviteEmail.trim(), role: inviteRole },
      });
      setInviteMsg({ type: 'ok', text: `${inviteEmail} added. They'll receive a confirmation email.` });
      setInviteEmail('');
      setInvitePassword('');
      loadAdmins();
    }
    setInviting(false);
  };

  return (
    <div className="flex flex-col min-h-screen">
      <TopBar title="Settings" subtitle="Admin users and access control" />
      <main className="flex-1 p-6 space-y-6">

        {/* Admin users list */}
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
            <Shield size={15} className="text-brand-teal" />
            <h2 className="text-sm font-semibold text-gray-900">Admin users</h2>
            <span className="ml-auto text-xs text-gray-400">{admins.length} total</span>
          </div>
          <div className="divide-y divide-gray-50">
            {loading ? (
              <p className="px-5 py-6 text-sm text-gray-400 text-center">Loading…</p>
            ) : (
              admins.map((u) => (
                <AdminRow key={u.id} user={u} currentId={admin?.id ?? ''} onRefresh={loadAdmins} />
              ))
            )}
          </div>
        </div>

        {/* Add admin form — Super Admin only */}
        <RoleGate section="settings">
          <div className="bg-white rounded-xl border border-gray-200">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
              <UserPlus size={15} className="text-brand-teal" />
              <h2 className="text-sm font-semibold text-gray-900">Add admin user</h2>
            </div>
            <form onSubmit={handleInvite} className="px-5 py-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">Email address</label>
                  <input
                    type="email"
                    required
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="newadmin@example.com"
                    className="w-full rounded-lg border-gray-300 text-sm focus:border-brand-teal focus:ring-brand-teal"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">Temporary password</label>
                  <input
                    type="password"
                    required
                    minLength={8}
                    value={invitePassword}
                    onChange={(e) => setInvitePassword(e.target.value)}
                    placeholder="Min. 8 characters"
                    className="w-full rounded-lg border-gray-300 text-sm focus:border-brand-teal focus:ring-brand-teal"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-2">Role</label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {ROLES.map((r) => (
                    <label
                      key={r.value}
                      className={[
                        'flex flex-col gap-0.5 p-3 rounded-lg border-2 cursor-pointer transition-colors',
                        inviteRole === r.value
                          ? 'border-brand-teal bg-brand-teal-pale'
                          : 'border-gray-200 hover:border-gray-300',
                      ].join(' ')}
                    >
                      <input
                        type="radio"
                        className="sr-only"
                        name="role"
                        value={r.value}
                        checked={inviteRole === r.value}
                        onChange={() => setInviteRole(r.value)}
                      />
                      <span className="text-xs font-semibold text-gray-800">{r.label}</span>
                      <span className="text-[11px] text-gray-400">{r.desc}</span>
                    </label>
                  ))}
                </div>
              </div>

              {inviteMsg && (
                <div className={[
                  'flex items-start gap-2 p-3 rounded-lg text-sm',
                  inviteMsg.type === 'ok' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600',
                ].join(' ')}>
                  {inviteMsg.type === 'ok' ? <Check size={15} className="mt-0.5 flex-shrink-0" /> : <AlertCircle size={15} className="mt-0.5 flex-shrink-0" />}
                  {inviteMsg.text}
                </div>
              )}

              <button
                type="submit"
                disabled={inviting || !inviteEmail || !invitePassword}
                className="px-4 py-2 bg-brand-teal text-white text-sm font-semibold rounded-lg hover:bg-brand-teal-mid transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {inviting ? 'Adding…' : 'Add admin'}
              </button>
            </form>
          </div>
        </RoleGate>

      </main>
    </div>
  );
}
