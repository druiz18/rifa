import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import { supabase } from "../lib/supabase";
import Input from "../components/ui/Input";
import Button from "../components/ui/Button";

export default function CrearSorteo() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Estado del formulario
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    titulo: "",
    descripcion: "",
    titulo_premio: "",
    descripcion_premio: "",
    precio: "",
    total_puestos: "",
    fecha_sorteo: "",
  });

  const [imagenFile, setImagenFile] = useState<File | null>(null);

  // Manejar cambios en los inputs de texto
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Manejar la subida de la imagen
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImagenFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !imagenFile) {
      setError("Debes subir una imagen para el sorteo.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // 1. SUBIR LA IMAGEN A SUPABASE STORAGE
      // Generamos un nombre único para que no choque con otras imágenes
      const fileExt = imagenFile.name.split(".").pop();
      const fileName = `${user.id}-${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("sorteos-imagenes")
        .upload(filePath, imagenFile);

      if (uploadError) throw uploadError;

      // 2. CONSEGUIR LA URL PÚBLICA DE LA IMAGEN
      const { data: imageData } = supabase.storage
        .from("sorteos-imagenes")
        .getPublicUrl(filePath);

      const imagenUrl = imageData.publicUrl;

      // 3. INSERTAR EL SORTEO EN LA BASE DE DATOS
      // NOTA: Añadimos .select() para que Supabase nos devuelva el sorteo recién creado y podamos sacar su ID
      const { data: sorteoCreado, error: insertError } = await supabase
        .from("sorteos")
        .insert([
          {
            creador_id: user.id,
            titulo: formData.titulo,
            descripcion: formData.descripcion,
            titulo_premio: formData.titulo_premio,
            descripcion_premio: formData.descripcion_premio,
            precio: parseFloat(formData.precio),
            total_puestos: parseInt(formData.total_puestos),
            fecha_sorteo: formData.fecha_sorteo,
            imagen: imagenUrl,
          },
        ])
        .select() // <- ¡CLAVE! Para obtener el ID de vuelta
        .single();

      if (insertError) throw insertError;

      // -------------------------------------------------------------
      // NUEVO PASO: GENERAR LOS PUESTOS AUTOMÁTICAMENTE
      // -------------------------------------------------------------
      const cantidadPuestos = parseInt(formData.total_puestos);
      const puestosParaInsertar = [];

      // Preparamos un array con todos los números del 1 al N
      for (let i = 1; i <= cantidadPuestos; i++) {
        puestosParaInsertar.push({
          sorteo_id: sorteoCreado.id, // Ligamos cada puesto a este sorteo
          numero: i,
          estado: "disponible", // Todos empiezan disponibles
        });
      }

      // Insertamos todos los puestos de una sola vez (es súper rápido)
      const { error: puestosError } = await supabase
        .from("puestos")
        .insert(puestosParaInsertar);

      if (puestosError) throw puestosError;
      // -------------------------------------------------------------

      // 4. REDIRIGIR AL DASHBOARD SI TODO SALIÓ BIEN
      navigate("/dashboard");
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(errorMessage || "Ocurrió un error al crear el sorteo");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Crear Nuevo Sorteo</h1>

      {error && (
        <div className="bg-red-100 text-red-700 p-3 rounded mb-4">{error}</div>
      )}

      <form
        onSubmit={handleSubmit}
        className="bg-white p-6 rounded-lg shadow space-y-5"
      >
        <Input
          id="titulo"
          name="titulo"
          label="Título del Sorteo"
          placeholder="Ej: Rifa de una Motocicleta"
          value={formData.titulo}
          onChange={handleChange}
          required
        />

        <Input
          id="descripcion"
          name="descripcion"
          label="Descripción general"
          type="textarea" // Ojo: nuestro input no soporta textarea aún, lo dejamos como text por ahora
          placeholder="Detalles del sorteo..."
          value={formData.descripcion}
          onChange={handleChange}
        />

        <div className="border-t pt-4 mt-4">
          <h3 className="font-semibold text-gray-700 mb-3">Datos del Premio</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              id="titulo_premio"
              name="titulo_premio"
              label="Nombre del Premio"
              placeholder="Honda CBR 600"
              value={formData.titulo_premio}
              onChange={handleChange}
              required
            />
            <Input
              id="descripcion_premio"
              name="descripcion_premio"
              label="Descripción del Premio"
              placeholder="Año 2023, 0km"
              value={formData.descripcion_premio}
              onChange={handleChange}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input
            id="precio"
            name="precio"
            label="Precio por Puesto ($)"
            type="number"
            step="0.01"
            placeholder="5000"
            value={formData.precio}
            onChange={handleChange}
            required
          />
          <Input
            id="total_puestos"
            name="total_puestos"
            label="Total de Puestos"
            type="number"
            placeholder="100"
            value={formData.total_puestos}
            onChange={handleChange}
            required
          />
          <Input
            id="fecha_sorteo"
            name="fecha_sorteo"
            label="Fecha del Sorteo"
            type="datetime-local"
            value={formData.fecha_sorteo}
            onChange={handleChange}
            required
          />
        </div>

        {/* Input especial para la imagen */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Imagen del Sorteo
          </label>
          <input
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
            required
          />
        </div>

        <Button type="submit" loading={loading} className="mt-6">
          {loading ? "Creando Sorteo..." : "Publicar Sorteo"}
        </Button>
      </form>
    </div>
  );
}
