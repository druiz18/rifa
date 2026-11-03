import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "../lib/supabase";
import type { Database } from "../lib/database.types";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import Select from "../components/ui/Select";
import Modal from "../components/ui/Modal";
import InfoPago from "../components/sorteo/InfoPago";

type Sorteo = Database["public"]["Tables"]["sorteos"]["Row"];
type Puesto = Database["public"]["Tables"]["puestos"]["Row"];

// Lo que devuelve la función RPC reservar_puestos
type ResultadoReserva = {
  ok: boolean;
  error?: string;
  grupo_id?: string;
  cantidad?: number;
};

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

export default function SorteoPublico() {
  const { id } = useParams<{ id: string }>();

  // ── Datos del sorteo ────────────────────────────────────────────
  const [sorteo, setSorteo] = useState<Sorteo | null>(null);
  const [puestos, setPuestos] = useState<Puesto[]>([]);
  const [cargando, setCargando] = useState(true);
  const [noEncontrado, setNoEncontrado] = useState(false);

  // ── Selección múltiple ──────────────────────────────────────────
  const [seleccionados, setSeleccionados] = useState<Puesto[]>([]);
  const [exito, setExito] = useState("");

  // ── Modal de reserva ────────────────────────────────────────────
  const [modalOpen, setModalOpen] = useState(false);
  const [nombre, setNombre] = useState("");
  const [telefono, setTelefono] = useState("");
  const [metodoPago, setMetodoPago] = useState("efectivo");
  const [reservando, setReservando] = useState(false);
  const [error, setError] = useState("");

  // ── Modal del ganador ───────────────────────────────────────────
  const [ganadorDismissedFor, setGanadorDismissedFor] = useState<string | null>(null);

  // ── Compartir ───────────────────────────────────────────────────
  const [copiado, setCopiado] = useState(false);

  // ═══ Carga de datos ═════════════════════════════════════════════
  const fetchSorteoData = async () => {
    if (!id) return;

    const { data: sorteoData, error: sorteoError } = await supabase
      .from("sorteos")
      .select("*")
      .eq("id", id)
      .single();

    if (sorteoError || !sorteoData) {
      console.error("Error al cargar el sorteo:", sorteoError);
      setNoEncontrado(true);
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

    // Si algún puesto de la selección ya no está disponible, lo quitamos
    setSeleccionados((prev) =>
      prev.filter((sel) =>
        (puestosData || []).some((p) => p.id === sel.id && p.estado === "disponible")
      )
    );

    setCargando(false);
  };

  useEffect(() => {
    void Promise.resolve().then(fetchSorteoData);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Título de la pestaña
  useEffect(() => {
    if (sorteo) document.title = sorteo.titulo;
  }, [sorteo]);

  // ═══ Derivados ══════════════════════════════════════════════════
  const vendidos = puestos.filter((p) => p.estado === "vendido").length;
  const pendientes = puestos.filter((p) => p.estado === "pendiente").length;
  const disponibles = puestos.filter((p) => p.estado === "disponible").length;
  const ocupados = vendidos + pendientes;
  const porcentaje =
    puestos.length > 0 ? Math.round((ocupados / puestos.length) * 100) : 0;
  const totalSeleccion =
    seleccionados.length * Number(sorteo?.precio ?? 0);
  const modalGanadorOpen = Boolean(
    sorteo &&
      sorteo.estado === "finalizado" &&
      sorteo.numero_ganador &&
      ganadorDismissedFor !== sorteo.id
  );

  // ═══ Handlers ═══════════════════════════════════════════════════
  const togglePuesto = (puesto: Puesto) => {
    setExito("");
    setSeleccionados((prev) => {
      if (prev.some((p) => p.id === puesto.id)) {
        return prev.filter((p) => p.id !== puesto.id);
      }
      return [...prev, puesto].sort((a, b) => a.numero - b.numero);
    });
  };

  const abrirModalReserva = () => {
    if (seleccionados.length === 0) return;
    setError("");
    setNombre("");
    setTelefono("");
    setMetodoPago("efectivo");
    setModalOpen(true);
  };

  const handleReservar = async (e: FormEvent) => {
    e.preventDefault();
    setError("");

    if (seleccionados.length === 0) return setError("Selecciona al menos un puesto.");
    if (!nombre.trim()) return setError("Escribe tu nombre.");
    if (!telefono.trim()) return setError("Escribe tu teléfono.");
    if (!metodoPago) return setError("Elige un método de pago.");

    setReservando(true);

    const { data, error: rpcError } = await supabase.rpc("reservar_puestos", {
      p_puesto_ids: seleccionados.map((p) => p.id),
      p_nombre: nombre.trim(),
      p_telefono: telefono.trim(),
      p_metodo_pago: metodoPago,
    });

    if (rpcError) {
      setError("No se pudo completar la reserva: " + rpcError.message);
    } else {
      const res = data as unknown as ResultadoReserva;
      if (res.ok) {
        setModalOpen(false);
        setSeleccionados([]);
        setExito(
          `¡Reserva exitosa! ${res.cantidad} ${
            res.cantidad === 1 ? "puesto" : "puestos"
          } en espera de confirmación de pago.`
        );
      } else {
        setError(res.error || "No se pudo completar la reserva.");
        setSeleccionados([]);
      }
      await fetchSorteoData();
    }

    setReservando(false);
  };

  const compartir = async () => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/sorteo/${id}`);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      // El navegador no permitió copiar: el usuario puede copiar la URL a mano
    }
  };

  // ═══ Guards de render ═══════════════════════════════════════════
  if (cargando) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-gray-500">Cargando sorteo...</p>
      </div>
    );
  }

  if (noEncontrado || !sorteo) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4 text-center">
        <p className="text-5xl">🔍</p>
        <h1 className="text-2xl font-bold text-gray-900">Sorteo no encontrado</h1>
        <p className="text-gray-500">
          El enlace no es válido o el sorteo fue eliminado.
        </p>
      </div>
    );
  }

  const sorteoActivo = sorteo.estado === "activo";

  // ═══ Render ═════════════════════════════════════════════════════
  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      {/* ── Banner de estado ── */}
      {sorteo.estado === "finalizado" && (
        <div className="mb-6 rounded-lg border border-gray-300 bg-gray-50 p-4 text-sm text-gray-700">
          ✓ Este sorteo ya finalizó
          {sorteo.numero_ganador ? ` · Puesto ganador: #${sorteo.numero_ganador}` : ""}.
          Ya no se aceptan reservas.
        </div>
      )}
      {sorteo.estado === "cancelado" && (
        <div className="mb-6 rounded-lg border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-800">
          ⚠️ Este sorteo fue cancelado por el creador.
        </div>
      )}

      {/* ── Encabezado: imagen + datos ── */}
      <div className="grid gap-6 md:grid-cols-2">
        {sorteo.imagen ? (
          <img
            src={sorteo.imagen}
            alt={sorteo.titulo}
            className="w-full rounded-xl border border-gray-200 object-cover shadow-sm"
          />
        ) : (
          <div className="flex h-64 items-center justify-center rounded-xl border border-dashed border-gray-300 bg-gray-50 text-sm text-gray-400">
            Sin imagen
          </div>
        )}

        <div>
          <h1 className="text-3xl font-bold text-gray-900">{sorteo.titulo}</h1>
          {sorteo.descripcion && (
            <p className="mt-2 text-gray-600">{sorteo.descripcion}</p>
          )}

          {/* Premio */}
          <div className="mt-4 rounded-xl border border-indigo-100 bg-indigo-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-indigo-500">
              🏆 Premio
            </p>
            <p className="text-lg font-bold text-indigo-900">{sorteo.titulo_premio}</p>
            {sorteo.descripcion_premio && (
              <p className="mt-1 text-sm text-indigo-700">{sorteo.descripcion_premio}</p>
            )}
          </div>

          {/* Datos clave */}
          <dl className="mt-4 space-y-3 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-gray-500">Fecha del sorteo</dt>
              <dd className="text-right font-medium text-gray-900">
                {sorteo.fecha_sorteo
                  ? formatoFecha.format(new Date(sorteo.fecha_sorteo))
                  : "Por definir"}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-gray-500">Precio por puesto</dt>
              <dd className="font-medium text-gray-900">
                {formatoPrecio.format(Number(sorteo.precio))}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-gray-500">Puestos totales</dt>
              <dd className="font-medium text-gray-900">{sorteo.total_puestos}</dd>
            </div>
          </dl>

          {/* Progreso de ventas */}
          <div className="mt-4">
            <div className="flex justify-between text-xs text-gray-500">
              <span>
                {ocupados} de {puestos.length} puestos ocupados
              </span>
              <span>{porcentaje}%</span>
            </div>
            <div className="mt-1 h-2 overflow-hidden rounded-full bg-gray-200">
              <div
                className="h-full rounded-full bg-indigo-600 transition-all"
                style={{ width: `${porcentaje}%` }}
              />
            </div>
            <p className="mt-1 text-xs text-gray-400">
              {disponibles} disponibles · {vendidos} vendidos · {pendientes} en proceso
            </p>
          </div>

          <Button variant="ghost" className="mt-4 !w-auto" onClick={compartir}>
            {copiado ? "✅ Enlace copiado" : "🔗 Copiar enlace para compartir"}
          </Button>
        </div>
      </div>

      {/* ── Cómo pagar ── */}
      <div className="mt-8">
        <InfoPago sorteo={sorteo} />
      </div>

      {/* ── Cuadrícula de puestos ── */}
      <div className="mt-8">
        <div className="flex items-baseline justify-between gap-4">
          <h2 className="text-xl font-bold text-gray-900">Elige tus puestos</h2>
          <p className="text-xs text-gray-500">
            {sorteoActivo
              ? "Toca los números que quieras reservar (puedes elegir varios)"
              : "Las reservas están cerradas"}
          </p>
        </div>

        {exito && (
          <div className="mt-4 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-800">
            ✅ {exito}
          </div>
        )}

        <div className="mt-4 flex flex-wrap gap-2">
          {puestos.map((puesto) => {
            const esSeleccionado = seleccionados.some((p) => p.id === puesto.id);
            const noDisponible = puesto.estado !== "disponible";

            return (
              <button
                key={puesto.id}
                onClick={() => togglePuesto(puesto)}
                disabled={noDisponible || !sorteoActivo}
                className={`h-11 w-11 rounded-lg border text-sm font-medium transition ${
                  noDisponible
                    ? puesto.estado === "vendido"
                      ? "cursor-not-allowed border-gray-700 bg-gray-700 text-gray-200"
                      : "cursor-not-allowed border-gray-200 bg-gray-200 text-gray-400"
                    : esSeleccionado
                      ? "z-10 scale-110 border-indigo-700 bg-indigo-600 font-bold text-white shadow"
                      : "border-gray-300 bg-white text-gray-800 hover:bg-indigo-50"
                }`}
                title={
                  noDisponible
                    ? "No disponible"
                    : esSeleccionado
                      ? "Quitar de la selección"
                      : "Agregar a la selección"
                }
              >
                {puesto.numero}
              </button>
            );
          })}
        </div>

        {/* Leyenda */}
        <div className="mt-4 flex flex-wrap gap-4 text-xs text-gray-500">
          <span className="flex items-center gap-1">
            <span className="h-4 w-4 rounded border border-gray-300 bg-white" />
            Disponible
          </span>
          <span className="flex items-center gap-1">
            <span className="h-4 w-4 rounded bg-indigo-600" />
            Tu selección
          </span>
          <span className="flex items-center gap-1">
            <span className="h-4 w-4 rounded bg-gray-200" />
            En proceso
          </span>
          <span className="flex items-center gap-1">
            <span className="h-4 w-4 rounded bg-gray-700" />
            Vendido
          </span>
        </div>

        {/* ── Barra de selección (sticky) ── */}
        {sorteoActivo && seleccionados.length > 0 && (
          <div className="sticky bottom-4 z-20 mt-6 flex flex-col gap-3 rounded-xl border border-indigo-200 bg-white p-4 shadow-lg sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-gray-900">
                {seleccionados.length === 1
                  ? "1 puesto seleccionado"
                  : `${seleccionados.length} puestos seleccionados`}
              </p>
              <p className="truncate font-mono text-sm text-indigo-700">
                {seleccionados.map((p) => p.numero).join(" · ")}
              </p>
              <p className="text-xs text-gray-500">
                Total: {formatoPrecio.format(totalSeleccion)}
              </p>
            </div>
            <div className="flex shrink-0 gap-2">
              <Button
                variant="ghost"
                className="!w-auto"
                onClick={() => setSeleccionados([])}
              >
                Limpiar
              </Button>
              <Button className="!w-auto" onClick={abrirModalReserva}>
                Reservar {seleccionados.length > 1
                  ? `${seleccionados.length} puestos`
                  : "puesto"}
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* ═══ Modal de reserva ═══ */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Reservar puestos"
      >
        <form onSubmit={handleReservar} className="space-y-4">
          <h2 className="text-xl font-bold text-gray-900">
            Reservar {seleccionados.length}{" "}
            {seleccionados.length === 1 ? "puesto" : "puestos"}
          </h2>

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {seleccionados.length > 1 && (
            <div className="rounded-lg border border-indigo-100 bg-indigo-50 p-3">
              <p className="text-sm font-medium text-indigo-900">
                🔢 Estás reservando estos puestos juntos:
              </p>
              <p className="mt-1 font-mono text-sm text-indigo-700">
                {seleccionados.map((p) => p.numero).join(", ")}
              </p>
              <p className="mt-1 text-xs text-indigo-600">
                Se registran como una sola compra: el creador confirmará el pago de
                toda la selección.
              </p>
            </div>
          )}

          <Input
            label="Tu nombre"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Ej. Juan Pérez"
          />

          <Input
            label="Tu teléfono"
            value={telefono}
            onChange={(e) => setTelefono(e.target.value)}
            placeholder="Ej. 3001234567"
            inputMode="tel"
          />

          <Select
            label="Método de pago"
            value={metodoPago}
            onChange={(e) => setMetodoPago(e.target.value)}
            options={[
              { value: "efectivo", label: "Efectivo" },
              { value: "transferencia", label: "Transferencia" },
            ]}
          />

          {metodoPago === "transferencia" && (
            <div className="rounded-lg border border-indigo-100 bg-indigo-50 p-3">
              <p className="mb-1 text-sm font-medium text-indigo-900">
                💸 Envía tu pago a:
              </p>
              <InfoPago sorteo={sorteo} compacto />
            </div>
          )}

          <p className="text-sm text-gray-600">
            Total a pagar:{" "}
            <span className="font-bold text-gray-900">
              {formatoPrecio.format(totalSeleccion)}
            </span>
          </p>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Button type="submit" loading={reservando} className="!w-auto">
              Confirmar reserva
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="!w-auto"
              onClick={() => setModalOpen(false)}
            >
              Cancelar
            </Button>
          </div>

          <p className="text-xs text-gray-500">
            Al confirmar, tus puestos quedan reservados hasta que el creador verifique
            el pago. No necesitas crear una cuenta.
          </p>
        </form>
      </Modal>

      {/* ═══ Modal del ganador ═══ */}
      <Modal
        isOpen={modalGanadorOpen}
        onClose={() => setGanadorDismissedFor(sorteo.id)}
        title="Ganador"
      >
        <div className="text-center">
          <h2 className="text-xl font-bold text-gray-900">🏁 ¡Tenemos ganador!</h2>
          <p className="mt-1 text-sm text-gray-600">{sorteo.titulo}</p>

          {sorteo.numero_ganador && (
            <div className="mx-auto mt-6 flex h-32 w-32 items-center justify-center rounded-full bg-indigo-600 text-5xl font-bold text-white shadow-lg">
              {sorteo.numero_ganador}
            </div>
          )}

          <p className="mt-6 text-sm text-gray-600">
            ¡Felicidades a la persona con el puesto ganador! El creador se pondrá en
            contacto para la entrega del premio.
          </p>

          <Button className="mt-6 !w-auto" onClick={() => setGanadorDismissedFor(sorteo.id)}>
            Ver la cuadrícula
          </Button>
        </div>
      </Modal>
    </div>
  );
}