import { useEffect, useState } from "react";
//import { useNavigate } from "react-router-dom";
//import { useAuth } from "../context/useAuth";
import { supabase } from "../lib/supabase";
import type { Database } from "../lib/database.types";
import SorteoCard from "../components/sorteo/SorteoCard";
//import Button from "../components/ui/Button";

type Sorteo = Database["public"]["Tables"]["sorteos"]["Row"];

export default function Dashboard() {
  //const { profile } = useAuth();
  //const navigate = useNavigate();

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

    const eliminarSorteo = async (sorteoId: string, imagenUrl: string) => {
    // 1. Confirmación del usuario
    if (!confirm('¿Estás seguro? Se eliminará el sorteo, sus puestos y la imagen.')) return;

    try {
      // 2. Extraer el nombre del archivo de la URL para borrarlo del Storage
      // La URL se ve así: https://.../storage/v1/object/public/sorteos-imagenes/nombre.jpg
      const urlParts = imagenUrl.split('/');
      const nombreArchivo = urlParts[urlParts.length - 1]; // Extrae 'nombre.jpg'

      // Borrar imagen del Storage
      const { error: errorStorage } = await supabase.storage
        .from('sorteos-imagenes')
        .remove([nombreArchivo]);

      if (errorStorage) console.warn('No se pudo borrar la imagen, pero se borrará el sorteo:', errorStorage.message);

      // 3. Borrar el sorteo de la base de datos (esto borrará los puestos en cascada)
      const { error: errorDb } = await supabase
        .from('sorteos')
        .delete()
        .eq('id', sorteoId);

      if (errorDb) throw errorDb;

      // 4. Actualizar la lista en pantalla sin recargar
      setSorteos(sorteos.filter(s => s.id !== sorteoId));
      alert('Sorteo eliminado correctamente');
      
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      alert('Error al eliminar: ' + message);
    }
  };

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
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Mis Sorteos</h1>
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
            <SorteoCard 
              key={sorteo.id} 
              sorteo={sorteo} 
              onDelete={() => eliminarSorteo(sorteo.id, sorteo.imagen || '')} // <--- NUEVA PROP
            />
          ))}
        </div>
      )}
    </div>
  );
}
