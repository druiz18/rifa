import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Database } from '../../lib/database.types';
import Button from '../ui/Button';

type Sorteo = Database['public']['Tables']['sorteos']['Row'];

interface SorteoCardProps {
  sorteo: Sorteo;
  onDelete: () => void; // <--- NUEVA PROP
}

export default function SorteoCard({ sorteo, onDelete }: SorteoCardProps) {
  const navigate = useNavigate();
  const [showConfirm, setShowConfirm] = useState(false); // Para no usar el alert feo de navegador

  const formatoMoneda = new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'COP',
  }).format(sorteo.precio);

  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100 hover:shadow-lg transition-shadow flex flex-col relative">
      
      {/* --- BOTÓN DE ELIMINAR (Esquina superior derecha) --- */}
      <div className="absolute top-2 right-2 z-10">
        {!showConfirm ? (
          <button 
            onClick={(e) => { e.stopPropagation(); setShowConfirm(true); }}
            className="p-1.5 bg-white/80 rounded-full text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors shadow-sm"
            title="Eliminar sorteo"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
          </button>
        ) : (
          <div className="flex items-center gap-1 bg-red-100 p-1 rounded-lg shadow-sm animate-pulse">
            <button onClick={(e) => { e.stopPropagation(); onDelete(); }} className="text-xs font-bold text-red-600 px-2 py-1 hover:bg-red-200 rounded">Sí</button>
            <button onClick={(e) => { e.stopPropagation(); setShowConfirm(false); }} className="text-xs font-bold text-gray-600 px-2 py-1 hover:bg-gray-200 rounded">No</button>
          </div>
        )}
      </div>

      {/* Imagen del sorteo */}
      <div className="h-48 w-full bg-gray-200 overflow-hidden">
        <img
          src={sorteo.imagen ?? undefined}
          alt={sorteo.titulo}
          className="w-full h-full object-cover"
        />
      </div>
      
      {/* Información */}
      <div className="p-5 flex-1 flex flex-col">
        {/* ... el resto del código de abajo queda exactamente igual ... */}
        <h3 className="text-lg font-bold text-gray-900 truncate" title={sorteo.titulo}>
          {sorteo.titulo}
        </h3>
        
        <p className="text-sm text-indigo-600 font-semibold mt-1">
          Premio: {sorteo.titulo_premio}
        </p>

        <div className="mt-4 flex items-center justify-between text-sm text-gray-500 border-t pt-3">
          <span className="font-medium text-gray-800 text-base">
            {formatoMoneda} <span className="text-xs font-normal">/ puesto</span>
          </span>
          <span>
            {sorteo.total_puestos} puestos
          </span>
        </div>

        <p className="text-xs text-gray-400 mt-2">
          Juega: {sorteo.fecha_sorteo
            ? new Date(sorteo.fecha_sorteo).toLocaleDateString("es-ES", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              })
            : "Fecha no disponible"}
        </p>

        <div className="mt-4 pt-4 border-t flex flex-col gap-2">
          <Button variant="ghost" className="w-auto! text-indigo-600! font-semibold! px-0! hover:bg-transparent! underline!" onClick={() => navigate(`/sorteo/${sorteo.id}`)}>
            Ver puestos / Compartir enlace
          </Button>
          <Button variant="primary" className="w-auto!" onClick={(e) => { e.stopPropagation(); navigate(`/gestionar-sorteo/${sorteo.id}`); }}>
            Gestionar Ventas
          </Button>
        </div>
      </div>
    </div>
  );
}