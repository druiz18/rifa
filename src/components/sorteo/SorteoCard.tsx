import type { Database } from '../../lib/database.types';

// Usamos el tipo generado por Supabase
type Sorteo = Database['public']['Tables']['sorteos']['Row'];

interface SorteoCardProps {
  sorteo: Sorteo;
}

export default function SorteoCard({ sorteo }: SorteoCardProps) {
  // Formateamos el precio a moneda (ej: $50.00)
  const formatoMoneda = new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP', // Cambia a tu moneda si necesitas (USD, COP, etc.)
  }).format(sorteo.precio);

  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100 hover:shadow-lg transition-shadow">
      {/* Imagen del sorteo */}
      <div className="h-48 w-full bg-gray-200 overflow-hidden">
        <img
          src={sorteo.imagen ?? undefined}
          alt={sorteo.titulo}
          className="w-full h-full object-cover"
        />
      </div>
      
      {/* Información */}
      <div className="p-5">
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
          Juega: {sorteo.fecha_sorteo ? new Date(sorteo.fecha_sorteo).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Fecha no disponible'}
        </p>
      </div>
    </div>
  );
}