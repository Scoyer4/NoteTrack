import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute    from '../views/partials/ProtectedRoute';
import Layout            from '../views/partials/Layout';
import LoginPage         from '../views/completes/LoginPage';
import RegisterPage      from '../views/completes/RegisterPage';
import AuthCallbackPage  from '../views/completes/AuthCallbackPage';

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/login"         element={<LoginPage />} />
      <Route path="/register"      element={<RegisterPage />} />
      <Route path="/auth/callback" element={<AuthCallbackPage />} />

      <Route
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index         element={<div>Notas — próximamente</div>} />
        <Route path="pinned"   element={<div>Fijadas — próximamente</div>} />
        <Route path="archived" element={<div>Archivadas — próximamente</div>} />
        <Route path="folders"  element={<div>Carpetas — próximamente</div>} />
        <Route path="tags"     element={<div>Etiquetas — próximamente</div>} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
