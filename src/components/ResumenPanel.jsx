import React from "react";
/**
 * Renderiza indicadores ejecutivos para seguimiento financiero del hogar.
 * @param {{ totalIngresosMes:number, totalMes:number, balanceMes:number, porcentajeAhorro:number, gastoMayor: object|null, categoriaPrincipal:string, estado:string, recomendacion:string }} props
 */
export default function ResumenPanel({ totalIngresosMes, totalMes, balanceMes, porcentajeAhorro, gastoMayor, categoriaPrincipal, estado, recomendacion }) {
  const claseEstado = estado === "critico" ? "bg-indigo-600 text-white" : estado === "alerta" ? "bg-indigo-100 text-indigo-700" : "bg-slate-100 text-slate-700";
  const claseBalance = balanceMes >= 0 ? "text-indigo-700" : "text-slate-900";
  return (
    <section className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
      <h2 className="text-lg font-semibold text-slate-900">Resumen ejecutivo</h2>
      <div className="mt-3 grid grid-cols-2 gap-3">
        <article className="rounded-lg bg-slate-50 p-3 ring-1 ring-slate-200">
          <p className="text-xs text-slate-500">Ingresos</p>
          <p className="font-semibold text-slate-900">${totalIngresosMes.toLocaleString("es-CO")}</p>
        </article>
        <article className="rounded-lg bg-slate-50 p-3 ring-1 ring-slate-200">
          <p className="text-xs text-slate-500">Gastos</p>
          <p className="font-semibold text-slate-900">${totalMes.toLocaleString("es-CO")}</p>
        </article>
        <article className="rounded-lg bg-slate-50 p-3 ring-1 ring-slate-200">
          <p className="text-xs text-slate-500">Balance</p>
          <p className={`font-semibold ${claseBalance}`}>${balanceMes.toLocaleString("es-CO")}</p>
        </article>
        <article className="rounded-lg bg-slate-50 p-3 ring-1 ring-slate-200">
          <p className="text-xs text-slate-500">Ahorro</p>
          <p className="font-semibold text-slate-900">{porcentajeAhorro.toFixed(1)}%</p>
        </article>
      </div>
      <p className="mt-3 text-sm text-slate-700">Mayor gasto: {gastoMayor ? `${gastoMayor.descripcion} ($${gastoMayor.monto.toLocaleString("es-CO")})` : "-"}</p>
      <p className="text-sm text-slate-700">Categoria dominante: {categoriaPrincipal}</p>
      <p className={`mt-3 inline-block rounded-lg px-2 py-1 text-xs font-semibold ${claseEstado}`}>Estado: {estado}</p>
      <p className="mt-2 text-sm text-slate-700">{recomendacion}</p>
    </section>
  );
}
