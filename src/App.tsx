import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/useAuth';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard'; // <- Importamos el archivo real que creaste
import CrearSorteo from './pages/CrearSorteo';

// Componente para proteger rutas
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) return <div className="p-10 text-center">Cargando perfil...</div>;
  if (!user) return <Navigate to="/login" />;

  return <>{children}</>;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Ruta pública */}
        <Route path="/login" element={<Login />} />

        {/* Ruta protegida (requiere estar logueado) */}
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } 
        />

        <Route
          path='/crear-sorteo'
          element={
            <ProtectedRoute>
              <CrearSorteo/>
            </ProtectedRoute>
          }
        />

        {/* Si el usuario escribe una ruta que no existe, lo mandamos al login */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;