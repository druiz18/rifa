import { useNavigate } from "react-router-dom";
import type { Database } from "../../lib/database.types";
import Button from "../ui/Button";

// Usamos el tipo generado por Supabase
type Sorteo = Database["public"]["Tables"]["sorteos"]["Row"];

interface SorteoCardProps {
  sorteo: Sorteo;
}

export default function SorteoCard({ sorteo }: SorteoCardProps) {
  const navigate = useNavigate(); // Hook para redirigir

  // Formateamos el precio a moneda
  const formatoMoneda = new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN", // Cambia a tu moneda si necesitas
  }).format(sorteo.precio);

  return (
    // Añadimos flex flex-col para que el botón se quede abajo siempre
    <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100 hover:shadow-lg transition-shadow flex flex-col">
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
        <h3
          className="text-lg font-bold text-gray-900 truncate"
          title={sorteo.titulo}
        >
          {sorteo.titulo}
        </h3>

        <p className="text-sm text-indigo-600 font-semibold mt-1">
          Premio: {sorteo.titulo_premio}
        </p>

        <div className="mt-4 flex items-center justify-between text-sm text-gray-500 border-t pt-3">
          <span className="font-medium text-gray-800 text-base">
            {formatoMoneda}{" "}
            <span className="text-xs font-normal">/ puesto</span>
          </span>
          <span>{sorteo.total_puestos} puestos</span>
        </div>

        <p className="text-xs text-gray-400 mt-2">
          Juega:{" "}
          {sorteo.fecha_sorteo
            ? new Date(sorteo.fecha_sorteo).toLocaleDateString("es-ES", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              })
            : "Fecha no disponible"}
        </p>

        {/* --- NUEVO BOTÓN --- */}
        <div className="mt-4 pt-4 border-t">
          <Button
            variant="ghost"
            className="!w-auto !text-indigo-600 !font-semibold !px-0 hover:!bg-transparent !underline"
            onClick={() => navigate(`/sorteo/${sorteo.id}`)}
          >
            Ver puestos / Compartir enlace
          </Button>

          {/* --- BOTÓN GESTIONAR --- */}
          <Button
            variant="primary"
            className="!w-auto !mt-2"
            onClick={(e) => {
              e.stopPropagation(); // Para que no dispare otros clicks si los hay
              navigate(`/gestionar-sorteo/${sorteo.id}`);
            }}
          >
            Gestionar Ventas
          </Button>
        </div>
      </div>
    </div>
  );
}
