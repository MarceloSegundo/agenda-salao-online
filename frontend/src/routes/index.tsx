import { createBrowserRouter, Navigate } from 'react-router';
import { RegisterPage, LandingPage } from '../modules/tenant';
import { LoginPage } from '../modules/auth';
import { DashboardPage } from '../modules/dashboard';
import { AppLayout } from '../shared/components/layout/AppLayout';
import { AgendaPage } from '../modules/agenda/pages/agenda-page';
import { CustomersPage } from '../modules/customers/pages/customers-page';
import { SettingsPage } from '../modules/settings/pages/settings-page';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <LandingPage />,
  },
  {
    path: '/register',
    element: <RegisterPage />,
  },
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/app',
    element: <AppLayout />,
    children: [
      {
        index: true,
        element: <DashboardPage />,
      },
      {
        path: 'agenda',
        element: <AgendaPage />,
      },
      {
        path: 'clientes',
        element: <CustomersPage />,
      },
      {
        path: 'configuracoes',
        element: <SettingsPage />,
      },
    ]
  },
  // Catch-all redirect
  {
    path: '*',
    element: <Navigate to="/" replace />
  }
]);
