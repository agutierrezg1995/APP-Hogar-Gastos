import React from "react";
/**
 * Renderiza la lista tabular de gastos con accion directa de eliminar.
 * @param {{ gastos: Array<{id:string, descripcion:string, categoria:string, fecha:string, monto:number, persona:string, medioPago:string}>, onEliminar:(id:string)=>void }} props
 */
export default function GastoLista({ gastos, onEliminar }) {
  return (
    <section className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-900">Movimientos</h2>
        <span className="text-xs text-slate-500">{gastos.length} registros</span>
      </div>
      <div className="mt-3 overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="text-slate-600">
            <tr><th>Persona</th><th>Descripcion</th><th>Medio</th><th>Categoria</th><th>Fecha</th><th>Monto</th><th /></tr>
          </thead>
          <tbody>
            {gastos.map((g) => (
              <tr key={g.id} className="border-t border-slate-200 text-slate-800">
                <td className="py-2 capitalize">{g.persona || "-"}</td><td>{g.descripcion}</td><td>{g.medioPago || "-"}</td><td>{g.categoria}</td><td>{g.fecha}</td><td>${g.monto.toLocaleString("es-CO")}</td>
                <td><button onClick={() => onEliminar(g.id)} className="text-indigo-600">Eliminar</button></td>
              </tr>
            ))}
            {!gastos.length ? <tr><td colSpan="7" className="py-4 text-slate-500">Sin gastos registrados</td></tr> : null}
          </tbody>
        </table>
      </div>
    </section>
  );
}
