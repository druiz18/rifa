import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "../lib/supabase";
import type { Database } from "../lib/database.types";
import { useAuth } from "../context/useAuth"
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import Modal from "../components/ui/Modal";
import InfoPago from "../components/sorteo/InfoPago";

type Sorteo = Database["public"]["Tables"]["sorteos"]["Row"];
type Puesto = Database["public"]["Tables"]["puestos"]["Row"];

const formatoPrecio = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  maximumFractionDigits: 0,
});

const formatoFecha = new Intl.DateTimeFormat("es-CO", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

type EstadoVista = "ok" | "no-encontrado" | "sin-permiso";

export default function GestionarSorteo() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  // ── Datos ───────────────────────────────────────────────────────
  const [sorteo, setSorteo] = useState<Sorteo | null>(null);
  const [puestos, setPuestos] = useState<Puesto[]>([]);
  const [cargando, setCargando] = useState(true);
  const [estadoVista, setEstadoVista] = useState<EstadoVista>("ok");

  // ── Modal de gestión de un puesto ───────────────────────────────
  const [puestoDetalle, setPuestoDetalle] = useState<Puesto | null>(null);
  const [relacionados, setRelacionados] = useState<Puesto[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [actualizando, setActualizando] = useState(false);

  // ── Modal de finalización ───────────────────────────────────────
  const [modalFinalizarOpen, setModalFinalizarOpen] = useState(false);
  const [numeroGanador, setNumeroGanador] = useState("");
  const [finalizando, setFinalizando] = useState(false);

  const [error, setError] = useState("");

  // ═══ Carga de datos ═════════════════════════════════════════════
  const fetchSorteoData = async () => {
    if (!id || !user) return;

    const { data: sorteoData, error: sorteoError } = await supabase
      .from("sorteos")
      .select("*")
      .eq("id", id)
      .single();

    if (sorteoError || !sorteoData) {
      setEstadoVista("no-encontrado");
      setCargando(false);
      return;
    }

    // Solo el creador puede gestionar el sorteo
    if (sorteoData.creador_id !== user.id) {
      setEstadoVista("sin-permiso");
      setCargando(false);
      return;
    }

    const { data: puestosData, error: puestosError } = await supabase
      .from("puestos")
      .select("*")
      .eq("sorteo_id", id)
      .order("numero", { ascending: true });

    if (puestosError) console.error("Error al cargar los puestos:", puestosError);

    setSorteo(sorteoData);
    setPuestos(puestosData || []);
    setCargando(false);
  };

  useEffect(() => {
    void Promise.resolve().then(fetchSorteoData);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, user]);

  // ═══ Handlers ═══════════════════════════════════════════════════
  const abrirModalGestion = async (puesto: Puesto) => {
    setPuestoDetalle(puesto);
    setRelacionados([puesto]);
    setError("");
    setModalOpen(true);

    // Puestos del mismo grupo (selección múltiple)
    const { data } = await supabase
      .from("puestos")
      .select("*")
      .eq("grupo_id", puesto.grupo_id)
      .order("numero", { ascending: true });
    if (data) setRelacionados(data);
  };

  const confirmarPago = async () => {
    if (!puestoDetalle) return;
    setActualizando(true);
    setError("");

    // Confirma TODOS los puestos del mismo grupo
    const { error: updateError } = await supabase
      .from("puestos")
      .update({ estado: "vendido", updated_at: new Date().toISOString() })
      .eq("grupo_id", puestoDetalle.grupo_id);

    if (updateError) {
      setError("No se pudo confirmar el pago: " + updateError.message);
    } else {
      setModalOpen(false);
      await fetchSorteoData();
    }
    setActualizando(false);
  };

  const liberarPuesto = async () => {
    if (!puestoDetalle) return;
    setActualizando(true);
    setError("");

    // Libera TODOS los puestos del mismo grupo y limpia datos del comprador
    const { error: updateError } = await supabase
      .from("puestos")
      .update({
        estado: "disponible",
        nombre_comprador: null,
        telefono: null,
        metodo_pago: null,
        updated_at: new Date().toISOString(),
      })
      .eq("grupo_id", puestoDetalle.grupo_id);

    if (updateError) {
      setError("No se pudo liberar el puesto: " + updateError.message);
    } else {
      setModalOpen(false);
      await fetchSorteoData();
    }
    setActualizando(false);
  };

  const abrirModalFinalizar = () => {
    setNumeroGanador("");
    setError("");
    setModalFinalizarOpen(true);
  };

  const finalizarSorteo = async (e: FormEvent) => {
    e.preventDefault();
    if (!sorteo) return;
    setError("");

    const num = parseInt(numeroGanador, 10);
    if (isNaN(num) || num < 1 || num > sorteo.total_puestos) {
      return setError(
        `El número ganador debe estar entre 1 y ${sorteo.total_puestos}.`
      );
    }

    setFinalizando(true);
    const { error: updateError } = await supabase
      .from("sorteos")
      .update({ estado: "finalizado", numero_ganador: num })
      .eq("id", sorteo.id);

    if (updateError) {
      setError("No se pudo finalizar el sorteo: " + updateError.message);
    } else {
      setModalFinalizarOpen(false);
      await fetchSorteoData();
    }
    setFinalizando(false);
  };

  // ═══ Guards de render ═══════════════════════════════════════════
  if (cargando) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-gray-500">Cargando gestión...</p>
      </div>
    );
  }

  if (estadoVista === "no-encontrado") {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4 text-center">
        <p className="text-5xl">🔍</p>
        <h1 className="text-2xl font-bold text-gray-900">Sorteo no encontrado</h1>
        <Button className="!w-auto" onClick={() => navigate("/dashboard")}>
          Volver al panel
        </Button>
      </div>
    );
  }

  if (estadoVista === "sin-permiso") {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4 text-center">
        <p className="text-5xl">🚫</p>
        <h1 className="text-2xl font-bold text-gray-900">Sin permiso</h1>
        <p className="text-gray-500">Solo el creador del sorteo puede gestionarlo.</p>
        <Button className="!w-auto" onClick={() => navigate("/dashboard")}>
          Volver al panel
        </Button>
      </div>
    );
  }

  if (!sorteo) return null;

  // ═══ Derivados ══════════════════════════════════════════════════
  const vendidos = puestos.filter((p) => p.estado === "vendido").length;
  const pendientes = puestos.filter((p) => p.estado === "pendiente").length;
  const disponibles = puestos.filter((p) => p.estado === "disponible").length;
  const recaudado = vendidos * Number(sorteo.precio);
  const porConfirmar = pendientes * Number(sorteo.precio);

  const esGanador = (puesto: Puesto) =>
    sorteo.estado === "finalizado" &&
    sorteo.numero_ganador !== null &&
    puesto.numero === sorteo.numero_ganador;

  // ═══ Render ═════════════════════════════════════════════════════
  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      {/* Encabezado */}
      <button
        onClick={() => navigate("/dashboard")}
        className="mb-4 text-sm font-medium text-gray-500 hover:text-gray-700"
      >
        ← Volver al panel
      </button>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-3xl font-bold text-gray-900">{sorteo.titulo}</h1>
          <p className="mt-1 text-sm text-gray-500">
            {sorteo.fecha_sorteo
              ? `Sorteo: ${formatoFecha.format(new Date(sorteo.fecha_sorteo))}`
              : "Fecha por definir"}{" "}
            · {formatoPrecio.format(Number(sorteo.precio))} por puesto
          </p>
        </div>
        {sorteo.estado === "activo" && (
          <button
            onClick={() => navigate(`/editar-sorteo/${sorteo.id}`)}
            className="shrink-0 rounded-lg border border-indigo-200 bg-indigo-50 px-4 py-2 text-sm font-medium text-indigo-700 transition hover:bg-indigo-100"
          >
            ✏️ Editar Sorteo
          </button>
        )}
      </div>

      {/* Banner de estado / acción principal */}
      {sorteo.estado === "activo" && (
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-yellow-200 bg-yellow-50 p-4">
          <p className="text-sm text-yellow-800">
            ⏳ Tienes <strong>{pendientes}</strong> puesto(s) pendiente(s) de verificar.
          </p>
          <Button variant="danger" className="!w-auto" onClick={abrirModalFinalizar}>
            🏁 Finalizar sorteo
          </Button>
        </div>
      )}

      {sorteo.estado === "finalizado" && (
        <div className="mt-6 rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-800">
          ✓ Sorteo finalizado
          {sorteo.numero_ganador ? ` · Puesto ganador: #${sorteo.numero_ganador}` : ""}.
          Ya no se pueden confirmar ni liberar puestos.
        </div>
      )}

      {sorteo.estado === "cancelado" && (
        <div className="mt-6 rounded-lg border border-gray-300 bg-gray-50 p-4 text-sm text-gray-700">
          Este sorteo fue cancelado.
        </div>
      )}

      {/* Contadores */}
      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-lg border border-gray-200 bg-white p-4 text-center">
          <p className="text-2xl font-bold text-gray-900">{puestos.length}</p>
          <p className="text-xs text-gray-500">Total</p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4 text-center">
          <p className="text-2xl font-bold text-green-600">{vendidos}</p>
          <p className="text-xs text-gray-500">Vendidos</p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4 text-center">
          <p className="text-2xl font-bold text-yellow-600">{pendientes}</p>
          <p className="text-xs text-gray-500">Pendientes</p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4 text-center">
          <p className="text-2xl font-bold text-gray-400">{disponibles}</p>
          <p className="text-xs text-gray-500">Disponibles</p>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-sm text-gray-600">
        <span>
          💰 Recaudado:{" "}
          <strong className="text-gray-900">{formatoPrecio.format(recaudado)}</strong>
        </span>
        <span>
          ⏳ Por confirmar:{" "}
          <strong className="text-gray-900">{formatoPrecio.format(porConfirmar)}</strong>
        </span>
      </div>

      {/* Datos de pago que ven los compradores */}
      <div className="mt-6 rounded-xl border border-gray-200 bg-white p-4">
        <p className="mb-2 text-sm font-semibold text-gray-800">
          💳 Datos de pago que ven los compradores
        </p>
        <InfoPago sorteo={sorteo} compacto />
      </div>

      {/* Cuadrícula */}
      <div className="mt-8">
        <div className="flex items-baseline justify-between gap-4">
          <h2 className="text-xl font-bold text-gray-900">Cuadrícula de puestos</h2>
          <p className="text-xs text-gray-500">
            Toca un puesto amarillo o rojo para gestionar el pago
          </p>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {puestos.map((puesto) => {
            const ganador = esGanador(puesto);
            const base =
              "h-11 w-11 rounded-lg border text-sm font-medium transition";

            const clase = ganador
              ? `${base} z-10 scale-110 border-amber-400 bg-amber-400 font-bold text-amber-900 shadow ring-2 ring-amber-300`
              : puesto.estado === "disponible"
                ? `${base} border-green-300 bg-green-100 text-green-800`
                : puesto.estado === "pendiente"
                  ? `${base} cursor-pointer border-yellow-400 bg-yellow-100 text-yellow-800 animate-pulse hover:bg-yellow-200`
                  : `${base} cursor-pointer border-red-300 bg-red-500 text-white hover:bg-red-600`;

            return (
              <button
                key={puesto.id}
                onClick={() =>
                  puesto.estado === "disponible"
                    ? undefined
                    : abrirModalGestion(puesto)
                }
                disabled={puesto.estado === "disponible"}
                className={clase}
                title={
                  ganador
                    ? `⭐ Puesto ganador · ${puesto.estado}`
                    : puesto.estado === "disponible"
                      ? "Disponible"
                      : puesto.estado === "pendiente"
                        ? "Pendiente de pago · gestionar"
                        : "Vendido · gestionar"
                }
              >
                {ganador ? `⭐${puesto.numero}` : puesto.numero}
              </button>
            );
          })}
        </div>

        {/* Leyenda */}
        <div className="mt-4 flex flex-wrap gap-4 text-xs text-gray-500">
          <span className="flex items-center gap-1">
            <span className="h-4 w-4 rounded border border-green-300 bg-green-100" />
            Disponible
          </span>
          <span className="flex items-center gap-1">
            <span className="h-4 w-4 rounded border border-yellow-400 bg-yellow-100" />
            Pendiente (toca para verificar)
          </span>
          <span className="flex items-center gap-1">
            <span className="h-4 w-4 rounded bg-red-500" />
            Vendido
          </span>
          {sorteo.estado === "finalizado" && (
            <span className="flex items-center gap-1">
              <span className="h-4 w-4 rounded bg-amber-400" />
              Ganador
            </span>
          )}
        </div>
      </div>

      {/* ═══ Modal de gestión de puesto ═══ */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Gestión de puesto"
      >
        {puestoDetalle && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">
                Puesto #{puestoDetalle.numero}
              </h2>
              <span
                className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${
                  puestoDetalle.estado === "vendido"
                    ? "bg-red-100 text-red-700"
                    : "bg-yellow-100 text-yellow-700"
                }`}
              >
                {puestoDetalle.estado}
              </span>
            </div>

            {/* Selección múltiple */}
            {relacionados.length > 1 && (
              <div className="rounded-lg border border-indigo-200 bg-indigo-50 p-3">
                <p className="text-sm font-semibold text-indigo-900">
                  🔢 Selección múltiple · {relacionados.length} puestos
                </p>
                <p className="mt-1 font-mono text-sm text-indigo-700">
                  {relacionados.map((p) => p.numero).join(", ")}
                </p>
                <p className="mt-1 text-xs text-indigo-600">
                  Confirmar o liberar se aplica a los {relacionados.length} puestos de
                  esta compra.
                </p>
              </div>
            )}

            {/* Datos del comprador */}
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
              <p className="text-sm">
                <span className="text-gray-500">Comprador:</span>{" "}
                <strong className="text-gray-900">
                  {puestoDetalle.nombre_comprador || "—"}
                </strong>
              </p>
              <p className="mt-1 text-sm">
                <span className="text-gray-500">Teléfono:</span>{" "}
                <strong className="text-gray-900">
                  {puestoDetalle.telefono || "—"}
                </strong>
              </p>
              <p className="mt-1 text-sm">
                <span className="text-gray-500">Método de pago:</span>{" "}
                <strong className="text-gray-900 capitalize">
                  {puestoDetalle.metodo_pago || "—"}
                </strong>
              </p>
            </div>

            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                {error}
              </div>
            )}

            {/* Acciones */}
            {sorteo.estado === "activo" ? (
              <div className="flex flex-col gap-3 sm:flex-row">
                {puestoDetalle.estado === "pendiente" && (
                  <Button
                    onClick={confirmarPago}
                    loading={actualizando}
                    className="!w-auto"
                  >
                    ✅ Confirmar Pagado
                  </Button>
                )}
                <Button
                  variant="danger"
                  onClick={liberarPuesto}
                  loading={actualizando}
                  className="!w-auto"
                >
                  ❌{" "}
                  {puestoDetalle.estado === "vendido"
                    ? "Revertir venta"
                    : "Liberar puesto"}
                </Button>
                <Button
                  variant="ghost"
                  className="!w-auto"
                  onClick={() => setModalOpen(false)}
                >
                  Cerrar
                </Button>
              </div>
            ) : (
              <p className="text-sm text-gray-500">
                El sorteo está {sorteo.estado}; los puestos ya no pueden modificarse.
              </p>
            )}
          </div>
        )}
      </Modal>

      {/* ═══ Modal de finalización ═══ */}
      <Modal
        isOpen={modalFinalizarOpen}
        onClose={() => setModalFinalizarOpen(false)}
        title="Finalizar sorteo"
      >
        <form onSubmit={finalizarSorteo} className="space-y-4">
          <h2 className="text-xl font-bold text-gray-900">🏁 Finalizar sorteo</h2>
          <p className="text-sm text-gray-600">
            Indica el número del puesto ganador (entre 1 y {sorteo.total_puestos}).
            Esta acción no se puede deshacer.
          </p>

          <Input
            label={`Número ganador (1 - ${sorteo.total_puestos})`}
            type="number"
            min={1}
            max={sorteo.total_puestos}
            value={numeroGanador}
            onChange={(e) => setNumeroGanador(e.target.value)}
            placeholder="Ej. 42"
          />

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="flex flex-col gap-3 sm:flex-row">
            <Button type="submit" loading={finalizando} className="!w-auto">
              ✅ Finalizar y declarar ganador
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="!w-auto"
              onClick={() => setModalFinalizarOpen(false)}
            >
              Cancelar
            </Button>
          </div>

          <p className="text-xs text-gray-500">
            Al finalizar, los compradores verán el resultado al abrir el enlace del
            sorteo.
          </p>
        </form>
      </Modal>
    </div>
  );
}