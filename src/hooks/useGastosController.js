import { useMemo, useState } from "react";
import { crearGasto, validarGasto } from "../models/gastoModel";
import { CATEGORIAS } from "../models/categoriaModel";

const CLAVE_GASTOS = "hogar_gastos";
const CLAVE_INGRESOS = "hogar_ingresos";
const CLAVE_DEUDAS = "hogar_deudas";
const CLAVE_PAYLOAD_BD = "hogar_payload_supabase";
export const PERSONAS_TABLERO = Object.freeze(["anguspunkx", "lizafernanda"]);

/** Lee un arreglo persistido y retorna fallback si hay datos corruptos. */
const leerListaSegura = (clave) => {
  try {
    const crudo = localStorage.getItem(clave);
    return Array.isArray(JSON.parse(crudo || "[]")) ? JSON.parse(crudo || "[]") : [];
  } catch {
    return [];
  }
};

/** Crea un ingreso normalizado con identificador local. */
const crearIngreso = ({ responsable, monto, fecha, fuenteIngreso, notaIngreso }) => ({
  id: `${Date.now()}_${Math.random().toString(16).slice(2, 8)}`,
  responsable: responsable.trim().toLowerCase(),
  monto: Number(Number(monto).toFixed(2)),
  fecha,
  fuenteIngreso: (fuenteIngreso || "").trim(),
  notaIngreso: (notaIngreso || "").trim(),
  creadoEn: Date.now(),
});

/** Valida un ingreso y retorna errores para feedback inmediato. */
const validarIngreso = ({ responsable, monto, fecha, fuenteIngreso, notaIngreso }) => {
  const errores = {};
  const hoy = new Date().toISOString().slice(0, 10);
  if (!responsable || responsable.trim().length < 2) errores.responsable = "Minimo 2 caracteres";
  if (responsable && !PERSONAS_TABLERO.includes(responsable.trim().toLowerCase())) errores.responsable = "Persona no permitida";
  if (!fuenteIngreso || fuenteIngreso.trim().length < 3) errores.fuenteIngreso = "Fuente de ingreso requerida";
  if ((notaIngreso || "").trim().length > 60) errores.notaIngreso = "Maximo 60 caracteres";
  if (!Number.isFinite(Number(monto)) || Number(monto) <= 0) errores.monto = "Debe ser mayor a 0";
  if (!fecha) errores.fecha = "Fecha requerida";
  if (fecha && fecha > hoy) errores.fecha = "No puede ser futura";
  return { esValido: Object.keys(errores).length === 0, errores };
};

/** Crea una deuda normalizada para seguimiento mensual de obligaciones. */
const crearDeuda = ({ acreedor, titular, monto, tasaInteres, cuotasTotales, cuotasPagadas, fechaInicio }) => ({
  id: `${Date.now()}_${Math.random().toString(16).slice(2, 8)}`,
  acreedor: acreedor.trim(),
  titular: titular.trim().toLowerCase(),
  monto: Number(Number(monto).toFixed(2)),
  tasaInteres: Number(Number(tasaInteres).toFixed(2)),
  cuotasTotales: Number(cuotasTotales),
  cuotasPagadas: Number(cuotasPagadas),
  fechaInicio,
  creadoEn: Date.now(),
});

/** Valida campos de deuda para evitar datos incompletos o inconsistentes. */
const validarDeuda = ({ acreedor, titular, monto, tasaInteres, cuotasTotales, cuotasPagadas, fechaInicio }) => {
  const errores = {};
  if (!acreedor || acreedor.trim().length < 2) errores.acreedor = "Acreedor invalido";
  if (!titular || titular.trim().length < 2) errores.titular = "Titular invalido";
  if (titular && !PERSONAS_TABLERO.includes(titular.trim().toLowerCase())) errores.titular = "Titular no permitido";
  if (!Number.isFinite(Number(monto)) || Number(monto) <= 0) errores.monto = "Monto invalido";
  if (!Number.isFinite(Number(tasaInteres)) || Number(tasaInteres) < 0) errores.tasaInteres = "Interes invalido";
  if (!Number.isFinite(Number(cuotasTotales)) || Number(cuotasTotales) < 1) errores.cuotasTotales = "Cuotas invalidas";
  if (!Number.isFinite(Number(cuotasPagadas)) || Number(cuotasPagadas) < 0) errores.cuotasPagadas = "Cuotas pagadas invalidas";
  if (Number(cuotasPagadas) > Number(cuotasTotales)) errores.cuotasPagadas = "No puede superar cuotas totales";
  if (!fechaInicio) errores.fechaInicio = "Fecha requerida";
  return { esValido: Object.keys(errores).length === 0, errores };
};

/** Calcula cuota mensual estimada con formula de amortizacion simple. */
const calcularCuotaMensual = (monto, tasaInteres, cuotasTotales) => {
  const r = (Number(tasaInteres) / 100) / 12;
  const n = Number(cuotasTotales);
  if (!r) return monto / n;
  return (monto * r) / (1 - (1 + r) ** -n);
};

/** Calcula saldo pendiente aproximado segun cuotas pagadas. */
const calcularSaldoPendiente = (monto, tasaInteres, cuotasTotales, cuotasPagadas) => {
  const cuota = calcularCuotaMensual(monto, tasaInteres, cuotasTotales);
  const r = (Number(tasaInteres) / 100) / 12;
  const k = Number(cuotasPagadas);
  if (!r) return Math.max(0, monto - cuota * k);
  const saldo = monto * (1 + r) ** k - cuota * (((1 + r) ** k - 1) / r);
  return Math.max(0, saldo);
};

/** Gestiona gastos, validacion, persistencia y metricas derivadas del mes. */
export function useGastosController() {
  const [gastos, setGastos] = useState(() => leerListaSegura(CLAVE_GASTOS));
  const [ingresos, setIngresos] = useState(() => leerListaSegura(CLAVE_INGRESOS));
  const [deudas, setDeudas] = useState(() => leerListaSegura(CLAVE_DEUDAS));
  const persistir = (lista) => {
    setGastos(lista);
    localStorage.setItem(CLAVE_GASTOS, JSON.stringify(lista));
  };
  /** Persiste la lista de ingresos para analitica financiera local. */
  const persistirIngresos = (lista) => {
    setIngresos(lista);
    localStorage.setItem(CLAVE_INGRESOS, JSON.stringify(lista));
  };
  /** Persiste la lista de deudas para control financiero compartido. */
  const persistirDeudas = (lista) => {
    setDeudas(lista);
    localStorage.setItem(CLAVE_DEUDAS, JSON.stringify(lista));
  };
  /** Refresca el almacenamiento local con el estado actual en memoria. */
  const refrescarStorageLocal = () => {
    localStorage.setItem(CLAVE_GASTOS, JSON.stringify(gastos));
    localStorage.setItem(CLAVE_INGRESOS, JSON.stringify(ingresos));
    localStorage.setItem(CLAVE_DEUDAS, JSON.stringify(deudas));
  };
  /** Guarda un payload listo para base de datos y sincroniza storage local. */
  const guardarParaBaseDatos = (registros) => {
    const paquete = {
      generadoEn: new Date().toISOString(),
      total: registros.length,
      registros,
    };
    localStorage.setItem(CLAVE_PAYLOAD_BD, JSON.stringify(paquete));
    refrescarStorageLocal();
    return paquete;
  };
  /** Agrega un gasto validado y devuelve resultado para feedback inmediato. */
  const agregar = (entrada) => {
    const validacion = validarGasto(entrada);
    if (!validacion.esValido) return { ok: false, errores: validacion.errores };
    persistir([crearGasto(entrada), ...gastos]);
    return { ok: true, errores: {} };
  };
  /** Elimina un gasto por id y persiste el estado actualizado. */
  const eliminar = (id) => persistir(gastos.filter((g) => g.id !== id));
  /** Agrega un ingreso con responsable y fecha para trazabilidad. */
  const agregarIngreso = (entrada) => {
    const validacion = validarIngreso(entrada);
    if (!validacion.esValido) return { ok: false, errores: validacion.errores };
    persistirIngresos([crearIngreso(entrada), ...ingresos]);
    return { ok: true, errores: {} };
  };
  /** Agrega una deuda validada para monitoreo de cuotas e interes. */
  const agregarDeuda = (entrada) => {
    const validacion = validarDeuda(entrada);
    if (!validacion.esValido) return { ok: false, errores: validacion.errores };
    persistirDeudas([crearDeuda(entrada), ...deudas]);
    return { ok: true, errores: {} };
  };
  /** Elimina una deuda para mantener cartera actualizada. */
  const eliminarDeuda = (id) => persistirDeudas(deudas.filter((d) => d.id !== id));
  const actual = new Date().toISOString().slice(0, 7);
  const gastosMes = useMemo(() => gastos.filter((g) => (g.fecha || "").startsWith(actual)), [gastos, actual]);
  const ingresosMes = useMemo(() => ingresos.filter((i) => (i.fecha || "").startsWith(actual)), [ingresos, actual]);
  const totalMes = useMemo(() => gastosMes.reduce((acc, g) => acc + g.monto, 0), [gastosMes]);
  const totalIngresosMes = useMemo(() => ingresosMes.reduce((acc, i) => acc + i.monto, 0), [ingresosMes]);
  const porCategoria = useMemo(() => {
    const base = CATEGORIAS.reduce((acc, c) => ({ ...acc, [c]: 0 }), {});
    gastosMes.forEach((g) => { base[g.categoria] = (base[g.categoria] || 0) + g.monto; });
    return base;
  }, [gastosMes]);
  const resumenCategorias = useMemo(
    () => Object.entries(porCategoria)
      .filter(([, monto]) => monto > 0)
      .sort((a, b) => b[1] - a[1])
      .map(([categoria, monto]) => ({
        categoria,
        monto,
        participacion: totalMes > 0 ? (monto / totalMes) * 100 : 0,
      })),
    [porCategoria, totalMes],
  );
  const resumenIngresosResponsable = useMemo(() => {
    const mapa = {};
    ingresosMes.forEach((i) => { mapa[i.responsable] = (mapa[i.responsable] || 0) + i.monto; });
    return Object.entries(mapa)
      .sort((a, b) => b[1] - a[1])
      .map(([responsable, monto]) => ({
        responsable,
        monto,
        participacion: totalIngresosMes > 0 ? (monto / totalIngresosMes) * 100 : 0,
      }));
  }, [ingresosMes, totalIngresosMes]);
  const gastoMayor = useMemo(() => gastosMes.reduce((max, g) => (g.monto > (max?.monto || 0) ? g : max), null), [gastosMes]);
  const categoriaPrincipal = useMemo(() => Object.entries(porCategoria).sort((a, b) => b[1] - a[1])[0]?.[0] || "-", [porCategoria]);
  const balanceMes = totalIngresosMes - totalMes;
  const porcentajeAhorro = totalIngresosMes > 0 ? (balanceMes / totalIngresosMes) * 100 : 0;
  const estado = balanceMes < 0 ? "critico" : porcentajeAhorro < 10 ? "alerta" : "saludable";
  const recomendacion =
    estado === "critico"
      ? "Tus gastos superan tus ingresos. Prioriza pagos obligatorios."
      : estado === "alerta"
        ? `Tu ahorro es bajo. Ajusta la categoria ${categoriaPrincipal}.`
        : "Balance saludable. Mantengan el plan financiero mensual.";
  const deudasAnalitica = useMemo(() => deudas.map((d) => {
    const cuotaMensual = calcularCuotaMensual(d.monto, d.tasaInteres, d.cuotasTotales);
    const saldoPendiente = calcularSaldoPendiente(d.monto, d.tasaInteres, d.cuotasTotales, d.cuotasPagadas);
    return {
      ...d,
      cuotaMensual,
      saldoPendiente,
      progreso: d.cuotasTotales > 0 ? (d.cuotasPagadas / d.cuotasTotales) * 100 : 0,
    };
  }), [deudas]);
  const resumenDeudas = useMemo(() => deudasAnalitica.reduce((acc, d) => ({
    totalSaldo: acc.totalSaldo + d.saldoPendiente,
    cuotaMensualTotal: acc.cuotaMensualTotal + d.cuotaMensual,
    totalDeudas: acc.totalDeudas + 1,
  }), { totalSaldo: 0, cuotaMensualTotal: 0, totalDeudas: 0 }), [deudasAnalitica]);
  const comparativoPersonas = useMemo(
    () => PERSONAS_TABLERO.map((persona) => ({
      persona,
      ingresos: ingresosMes.filter((i) => i.responsable === persona).reduce((acc, i) => acc + i.monto, 0),
      gastos: gastosMes.filter((g) => (g.persona || "") === persona).reduce((acc, g) => acc + g.monto, 0),
    })).map((fila) => ({ ...fila, balance: fila.ingresos - fila.gastos })),
    [ingresosMes, gastosMes],
  );
  const personaMasIngresa = useMemo(
    () => [...comparativoPersonas].sort((a, b) => b.ingresos - a.ingresos)[0]?.persona || "-",
    [comparativoPersonas],
  );
  const personaMasGasta = useMemo(
    () => [...comparativoPersonas].sort((a, b) => b.gastos - a.gastos)[0]?.persona || "-",
    [comparativoPersonas],
  );
  return {
    gastos,
    ingresos,
    deudas: deudasAnalitica,
    agregar,
    agregarIngreso,
    agregarDeuda,
    guardarParaBaseDatos,
    refrescarStorageLocal,
    eliminar,
    eliminarDeuda,
    totalMes,
    totalIngresosMes,
    balanceMes,
    porcentajeAhorro,
    resumenDeudas,
    comparativoPersonas,
    personaMasIngresa,
    personaMasGasta,
    resumenCategorias,
    resumenIngresosResponsable,
    porCategoria,
    gastoMayor,
    categoriaPrincipal,
    estado,
    recomendacion,
  };
}
