import React from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { COLORES_CATEGORIA } from "../models/categoriaModel";

/**
 * Renderiza una grafica donut por categoria para lectura inmediata.
 * @param {{ porCategoria: Record<string, number> }} props
 */
export default function GraficaDonut({ porCategoria }) {
  const data = Object.entries(porCategoria).map(([name, value]) => ({ name, value })).filter((d) => d.value > 0);
  return (
    <section className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
      <h2 className="text-lg font-semibold text-slate-900">Distribucion por categoria</h2>
      <div className="mt-3 h-56">
        {!data.length ? <p className="pt-20 text-center text-sm text-slate-500">Agrega gastos para ver la distribucion.</p> : null}
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80}>
              {data.map((e) => <Cell key={e.name} fill={COLORES_CATEGORIA[e.name]} />)}
            </Pie>
            <Tooltip formatter={(v) => `$${Number(v).toLocaleString("es-CO")}`} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
