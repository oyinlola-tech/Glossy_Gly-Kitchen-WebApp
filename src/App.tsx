import { RouterProvider } from 'react-router';
import { router } from './routes';
import { AuthProvider } from './contexts/AuthContext';
import { AdminAuthProvider } from './contexts/AdminAuthContext';
import { Toaster } from 'sonner@2.0.3';

export default function App() {
  return (
    <AuthProvider>
      <AdminAuthProvider>
        <RouterProvider router={router} />
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: 'white',
              color: '#1e293b',
              border: '1px solid #e2e8f0',
            },
          }}
        />
      </AdminAuthProvider>
    </AuthProvider>
  );
}
