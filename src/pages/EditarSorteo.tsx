import { useEffect, useMemo, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "../lib/supabase";
import type { Database } from "../lib/database.types";
import { useAuth } from "../context/useAuth";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";

type Sorteo = Database["public"]["Tables"]["sorteos"]["Row"];

// Convierte la fecha de la BD (TIMESTAMPTZ) al formato que espera
// un <input type="datetime-local">: "YYYY-MM-DDTHH:mm"
function toLocalInput(fecha?: string | null): string {
  if (!fecha) return "";
  const d = new Date(fecha);
  if (isNaN(d.getTime())) return "";
  const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
}

// Extrae el nombre del archivo a partir de la URL pública de Storage
function getNombreArchivo(url: string): string {
  return url.split("/").pop() || "";
}

export default function EditarSorteo() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, profile, loading: authLoading } = useAuth();

  const [sorteo, setSorteo] = useState<Sorteo | null>(null);
  const [cargando, setCargando] = useState(true);

  // Campos del formulario
  const [titulo, setTitulo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [precio, setPrecio] = useState("");
  const [tituloPremio, setTituloPremio] = useState("");
  const [descripcionPremio, setDescripcionPremio] = useState("");
  const [fechaSorteo, setFechaSorteo] = useState("");
  const [totalPuestos, setTotalPuestos] = useState("");

  // Imagen
  const [imagenActual, setImagenActual] = useState<string | null>(null);
  const [nuevaImagen, setNuevaImagen] = useState<File | null>(null);

  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");

  // ── 1. Cargar el sorteo ─────────────────────────────────────────
  useEffect(() => {
    if (!id) return;

    const cargarSorteo = async () => {
      const { data, error } = await supabase
        .from("sorteos")
        .select("*")
        .eq("id", id)
        .single();

      if (error || !data) {
        console.error("Error al cargar el sorteo:", error);
        navigate("/dashboard");
        return;
      }

      setSorteo(data);
      setTitulo(data.titulo);
      setDescripcion(data.descripcion || "");
      setPrecio(String(data.precio));
      setTituloPremio(data.titulo_premio);
      setDescripcionPremio(data.descripcion_premio || "");
      setFechaSorteo(toLocalInput(data.fecha_sorteo));
      setTotalPuestos(String(data.total_puestos));
      setImagenActual(data.imagen);
      setCargando(false);
    };

    void cargarSorteo();
  }, [id, navigate]);

  // ── 2. Verificar permisos: solo el creador o un admin ───────────
  useEffect(() => {
    if (!sorteo || authLoading || !user) return;

    const esCreador = sorteo.creador_id === user.id;
    const esAdmin = profile?.role === "admin";

    if (!esCreador && !esAdmin) {
      // No es el dueño ni admin → a la vista pública
      navigate(`/sorteo/${sorteo.id}`);
    }
  }, [sorteo, authLoading, user, profile, navigate]);

  const handleImagenChange = (e: ChangeEvent<HTMLInputElement>) => {
    const archivo = e.target.files?.[0];
    if (archivo) setNuevaImagen(archivo);
  };

  // Ajusta los puestos cuando cambia el total:
  // - Si aumenta: crea los puestos nuevos
  // - Si reduce: elimina SOLO los puestos libres que quedan fuera del rango
  const ajustarPuestos = async (
    sorteoId: string,
    totalViejo: number,
    totalNuevo: number
  ) => {
    if (totalNuevo > totalViejo) {
      const nuevos = Array.from({ length: totalNuevo - totalViejo }, (_, i) => ({
        sorteo_id: sorteoId,
        numero: totalViejo + i + 1,
      }));

      const { error: insertError } = await supabase.from("puestos").insert(nuevos);
      if (insertError) {
        throw new Error("No se pudieron crear los puestos nuevos: " + insertError.message);
      }
    } else {
      // Antes de borrar: verificar que los puestos que quedan fuera del
      // nuevo rango estén libres (nadie los reservó ni compró)
      const { data: ocupados } = await supabase
        .from("puestos")
        .select("numero, estado")
        .eq("sorteo_id", sorteoId)
        .gt("numero", totalNuevo)
        .neq("estado", "disponible");

      if (ocupados && ocupados.length > 0) {
        throw new Error(
          `No puedes reducir a ${totalNuevo} puestos: el puesto #${ocupados[0].numero} ` +
            `ya está ${ocupados[0].estado}. Libéralo primero desde la gestión de ventas.`
        );
      }

      const { error: deleteError } = await supabase
        .from("puestos")
        .delete()
        .eq("sorteo_id", sorteoId)
        .gt("numero", totalNuevo)
        .eq("estado", "disponible");

      if (deleteError) {
        throw new Error("No se pudieron eliminar los puestos: " + deleteError.message);
      }
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!sorteo || !user) return;

    setError("");

    if (sorteo.estado !== "activo") {
      setError("Este sorteo ya no está activo y no puede editarse.");
      return;
    }

    const precioNum = parseFloat(precio);
    const totalNum = parseInt(totalPuestos, 10);

    if (!titulo.trim()) return setError("El título del sorteo es obligatorio.");
    if (!tituloPremio.trim()) return setError("El título del premio es obligatorio.");
    if (isNaN(precioNum) || precioNum <= 0)
      return setError("El precio debe ser un número mayor a 0.");
    if (isNaN(totalNum) || totalNum < 1)
      return setError("El total de puestos debe ser al menos 1.");
    if (!fechaSorteo) return setError("La fecha del sorteo es obligatoria.");

    setGuardando(true);

    try {
      // 1) Si eligió imagen nueva, subirla a Storage
      let imagenFinal = imagenActual;
      let imagenViejaABorrar: string | null = null;

      if (nuevaImagen) {
        const ext = nuevaImagen.name.split(".").pop()?.toLowerCase() || "jpg";
        const nombreArchivo = `${user.id}-${Date.now()}.${ext}`;

        const { error: uploadError } = await supabase.storage
          .from("sorteos-imagenes")
          .upload(nombreArchivo, nuevaImagen);

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from("sorteos-imagenes")
          .getPublicUrl(nombreArchivo);

        imagenFinal = urlData.publicUrl;
        if (imagenActual) imagenViejaABorrar = getNombreArchivo(imagenActual);
      }

      // 2) Ajustar puestos ANTES de actualizar (valida primero y
      //    así no dejamos el sorteo a medio cambiar)
      if (totalNum !== sorteo.total_puestos) {
        await ajustarPuestos(sorteo.id, sorteo.total_puestos, totalNum);
      }

      // 3) Actualizar el registro del sorteo
      const { error: updateError } = await supabase
        .from("sorteos")
        .update({
          titulo: titulo.trim(),
          descripcion: descripcion.trim() || null,
          precio: precioNum,
          titulo_premio: tituloPremio.trim(),
          descripcion_premio: descripcionPremio.trim() || null,
          fecha_sorteo: new Date(fechaSorteo).toISOString(),
          total_puestos: totalNum,
          imagen: imagenFinal,
        })
        .eq("id", sorteo.id);

      if (updateError) throw updateError;

      // 4) Borrar la imagen anterior de Storage (si la reemplazó)
      if (imagenViejaABorrar) {
        await supabase.storage.from("sorteos-imagenes").remove([imagenViejaABorrar]);
      }

      navigate(`/gestionar-sorteo/${sorteo.id}`);
    } catch (err) {
      console.error("Error al guardar los cambios:", err);
      setError(
        err instanceof Error ? err.message : "Ocurrió un error al guardar los cambios."
      );
    } finally {
      setGuardando(false);
    }
  };

  const preview = useMemo(() => {
    if (!nuevaImagen) return imagenActual;
    return URL.createObjectURL(nuevaImagen);
  }, [nuevaImagen, imagenActual]);

  if (cargando || authLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-gray-500">Cargando sorteo...</p>
      </div>
    );
  }

  if (!sorteo) return null;

  const editable = sorteo.estado === "activo";

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <button
        onClick={() => navigate(`/gestionar-sorteo/${sorteo.id}`)}
        className="mb-4 text-sm font-medium text-gray-500 hover:text-gray-700"
      >
        ← Volver a la gestión
      </button>

      <h1 className="text-xl font-bold text-gray-900">Editar Sorteo</h1>
      <p className="mt-1 text-gray-500">
        Actualiza los datos del sorteo. Los compradores verán los cambios de inmediato.
      </p>

      {!editable && (
        <div className="mt-4 rounded-lg border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-800">
          ⚠️ Este sorteo está <strong>{sorteo.estado}</strong> y ya no puede editarse.
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="mt-6 space-y-5 rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
      >
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <Input
          label="Título del sorteo"
          value={titulo}
          onChange={(e) => setTitulo(e.target.value)}
        />

        <Input
          label="Descripción (opcional)"
          value={descripcion}
          onChange={(e) => setDescripcion(e.target.value)}
        />

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <Input
            label="Precio por puesto (MXN)"
            type="number"
            step="0.01"
            min="0"
            value={precio}
            onChange={(e) => setPrecio(e.target.value)}
          />
          <Input
            label="Fecha del sorteo"
            type="datetime-local"
            value={fechaSorteo}
            onChange={(e) => setFechaSorteo(e.target.value)}
          />
        </div>

        <Input
          label="Título del premio"
          value={tituloPremio}
          onChange={(e) => setTituloPremio(e.target.value)}
        />

        <Input
          label="Descripción del premio (opcional)"
          value={descripcionPremio}
          onChange={(e) => setDescripcionPremio(e.target.value)}
        />

        <div>
          <Input
            label="Total de puestos"
            type="number"
            min="1"
            value={totalPuestos}
            onChange={(e) => setTotalPuestos(e.target.value)}
          />
          <p className="mt-1 text-xs text-gray-500">
            Actualmente hay {sorteo.total_puestos} puestos. Si aumentas el número se
            crearán puestos nuevos; si lo reduces solo se eliminan los puestos que
            siguen libres (los vendidos o pendientes se protegen).
          </p>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Imagen del sorteo
          </label>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            {preview ? (
              <img
                src={preview}
                alt="Imagen del sorteo"
                className="h-24 w-24 rounded-lg border border-gray-200 object-cover"
              />
            ) : (
              <div className="flex h-24 w-24 items-center justify-center rounded-lg border border-dashed border-gray-300 text-xs text-gray-400">
                Sin imagen
              </div>
            )}
            <input
              type="file"
              accept="image/*"
              onChange={handleImagenChange}
              className="block w-full text-sm text-gray-500 file:mr-3 file:rounded-lg file:border-0 file:bg-indigo-50 file:px-4 file:py-2 file:text-sm file:font-medium file:text-indigo-700 hover:file:bg-indigo-100"
            />
          </div>
          {nuevaImagen && (
            <p className="mt-1 text-xs text-green-600">
              ✅ Imagen nueva lista para subir: {nuevaImagen.name}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Button type="submit" loading={guardando} className="!w-auto">
            💾 Guardar Cambios
          </Button>
          <Button
            type="button"
            variant="ghost"
            className="!w-auto"
            onClick={() => navigate(`/gestionar-sorteo/${sorteo.id}`)}
          >
            Cancelar
          </Button>
        </div>
      </form>
    </div>
  );
}