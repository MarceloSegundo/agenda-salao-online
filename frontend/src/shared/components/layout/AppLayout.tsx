import { Outlet, Navigate } from 'react-router';
import { BottomTabBar } from './BottomTabBar';

export function AppLayout() {
  // Simple check for authentication
  // A robust implementation might use a Context or Zustand store
  const isAuthenticated = !!localStorage.getItem('agenda-salao-token');

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex flex-col h-screen bg-slate-50">
      {/* Main content area */}
      {/* pb-16 to account for the BottomTabBar height (h-16) */}
      <main className="flex-1 overflow-y-auto pb-16">
        <Outlet />
      </main>

      {/* Navigation */}
      <BottomTabBar />
    </div>
  );
}
