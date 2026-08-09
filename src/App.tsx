import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthListener } from './store/authStore';
import ProtectedRoute from './components/ProtectedRoute';
import AppLayout from './components/AppLayout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import InputTransactionPage from './pages/InputTransactionPage';
import TransactionLogsPage from './pages/TransactionLogsPage';
import ProductsPage from './pages/ProductsPage';

function AppRoutes() {
  useAuthListener();
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        element={
          <ProtectedRoute allowedRoles={['admin', 'management']}>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<DashboardPage />} />
        <Route
          path="products"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <ProductsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="input-transaction"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <InputTransactionPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="transaction-logs"
          element={
            <ProtectedRoute allowedRoles={['management']}>
              <TransactionLogsPage />
            </ProtectedRoute>
          }
        />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}
