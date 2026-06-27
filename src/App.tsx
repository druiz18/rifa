import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/useAuth'; 
import Login from './pages/Login';

// Componente para proteger rutas
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) return <div className="p-10 text-center">Cargando perfil...</div>;
  if (!user) return <Navigate to="/login" />;

  return <>{children}</>;
}

// Placeholder para la página que haremos después
function Dashboard() {
  const { profile, signOut } = useAuth();
  return (
    <div className="p-10">
      <h1 className="text-3xl font-bold">Panel del Creador</h1>
      <p>Bienvenido, {profile?.nombre}! Tu rol es: {profile?.role}</p>
      <button onClick={signOut} className="mt-4 text-red-500 underline">Cerrar Sesión</button>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Ruta pública */}
        <Route path="/login" element={<Login />} />

        {/* Rutas protegidas (requieren estar logueado) */}
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } 
        />

        {/* Ruta por defecto */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;