import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import type { AdminUser } from '../types';

interface AuthState {
  session: Session | null;
  admin: AdminUser | null;
  loading: boolean;
  /** True when the Supabase login succeeded but the email is not in admin_users. */
  accessDenied: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);

  const loadAdminUser = useCallback(async (s: Session | null) => {
    if (!s) {
      setAdmin(null);
      setAccessDenied(false);
      return;
    }
    const { data, error } = await supabase
      .from('admin_users')
      .select('id, email, role, created_at')
      .eq('id', s.user.id)
      .single();

    if (error || !data) {
      // Valid Supabase session but not in the admin_users allowlist → reject.
      await supabase.auth.signOut();
      setSession(null);
      setAdmin(null);
      setAccessDenied(true);
    } else {
      setAdmin(data as AdminUser);
      setAccessDenied(false);
    }
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      loadAdminUser(s).finally(() => setLoading(false));
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      loadAdminUser(s);
    });

    return () => subscription.unsubscribe();
  }, [loadAdminUser]);

  const signIn = useCallback(async (email: string, password: string) => {
    setAccessDenied(false);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: error.message };
    return { error: null };
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setAdmin(null);
    setSession(null);
  }, []);

  return (
    <AuthContext.Provider value={{ session, admin, loading, accessDenied, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside <AuthProvider>');
  return ctx;
}
