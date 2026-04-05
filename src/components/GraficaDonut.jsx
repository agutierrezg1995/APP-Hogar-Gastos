import React from "react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
} from "recharts";
import { COLORES_CATEGORIA } from "../models/categoriaModel";

/**
 * Renderiza grafica donut comparativa y barras por categoria de gastos.
 * @param {{ porCategoria: Record<string, number>, totalIngresos:number, totalGastos:number, totalBalance:number }} props
 */
export default function GraficaDonut({ porCategoria, totalIngresos, totalGastos, totalBalance }) {
  const dataCategorias = Object.entries(porCategoria)
    .map(([name, value]) => ({ name, value }))
    .filter((d) => d.value > 0);
  const dataResumen = [
    { name: "Ingresos", value: Math.max(0, totalIngresos), color: "#06b6d4" },
    { name: "Gastos", value: Math.max(0, totalGastos), color: "#ec4899" },
    { name: "Balance", value: Math.max(0, Math.abs(totalBalance)), color: "#4f46e5" },
  ].filter((d) => d.value > 0);
  return (
    <section className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
      <h2 className="text-lg font-semibold text-slate-900">Graficas financieras</h2>
      <p className="mt-1 text-xs text-slate-500">Visualiza comparativo general y detalle por categoria.</p>
      <div className="mt-3 grid gap-4 md:grid-cols-2">
        <div className="h-64 rounded-lg bg-slate-50 p-2">
          {!dataResumen.length ? <p className="pt-24 text-center text-sm text-slate-500">Sin datos para el resumen.</p> : null}
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={dataResumen} dataKey="value" nameKey="name" innerRadius={48} outerRadius={82}>
                {dataResumen.map((e) => <Cell key={e.name} fill={e.color} />)}
              </Pie>
              <Tooltip formatter={(v) => `$${Number(v).toLocaleString("es-CO")}`} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="h-64 rounded-lg bg-slate-50 p-2">
          {!dataCategorias.length ? <p className="pt-24 text-center text-sm text-slate-500">Sin gastos por categoria.</p> : null}
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={dataCategorias} margin={{ top: 10, right: 8, left: 0, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v) => `$${Number(v).toLocaleString("es-CO")}`} />
              <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                {dataCategorias.map((e) => <Cell key={e.name} fill={COLORES_CATEGORIA[e.name] || "#4f46e5"} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </section>
  );
}
