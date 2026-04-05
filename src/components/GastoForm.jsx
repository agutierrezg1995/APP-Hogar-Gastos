import React from "react";
import { CATEGORIAS } from "../models/categoriaModel";

/**
 * Renderiza un formulario controlado para crear gastos sin logica de negocio.
 * @param {{ formulario: object, errores: object, personas: string[], onCambiar:(campo:string, valor:string)=>void, onEnviar:()=>void }} props
 */
export default function GastoForm({ formulario, errores, personas, onCambiar, onEnviar }) {
  const onKeyDown = (e) => {
    if (e.key === "Enter") onEnviar();
  };
  return (
    <section className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
      <h2 className="text-lg font-semibold text-slate-900">Registrar gasto</h2>
      <div className="mt-3 grid gap-3">
        <select className="rounded-lg border border-slate-300 bg-slate-50 px-3 py-2" value={formulario.persona}
          onChange={(e) => onCambiar("persona", e.target.value)}>
          <option value="">Quien gasto</option>
          {personas.map((p) => <option key={p} value={p}>{p}</option>)}
        </select>
        {errores.persona ? <p className="text-sm text-indigo-600">{errores.persona}</p> : null}
        <input className="rounded-lg border border-slate-300 bg-slate-50 px-3 py-2" placeholder="Descripcion" maxLength={40}
          value={formulario.descripcion} onChange={(e) => onCambiar("descripcion", e.target.value)} onKeyDown={onKeyDown} />
        {errores.descripcion ? <p className="text-sm text-indigo-600">{errores.descripcion}</p> : null}
        <input className="rounded-lg border border-slate-300 bg-slate-50 px-3 py-2" type="number" min="0" step="0.01" placeholder="Monto"
          value={formulario.monto} onChange={(e) => onCambiar("monto", e.target.value)} onKeyDown={onKeyDown} />
        {errores.monto ? <p className="text-sm text-indigo-600">{errores.monto}</p> : null}
        <select className="rounded-lg border border-slate-300 bg-slate-50 px-3 py-2" value={formulario.medioPago}
          onChange={(e) => onCambiar("medioPago", e.target.value)}>
          <option value="">Medio de pago</option>
          <option value="Tarjeta">Tarjeta</option>
          <option value="Transferencia">Transferencia</option>
          <option value="Efectivo">Efectivo</option>
          <option value="Nequi">Nequi</option>
        </select>
        {errores.medioPago ? <p className="text-sm text-indigo-600">{errores.medioPago}</p> : null}
        <select className="rounded-lg border border-slate-300 bg-slate-50 px-3 py-2" value={formulario.categoria}
          onChange={(e) => onCambiar("categoria", e.target.value)}>
          <option value="">Categoria</option>
          {CATEGORIAS.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        {errores.categoria ? <p className="text-sm text-indigo-600">{errores.categoria}</p> : null}
        <input className="rounded-lg border border-slate-300 bg-slate-50 px-3 py-2" type="date" value={formulario.fecha}
          onChange={(e) => onCambiar("fecha", e.target.value)} />
        {errores.fecha ? <p className="text-sm text-indigo-600">{errores.fecha}</p> : null}
      </div>
      <p className="mt-3 text-xs text-slate-500">Tip: presiona Enter para guardar mas rapido.</p>
      <button onClick={onEnviar} className="mt-4 w-full rounded-lg bg-indigo-600 px-3 py-2 font-medium text-white">
        Agregar gasto
      </button>
    </section>
  );
}
