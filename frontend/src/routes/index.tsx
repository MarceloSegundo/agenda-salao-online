import { createBrowserRouter, Navigate } from 'react-router';
import { RegisterPage, LandingPage } from '../modules/tenant';
import { LoginPage } from '../modules/auth';
import { DashboardPage } from '../modules/dashboard';
import { AppLayout } from '../shared/components/layout/AppLayout';
import { AgendaPage } from '../modules/agenda/pages/agenda-page';
import { CustomersPage } from '../modules/customers/pages/customers-page';
import { SettingsPage } from '../modules/settings/pages/settings-page';

import { ServicesSettingsPage } from '../modules/settings/pages/services-settings-page';
import { ProfessionalsSettingsPage } from '../modules/settings/pages/professionals-settings-page';
import { HoursSettingsPage } from '../modules/settings/pages/hours-settings-page';
import { StoreSettingsPage } from '../modules/settings/pages/store-settings-page';

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
        children: [
          {
            index: true,
            element: <SettingsPage />,
          },
          {
            path: 'servicos',
            element: <ServicesSettingsPage />,
          },
          {
            path: 'equipe',
            element: <ProfessionalsSettingsPage />,
          },
          {
            path: 'horarios',
            element: <HoursSettingsPage />,
          },
          {
            path: 'loja',
            element: <StoreSettingsPage />,
          }
        ]
      },
    ]
  },
  // Catch-all redirect
  {
    path: '*',
    element: <Navigate to="/" replace />
  }
]);
