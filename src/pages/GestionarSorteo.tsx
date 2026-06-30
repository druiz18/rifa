import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/useAuth";
import type { Database } from "../lib/database.types";
import Button from "../components/ui/Button";
import Modal from "../components/ui/Modal";

type Sorteo = Database["public"]["Tables"]["sorteos"]["Row"];
type Puesto = Database["public"]["Tables"]["puestos"]["Row"];

export default function GestionarSorteo() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [sorteo, setSorteo] = useState<Sorteo | null>(null);
  const [puestos, setPuestos] = useState<Puesto[]>([]);
  const [loading, setLoading] = useState(true);

  // Estados para el Modal de Gestión
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPuesto, setSelectedPuesto] = useState<Puesto | null>(null);
  const [loadingAction, setLoadingAction] = useState(false);

  useEffect(() => {
    if (!id) return;

    const fetchSorteoData = async () => {
      const { data: sorteoData } = await supabase
        .from("sorteos")
        .select("*")
        .eq("id", id)
        .single();
      setSorteo(sorteoData);

      const { data: puestosData } = await supabase
        .from("puestos")
        .select("*")
        .eq("sorteo_id", id)
        .order("numero", { ascending: true });
      setPuestos(puestosData || []);
      setLoading(false);
    };

    fetchSorteoData();
  }, [id]);

  // Funciones para cambiar el estado
  const handleMarcarPagado = async () => {
    if (!selectedPuesto) return;
    setLoadingAction(true);
    await supabase
      .from("puestos")
      .update({ estado: "vendido" })
      .eq("id", selectedPuesto.id);
    updateLocalState(selectedPuesto.id, "vendido");
    setLoadingAction(false);
  };

  const handleLiberar = async () => {
    if (!selectedPuesto) return;
    setLoadingAction(true);
    await supabase
      .from("puestos")
      .update({
        estado: "disponible",
        nombre_comprador: null,
        telefono: null,
        metodo_pago: null,
      })
      .eq("id", selectedPuesto.id);
    updateLocalState(selectedPuesto.id, "disponible");
    setLoadingAction(false);
  };

  const updateLocalState = (
    puestoId: string,
    nuevoEstado: Puesto["estado"],
  ) => {
    setPuestos((prev) =>
      prev.map((p) => (p.id === puestoId ? { ...p, estado: nuevoEstado } : p)),
    );
    setIsModalOpen(false);
    setSelectedPuesto(null);
  };

  const openModal = (puesto: Puesto) => {
    // Solo abrir modal si está pendiente o vendido (para ver quién fue)
    if (puesto.estado === "disponible") return;
    setSelectedPuesto(puesto);
    setIsModalOpen(true);
  };

  if (loading)
    return <div className="p-10 text-center">Cargando gestión...</div>;
  if (!sorteo)
    return <div className="p-10 text-center">Sorteo no encontrado</div>;

  // Seguridad básica: Si no es el dueño, echarlo
  if (sorteo.creador_id !== user?.id) {
    return (
      <div className="p-10 text-center text-red-500">
        No tienes permisos para gestionar este sorteo.
      </div>
    );
  }

  const getColorClasses = (estado: string) => {
    switch (estado) {
      case "disponible":
        return "bg-green-100 text-green-800 border-green-300";
      case "pendiente":
        return "bg-yellow-100 text-yellow-800 border-yellow-400 cursor-pointer hover:bg-yellow-200 hover:scale-105 animate-pulse"; // animate-pulse para llamar la atención
      case "vendido":
        return "bg-red-100 text-red-800 border-red-300 cursor-pointer hover:bg-red-200";
      default:
        return "bg-gray-100 text-gray-400 border-gray-200";
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Gestionando: {sorteo.titulo}</h1>
          <p className="text-gray-500 text-sm">
            Aquí puedes verificar pagos o liberar puestos.
          </p>
        </div>
        <Button
          variant="ghost"
          onClick={() => navigate("/dashboard")}
          className="w-auto! text-gray-600!"
        >
          ← Volver al Panel
        </Button>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-md">
        <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
          {puestos.map((puesto) => (
            <div
              key={puesto.id}
              className={`aspect-square flex items-center justify-center rounded-lg text-sm font-bold border-2 transition-all ${getColorClasses(puesto.estado)}`}
              onClick={() => openModal(puesto)}
            >
              {puesto.numero}
            </div>
          ))}
        </div>

        {/* Leyenda del Creador */}
        <div className="flex flex-wrap justify-center gap-6 mt-6 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-100 border-2 border-green-300 rounded"></div>{" "}
            Disponible
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-yellow-100 border-2 border-yellow-400 rounded animate-pulse"></div>{" "}
            Pendiente de Pago
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-100 border-2 border-red-300 rounded"></div>{" "}
            Pagado (Vendido)
          </div>
        </div>
      </div>

      {/* Modal de Gestión (Solo para el creador) */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={`Puesto #${selectedPuesto?.numero} - ${selectedPuesto?.estado?.toUpperCase()}`}
      >
        {selectedPuesto && (
          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg space-y-2 text-sm">
              <p>
                <span className="font-semibold">Nombre:</span>{" "}
                {selectedPuesto.nombre_comprador || "No proporcionado"}
              </p>
              <p>
                <span className="font-semibold">Teléfono:</span>{" "}
                {selectedPuesto.telefono || "No proporcionado"}
              </p>
              <p>
                <span className="font-semibold">Método de Pago:</span>{" "}
                {selectedPuesto.metodo_pago}
              </p>
            </div>

            {selectedPuesto.estado === "pendiente" && (
              <div className="flex gap-3 pt-2">
                <Button
                  onClick={handleMarcarPagado}
                  loading={loadingAction}
                  variant="primary"
                >
                  ✅ Confirmar Pagado
                </Button>
                <Button
                  onClick={handleLiberar}
                  loading={loadingAction}
                  variant="danger"
                >
                  ❌ Liberar Puesto
                </Button>
              </div>
            )}

            {selectedPuesto.estado === "vendido" && (
              <div className="pt-2">
                <Button
                  onClick={handleLiberar}
                  loading={loadingAction}
                  variant="danger"
                >
                  ❌ Devolver / Liberar Puesto
                </Button>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
