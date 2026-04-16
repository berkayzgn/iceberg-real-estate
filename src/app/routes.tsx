import { createBrowserRouter } from 'react-router';
import { Layout } from './components/Layout';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { TransactionsListPage } from './pages/TransactionsListPage';
import { TransactionDetailPage } from './pages/TransactionDetailPage';
import { AgentsPage } from './pages/AgentsPage';
import { FinancialReportsPage } from './pages/FinancialReportsPage';

export const router = createBrowserRouter([
  {
    path: '/login',
    Component: LoginPage,
  },
  {
    path: '/',
    Component: Layout,
    children: [
      { index: true, Component: DashboardPage },
      { path: 'transactions', Component: TransactionsListPage },
      { path: 'transactions/:id', Component: TransactionDetailPage },
      { path: 'agents', Component: AgentsPage },
      { path: 'reports', Component: FinancialReportsPage },
    ],
  },
]);
