import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import { supabase } from "../lib/supabase";
import type { Database } from "../lib/database.types";
import SorteoCard from "../components/sorteo/SorteoCard";
import Button from "../components/ui/Button";

type Sorteo = Database["public"]["Tables"]["sorteos"]["Row"];

export default function Dashboard() {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();

  const [sorteos, setSorteos] = useState<Sorteo[]>([]);
  const [loading, setLoading] = useState(true);

  // useEffect se ejecuta al cargar la página
  useEffect(() => {
    const cargarSorteos = async () => {
      const { data, error } = await supabase
        .from("sorteos")
        .select("*")
        .order("created_at", { ascending: false }); // Los más nuevos primero

      if (error) {
        console.error("Error al cargar sorteos:", error);
      } else {
        setSorteos(data || []);
      }
      setLoading(false);
    };

    void cargarSorteos();
  }, []);

  // Mientras carga la base de datos
  if (loading) {
    return (
      <div className="p-10 text-center text-gray-500">
        Cargando tus sorteos...
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Cabecera del Dashboard */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Mis Sorteos</h1>
          <p className="text-gray-500 mt-1">
            Bienvenido de vuelta, {profile?.nombre || "Creador"}
          </p>
        </div>

        <div className="flex gap-3">
          <Button onClick={() => navigate("/crear-sorteo")}>
            + Crear Nuevo Sorteo
          </Button>
          <Button variant="ghost" onClick={signOut}>
            Cerrar Sesión
          </Button>
        </div>
      </div>

      {/* Lista de Sorteos */}
      {sorteos.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-lg border-2 border-dashed border-gray-200">
          <p className="text-gray-400 text-lg">
            Aún no has creado ningún sorteo.
          </p>
          <p className="text-gray-400 text-sm mt-2">
            ¡Haz clic en el botón de arriba para empezar a ganar!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sorteos.map((sorteo) => (
            <SorteoCard key={sorteo.id} sorteo={sorteo} />
          ))}
        </div>
      )}
    </div>
  );
}
