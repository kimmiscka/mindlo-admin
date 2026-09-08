import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { session, admin, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-brand-teal border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-gray-500">Loading…</span>
        </div>
      </div>
    );
  }

  if (!session || !admin) return <Navigate to="/login" replace />;

  return <>{children}</>;
}
