import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { TagsProvider } from './context/TagsContext';
import AppRoutes from './routes/AppRoutes';

export default function App() {
  return (
    <AuthProvider>
      <TagsProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </TagsProvider>
    </AuthProvider>
  );
}
