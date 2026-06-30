import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/useAuth';
import Navbar from './components/layout/Navbar';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import CrearSorteo from './pages/CrearSorteo';
import Home from './pages/Home';
import ComoFunciona from './pages/ComoFunciona';
import Politicas from './pages/Politicas';
import SorteoPublico from './pages/SorteoPublico';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="p-10 text-center">Cargando...</div>;
  if (!user) return <Navigate to="/" replace />;
  return <>{children}</>;
}

function App() {
  return (
    <BrowserRouter>
      {/* El Layout Global envuelve TODA la app */}
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Navbar />
        
        {/* El contenido cambia según la ruta */}
        <main className="flex-1">
          <Routes>
            {/* Rutas Públicas */}
            <Route path="/" element={<Home />} />
            <Route path="/como-funciona" element={<ComoFunciona />} />
            <Route path="/politicas" element={<Politicas />} />
            <Route path="/login" element={<Login />} />

            {/* RUTA PÚBLICA DEL SORTEO */}
          <Route path="/sorteo/:id" element={<SorteoPublico />} />

            {/* Rutas Protegidas */}
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/crear-sorteo" element={<ProtectedRoute><CrearSorteo /></ProtectedRoute>} />

            {/* 404 */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;