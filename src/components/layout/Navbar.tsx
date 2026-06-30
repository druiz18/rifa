import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/useAuth';
import Button from '../ui/Button';

export default function Navbar() {
  const { user, signOut } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Función para cerrar el menú al hacer clic en un enlace (buena UX móvil)
  const closeMenu = () => setIsMenuOpen(false);

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          
          {/* Logo / Inicio (Siempre visible) */}
          <Link to={user ? "/" : "/"} className="flex items-center gap-2" onClick={closeMenu}>
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
              R
            </div>
            <span className="font-bold text-gray-900 text-lg">Rifa-co</span>
          </Link>

          {/* BOTÓN HAMBURGUESA (Solo visible en móvil) */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500"
            >
              <span className="sr-only">Abrir menú principal</span>
              {/* Ícono de Hamburguesa / X */}
              {isMenuOpen ? (
                <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>

          {/* --- ESCRITORIO (md y superior) --- */}
          
          {/* Links Centrales (Ocultos en móvil) */}
          <div className="hidden md:flex items-center space-x-8 text-sm font-medium text-gray-500">
            <Link to="/como-funciona" className="hover:text-indigo-600 transition-colors">
              Cómo funciona
            </Link>
            <Link to="/politicas" className="hover:text-indigo-600 transition-colors">
              Políticas y Seguridad
            </Link>
          </div>

          {/* Botones Derechos (Ocultos en móvil) */}
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <>
                <Link to="/crear-sorteo">
                  <Button variant="primary" className="!w-auto !px-4 !py-2">+ Crear Sorteo</Button>
                </Link>
                <Link to="/dashboard" className="text-sm text-gray-600 hover:text-indigo-600 font-medium">
                  Mi Panel
                </Link>
                <button onClick={signOut} className="text-sm text-red-500 hover:text-red-700 font-medium">
                  Cerrar Sesión
                </button>
              </>
            ) : (
              <>
                <Link to="/login">
                  <Button variant="ghost" className="!w-auto !px-4 !py-2 !text-gray-700">Iniciar Sesión</Button>
                </Link>
                <Link to="/login">
                  <Button variant="primary" className="!w-auto !px-4 !py-2">Crear Sorteo</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>

      {/* --- MENÚ MÓVIL (Solo visible si isMenuOpen es true y la pantalla es pequeña) --- */}
      <div className={`md:hidden ${isMenuOpen ? 'block' : 'hidden'}`}>
        <div className="px-4 pt-2 pb-3 space-y-1 border-t">
          
          {/* Links Móvil */}
          <Link
            to="/como-funciona"
            className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-indigo-600 hover:bg-gray-50"
            onClick={closeMenu}
          >
            Cómo funciona
          </Link>
          <Link
            to="/politicas"
            className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-indigo-600 hover:bg-gray-50"
            onClick={closeMenu}
          >
            Políticas y Seguridad
          </Link>

          <div className="pt-4 border-t mt-2">
            {user ? (
              // Botones si está logueado (Móvil)
              <div className="space-y-2">
                <Link to="/crear-sorteo" onClick={closeMenu}>
                  <Button variant="primary" className="w-full">+ Crear Sorteo</Button>
                </Link>
                <Link to="/dashboard" onClick={closeMenu}>
                  <Button variant="ghost" className="w-full !text-gray-700">Mi Panel</Button>
                </Link>
                <button 
                  onClick={() => { signOut(); closeMenu(); }} 
                  className="w-full text-left px-3 py-2 rounded-md text-base font-medium text-red-500 hover:text-red-700 hover:bg-gray-50"
                >
                  Cerrar Sesión
                </button>
              </div>
            ) : (
              // Botones si NO está logueado (Móvil)
              <div className="space-y-2">
                <Link to="/login" onClick={closeMenu}>
                  <Button variant="ghost" className="w-full !text-gray-700">Iniciar Sesión</Button>
                </Link>
                <Link to="/login" onClick={closeMenu}>
                  <Button variant="primary" className="w-full">Crear Sorteo</Button>
                </Link>
              </div>
            )}
          </div>

        </div>
      </div>
    </nav>
  );
}