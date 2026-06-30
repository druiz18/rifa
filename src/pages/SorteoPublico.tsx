import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "../lib/supabase";
import type { Database } from "../lib/database.types";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import Select from "../components/ui/Select";
import Modal from "../components/ui/Modal"; // <- Importamos el Modal

type Sorteo = Database["public"]["Tables"]["sorteos"]["Row"];
type Puesto = Database["public"]["Tables"]["puestos"]["Row"];

export default function SorteoPublico() {
  const { id } = useParams<{ id: string }>();

  const [sorteo, setSorteo] = useState<Sorteo | null>(null);
  const [puestos, setPuestos] = useState<Puesto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // --- NUEVOS ESTADOS PARA EL MODAL ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPuesto, setSelectedPuesto] = useState<Puesto | null>(null);
  const [loadingReserva, setLoadingReserva] = useState(false);
  const [errorModal, setErrorModal] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    nombre_comprador: "",
    telefono: "",
    metodo_pago: "",
  });

  useEffect(() => {
    if (!id) return;

    const fetchSorteoData = async () => {
      const { data: sorteoData, error: sorteoError } = await supabase
        .from("sorteos")
        .select("*")
        .eq("id", id)
        .single();

      if (sorteoError) {
        setError("Este sorteo no existe o fue eliminado.");
        setLoading(false);
        return;
      }

      setSorteo(sorteoData);

      const { data: puestosData, error: puestosError } = await supabase
        .from("puestos")
        .select("*")
        .eq("sorteo_id", id)
        .order("numero", { ascending: true });

      if (puestosError) console.error(puestosError);
      else setPuestos(puestosData || []);

      setLoading(false);
    };

    fetchSorteoData();
  }, [id]);

  // --- LÓGICA DEL MODAL ---
  const handleOpenModal = (puesto: Puesto) => {
    if (puesto.estado !== "disponible") return;
    setSelectedPuesto(puesto);
    setErrorModal(null);
    setFormData({ nombre_comprador: "", telefono: "", metodo_pago: "" }); // Limpiar formulario
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedPuesto(null);
  };

  const handleReserva = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPuesto) return;

    // Validación rápida
    if (
      !formData.nombre_comprador ||
      !formData.telefono ||
      !formData.metodo_pago
    ) {
      setErrorModal("Todos los campos son obligatorios");
      return;
    }

    setLoadingReserva(true);
    setErrorModal(null);

    // Hacemos el UPDATE a Supabase
    const { error: updateError } = await supabase
      .from("puestos")
      .update({
        estado: "pendiente",
        nombre_comprador: formData.nombre_comprador,
        telefono: formData.telefono,
        metodo_pago: formData.metodo_pago,
      })
      .eq("id", selectedPuesto.id)
      .eq("estado", "disponible"); // Doble seguridad: solo si sigue disponible

    setLoadingReserva(false);

    if (updateError) {
      setErrorModal(
        "Alguien más tomó este puesto justo ahora. Recarga la página.",
      );
    } else {
      // ¡ÉXITO! Actualizamos la UI local inmediatamente para que se ponga gris sin recargar
      setPuestos((prev) =>
        prev.map((p) =>
          p.id === selectedPuesto.id
            ? { ...p, estado: "pendiente" as const }
            : p,
        ),
      );
      handleCloseModal(); // Cerramos el modal
      alert(
        `¡Puesto ${selectedPuesto.numero} reservado con éxito! El creador verificará tu pago.`,
      );
    }
  };

  const formatoMoneda = new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
  }).format(sorteo?.precio || 0);

  if (loading)
    return (
      <div className="p-10 text-center text-gray-500">Cargando sorteo...</div>
    );
  if (error)
    return (
      <div className="max-w-lg mx-auto mt-20 p-8 bg-white rounded-lg shadow text-center">
        <p className="text-red-500 font-semibold mb-4">{error}</p>
        <Link to="/">
          <Button variant="ghost" className="!w-auto !mx-auto">
            Volver al inicio
          </Button>
        </Link>
      </div>
    );
  if (!sorteo) return null;

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6">
      {/* Cabecera del Sorteo */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden mb-8">
        <div className="md:flex">
          <div className="md:w-1/3 h-64 md:h-auto bg-gray-200">
            <img
              src={sorteo.imagen ?? undefined}
              alt={sorteo.titulo}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="p-6 md:w-2/3 flex flex-col justify-center">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
              {sorteo.titulo}
            </h1>
            <p className="text-indigo-600 text-lg font-semibold mb-4">
              🎉 Premio: {sorteo.titulo_premio}
            </p>
            {sorteo.descripcion_premio && (
              <p className="text-gray-600 text-sm mb-4">
                {sorteo.descripcion_premio}
              </p>
            )}

            <div className="flex flex-wrap gap-4 mt-2 text-sm text-gray-500">
              <span className="font-semibold text-gray-800 text-lg">
                {formatoMoneda} <span className="text-xs font-normal">c/u</span>
              </span>
              <span>•</span>
              <span>
                Fecha:{" "}
                {sorteo.fecha_sorteo
                  ? new Date(sorteo.fecha_sorteo).toLocaleDateString("es-ES", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })
                  : "Fecha no disponible"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Tablero de Puestos */}
      <div className="bg-white p-6 rounded-xl shadow-md">
        <h2 className="text-xl font-bold text-gray-800 mb-4 text-center">
          Selecciona tu número
        </h2>

        <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
          {puestos.map((puesto) => {
            const estaDisponible = puesto.estado === "disponible";

            return (
              <div
                key={puesto.id}
                className={`
                  aspect-square flex items-center justify-center rounded-lg text-sm font-bold border-2 transition-all
                  ${
                    estaDisponible
                      ? "bg-green-100 text-green-800 border-green-300 hover:bg-green-200 hover:scale-105 cursor-pointer"
                      : "bg-gray-200 text-gray-400 border-gray-200 cursor-not-allowed line-through"
                  }
                `}
                // AQUÍ CONECTAMOS EL MODAL
                onClick={() => handleOpenModal(puesto)}
              >
                {puesto.numero}
              </div>
            );
          })}
        </div>

        <div className="flex justify-center gap-6 mt-6 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-100 border-2 border-green-300 rounded"></div>
            <span>Disponible</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-gray-200 border-2 border-gray-200 rounded"></div>
            <span>Ocupado / Pendiente</span>
          </div>
        </div>
      </div>

      {/* --- EL MODAL DE RESERVA --- */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={`Reservar Puesto #${selectedPuesto?.numero || ""}`}
      >
        <p className="text-gray-600 mb-4 text-sm">
          Completa tus datos. El creador verificará tu pago de {formatoMoneda}{" "}
          para confirmar tu número.
        </p>

        {errorModal && (
          <div className="bg-red-100 text-red-700 p-3 rounded mb-4 text-sm">
            {errorModal}
          </div>
        )}

        <form onSubmit={handleReserva} className="space-y-4">
          <Input
            id="modal-nombre"
            label="Tu Nombre completo"
            placeholder="Juan Pérez"
            value={formData.nombre_comprador}
            onChange={(e) =>
              setFormData({ ...formData, nombre_comprador: e.target.value })
            }
          />
          <Input
            id="modal-tel"
            label="Tu Teléfono (WhatsApp)"
            placeholder="555 123 4567"
            value={formData.telefono}
            onChange={(e) =>
              setFormData({ ...formData, telefono: e.target.value })
            }
          />
          <Select
            id="modal-pago"
            label="¿Cómo vas a pagar?"
            options={[
              { value: "efectivo", label: "Efectivo" },
              { value: "transferencia", label: "Transferencia Bancaria" },
            ]}
            value={formData.metodo_pago}
            onChange={(e) =>
              setFormData({ ...formData, metodo_pago: e.target.value })
            }
          />

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={handleCloseModal}
              className="!w-auto"
            >
              Cancelar
            </Button>
            <Button type="submit" loading={loadingReserva}>
              {loadingReserva ? "Reservando..." : "Confirmar Reserva"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
