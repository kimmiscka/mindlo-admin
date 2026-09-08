import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './hooks/useAuth';
import ProtectedRoute from './components/ProtectedRoute';
import Sidebar from './components/Sidebar';
import RoleGate from './components/RoleGate';

import Login    from './pages/Login';
import Overview from './pages/Overview';
import Content  from './pages/Content';
import Users    from './pages/Users';
import Activity from './pages/Activity';
import Directory from './pages/Directory';
import Quotes   from './pages/Quotes';
import Settings from './pages/Settings';

function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 ml-60 min-w-0">
        {children}
      </div>
    </div>
  );
}

function NotAllowed() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <p className="text-2xl font-bold text-gray-300 mb-2">403</p>
        <p className="text-sm text-gray-500">You don't have access to this section.</p>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route
            path="/*"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <Routes>
                    <Route path="/" element={<Navigate to="/overview" replace />} />
                    <Route path="/overview"  element={<RoleGate section="overview"  fallback={<NotAllowed />}><Overview /></RoleGate>} />
                    <Route path="/content"   element={<RoleGate section="content"   fallback={<NotAllowed />}><Content /></RoleGate>} />
                    <Route path="/users"     element={<RoleGate section="users"     fallback={<NotAllowed />}><Users /></RoleGate>} />
                    <Route path="/activity"  element={<RoleGate section="activity"  fallback={<NotAllowed />}><Activity /></RoleGate>} />
                    <Route path="/directory" element={<RoleGate section="directory" fallback={<NotAllowed />}><Directory /></RoleGate>} />
                    <Route path="/quotes"    element={<RoleGate section="quotes"    fallback={<NotAllowed />}><Quotes /></RoleGate>} />
                    <Route path="/settings"  element={<RoleGate section="settings"  fallback={<NotAllowed />}><Settings /></RoleGate>} />
                    <Route path="*" element={<Navigate to="/overview" replace />} />
                  </Routes>
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
