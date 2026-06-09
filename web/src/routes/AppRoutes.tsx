import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute   from '../views/partials/ProtectedRoute';
import Layout           from '../views/partials/Layout';
import LoginPage        from '../views/completes/LoginPage';
import RegisterPage     from '../views/completes/RegisterPage';
import AuthCallbackPage from '../views/completes/AuthCallbackPage';
import NotesPage        from '../views/completes/NotesPage';
import PinnedPage       from '../views/completes/PinnedPage';
import ArchivedPage     from '../views/completes/ArchivedPage';
import TrashPage        from '../views/completes/TrashPage';
import TagsPage         from '../views/completes/TagsPage';
import CalendarPage     from '../views/completes/CalendarPage';
import FoldersPage      from '../views/completes/FoldersPage';

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
        <Route index           element={<NotesPage />} />
        <Route path="pinned"   element={<PinnedPage />} />
        <Route path="archived" element={<ArchivedPage />} />
        <Route path="trash"    element={<TrashPage />} />
        <Route path="tags"     element={<TagsPage />} />
        <Route path="calendar" element={<CalendarPage />} />
        <Route path="folders"  element={<FoldersPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}