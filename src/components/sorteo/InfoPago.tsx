import { useState } from "react";
import type { Database } from "../../lib/database.types";

type Sorteo = Database["public"]["Tables"]["sorteos"]["Row"];

interface InfoPagoProps {
  sorteo: Sorteo;
  /** Versión reducida, para mostrar dentro del modal de reserva */
  compacto?: boolean;
}

type Metodo = { etiqueta: string; valor: string };

export default function InfoPago({ sorteo, compacto = false }: InfoPagoProps) {
  const [copiado, setCopiado] = useState<string | null>(null);

  const metodos: Metodo[] = [];
  if (sorteo.pago_nequi) metodos.push({ etiqueta: "Nequi", valor: sorteo.pago_nequi });
  if (sorteo.pago_daviplata) metodos.push({ etiqueta: "Daviplata", valor: sorteo.pago_daviplata });
  if (sorteo.pago_llave) metodos.push({ etiqueta: "Llave Bre-B", valor: sorteo.pago_llave });

  const copiar = async (texto: string, etiqueta: string) => {
    try {
      await navigator.clipboard.writeText(texto);
      setCopiado(etiqueta);
      setTimeout(() => setCopiado(null), 2000);
    } catch {
      // Sin permiso de portapapeles: el valor sigue visible para copiar a mano
    }
  };

  // El creador no registró ninguna opción
  if (!sorteo.responsable && metodos.length === 0) {
    if (compacto) {
      return (
        <p className="text-xs text-gray-600">
          El creador no registró datos de transferencia; se contactará contigo
          al teléfono que registres para coordinar el pago.
        </p>
      );
    }
    return null;
  }

  const contenido = (
    <>
      {sorteo.responsable && (
        <p className="text-sm text-gray-600">
          <span className="font-semibold text-gray-800">Responsable: </span>
          {sorteo.responsable}
        </p>
      )}
      <ul className="mt-2 space-y-2">
        {metodos.map((m) => (
          <li key={m.etiqueta} className="flex items-center justify-between gap-3">
            <span className="text-sm text-gray-700">
              <span className="font-semibold text-gray-800">{m.etiqueta}: </span>
              <span className="font-mono">{m.valor}</span>
            </span>
            <button
              type="button"
              onClick={() => copiar(m.valor, m.etiqueta)}
              className="shrink-0 rounded-md border border-gray-200 bg-white px-2 py-1 text-xs font-medium text-gray-600 hover:bg-gray-50"
              title={`Copiar ${m.etiqueta}`}
            >
              {copiado === m.etiqueta ? "✅ Copiado" : "📋 Copiar"}
            </button>
          </li>
        ))}
      </ul>
    </>
  );

  if (compacto) return <div>{contenido}</div>;

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      {/*<h3 className="text-lg font-semibold text-gray-900">💳 Cómo pagar</h3>
      <p className="mt-1 text-xs text-gray-500">
        Envía el valor del puesto por una de estas opciones. El creador confirmará
        tu pago y tu puesto pasará a vendido.
      </p>*/}
      <div className="mt-3">{contenido}</div>
    </div>
  );
}