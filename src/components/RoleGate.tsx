import { useAuth } from '../hooks/useAuth';
import { ROLE_SECTIONS } from '../types';

interface RoleGateProps {
  section: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

/** Renders children only if the current admin's role grants access to `section`. */
export default function RoleGate({ section, children, fallback = null }: RoleGateProps) {
  const { admin } = useAuth();
  if (!admin) return null;
  const allowed = ROLE_SECTIONS[admin.role] ?? [];
  if (!allowed.includes(section)) return <>{fallback}</>;
  return <>{children}</>;
}
