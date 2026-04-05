import React from "react";
import { useMemo, useState } from "react";
import { PERSONAS_TABLERO, useGastosController } from "./hooks/useGastosController";
import ResumenPanel from "./components/ResumenPanel";
import GastoForm from "./components/GastoForm";
import GastoLista from "./components/GastoLista";
import GraficaDonut from "./components/GraficaDonut";

const CLAVE_LOGIN = "hogar_login_activo";
const CLAVE_INTENTOS = "hogar_login_intentos";
const CLAVE_BLOQUEO = "hogar_login_bloqueo";
const CLAVE_SESION_EXPIRA = "hogar_login_expira";
const MS_BLOQUEO = 5 * 60 * 1000;
const MS_SESION = 12 * 60 * 60 * 1000;
const CREDENCIALES_HASH = Object.freeze({
  "lizangus@gmail.com": "62dd8ae7cc8690c0e43be9e4f64b3582a7a518c70c2c61e31d194631a74e2b2d",
  "anguspunkx@gmail.com": "11bcdeefe5b2586fba7d02b8c067a00d1c48653830314ede44cbb07fcc082812",
});
const CLASE_CARD = "rounded-xl bg-white shadow-sm ring-1 ring-slate-200 transition duration-200 hover:-translate-y-0.5 hover:shadow-md hover:ring-slate-300";

/** Calcula hash SHA-256 para comparar claves sin texto plano en memoria persistida. */
const hashSeguro = async (texto) => {
  const bytes = new TextEncoder().encode(texto);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, "0")).join("");
};

/** Crea la unica pantalla y conecta componentes de vista con el controller. */
export default function App() {
  const {
    gastos,
    ingresos,
    deudas,
    agregar,
    agregarIngreso,
    agregarDeuda,
    eliminar,
    eliminarDeuda,
    totalMes,
    totalIngresosMes,
    balanceMes,
    porcentajeAhorro,
    resumenDeudas,
    resumenCategorias,
    resumenIngresosResponsable,
    porCategoria,
    gastoMayor,
    categoriaPrincipal,
    estado,
    recomendacion,
  } = useGastosController();
  const hoy = new Date().toISOString().slice(0, 10);
  const inicioMes = `${hoy.slice(0, 8)}01`;
  const [sesionActiva, setSesionActiva] = useState(() => {
    const usuario = localStorage.getItem(CLAVE_LOGIN) || "";
    const expira = Number(localStorage.getItem(CLAVE_SESION_EXPIRA) || 0);
    return Boolean(CREDENCIALES_HASH[usuario]) && Date.now() < expira;
  });
  const [login, setLogin] = useState({ usuario: "", clave: "" });
  const [errorLogin, setErrorLogin] = useState("");
  const [filtroMovimientos, setFiltroMovimientos] = useState("todos");
  const [filtroPersona, setFiltroPersona] = useState("todos");
  const [filtroFechaInicio, setFiltroFechaInicio] = useState(inicioMes);
  const [filtroFechaFin, setFiltroFechaFin] = useState(hoy);
  const [seccionesAbiertas, setSeccionesAbiertas] = useState({
    ingresos: true,
    gastos: true,
    resumenGeneral: true,
    deudas: true,
    grafica: true,
    movimientos: true,
    tablaFinal: true,
  });
  const [formulario, setFormulario] = useState({ persona: "", descripcion: "", monto: "", medioPago: "", categoria: "", fecha: hoy });
  const [formularioIngreso, setFormularioIngreso] = useState({ responsable: "", monto: "", fecha: hoy, fuenteIngreso: "", notaIngreso: "" });
  const [formularioDeuda, setFormularioDeuda] = useState({ acreedor: "", titular: "", monto: "", tasaInteres: "", cuotasTotales: "12", cuotasPagadas: "0", fechaInicio: hoy });
  const [errores, setErrores] = useState({});
  const [erroresIngreso, setErroresIngreso] = useState({});
  const [erroresDeuda, setErroresDeuda] = useState({});
  const [mensaje, setMensaje] = useState("");

  /** Aplica estilo de color por persona para lectura rapida del dashboard. */
  const clasePersona = (persona, activo) => {
    if (persona === "anguspunkx") return activo ? "bg-sky-600 text-white" : "bg-sky-50 text-sky-700";
    return activo ? "bg-rose-600 text-white" : "bg-rose-50 text-rose-700";
  };
  /** Valida si una fecha cae dentro del rango elegido en la cabecera. */
  const estaEnRango = (fecha) => (!filtroFechaInicio || fecha >= filtroFechaInicio) && (!filtroFechaFin || fecha <= filtroFechaFin);

  /** Alterna el estado plegado/desplegado de una tarjeta del dashboard. */
  const alternarSeccion = (clave) => setSeccionesAbiertas((prev) => ({ ...prev, [clave]: !prev[clave] }));
  /** Cambia los campos de autenticacion del dashboard. */
  const onCambiarLogin = (campo, valor) => setLogin((prev) => ({ ...prev, [campo]: valor }));
  /** Inicia sesion para uno de los dos usuarios autorizados. */
  const onEntrar = async () => {
    const correo = login.usuario.trim().toLowerCase();
    const bloqueoHasta = Number(localStorage.getItem(CLAVE_BLOQUEO) || 0);
    if (Date.now() < bloqueoHasta) {
      setErrorLogin("Acceso bloqueado temporalmente por seguridad.");
      return;
    }
    if (!CREDENCIALES_HASH[correo]) {
      setErrorLogin("Credenciales invalidas");
      return;
    }
    const claveHash = await hashSeguro(login.clave);
    if (claveHash !== CREDENCIALES_HASH[correo]) {
      const intentos = Number(localStorage.getItem(CLAVE_INTENTOS) || 0) + 1;
      localStorage.setItem(CLAVE_INTENTOS, String(intentos));
      if (intentos >= 5) {
        localStorage.setItem(CLAVE_BLOQUEO, String(Date.now() + MS_BLOQUEO));
        localStorage.setItem(CLAVE_INTENTOS, "0");
        setErrorLogin("Demasiados intentos. Intenta de nuevo en unos minutos.");
        return;
      }
      setErrorLogin("Credenciales invalidas");
      return;
    }
    localStorage.setItem(CLAVE_LOGIN, correo);
    localStorage.setItem(CLAVE_INTENTOS, "0");
    localStorage.removeItem(CLAVE_BLOQUEO);
    localStorage.setItem(CLAVE_SESION_EXPIRA, String(Date.now() + MS_SESION));
    setSesionActiva(true);
    setErrorLogin("");
  };
  /** Cierra sesion del tablero compartido. */
  const onSalir = () => {
    localStorage.removeItem(CLAVE_LOGIN);
    localStorage.removeItem(CLAVE_SESION_EXPIRA);
    setSesionActiva(false);
  };
  /** Actualiza campos del formulario de gastos. */
  const onCambiarGasto = (campo, valor) => setFormulario((prev) => ({ ...prev, [campo]: valor }));
  /** Actualiza campos del formulario de ingresos. */
  const onCambiarIngreso = (campo, valor) => setFormularioIngreso((prev) => ({ ...prev, [campo]: valor }));
  /** Actualiza campos del formulario de deudas. */
  const onCambiarDeuda = (campo, valor) => setFormularioDeuda((prev) => ({ ...prev, [campo]: valor }));
  /** Guarda un gasto y refresca feedback visual. */
  const onEnviarGasto = () => {
    const r = agregar(formulario);
    setErrores(r.errores || {});
    if (r.ok) {
      setFormulario({ persona: "", descripcion: "", monto: "", medioPago: "", categoria: "", fecha: hoy });
      setMensaje("Gasto guardado correctamente.");
      return;
    }
    setMensaje("Revisa los campos del gasto.");
  };
  /** Guarda un ingreso con validaciones ampliadas. */
  const onEnviarIngreso = () => {
    const r = agregarIngreso(formularioIngreso);
    setErroresIngreso(r.errores || {});
    if (r.ok) {
      setFormularioIngreso({ responsable: "", monto: "", fecha: hoy, fuenteIngreso: "", notaIngreso: "" });
      setMensaje("Ingreso guardado correctamente.");
      return;
    }
    setMensaje("Revisa los campos del ingreso.");
  };
  /** Guarda una deuda para control de cuotas y saldo pendiente. */
  const onEnviarDeuda = () => {
    const r = agregarDeuda(formularioDeuda);
    setErroresDeuda(r.errores || {});
    if (r.ok) {
      setFormularioDeuda({ acreedor: "", titular: "", monto: "", tasaInteres: "", cuotasTotales: "12", cuotasPagadas: "0", fechaInicio: hoy });
      setMensaje("Deuda registrada correctamente.");
      return;
    }
    setMensaje("Revisa los campos de deuda.");
  };
  const ingresosPorFecha = useMemo(() => ingresos.filter((i) => estaEnRango(i.fecha)), [ingresos, filtroFechaInicio, filtroFechaFin]);
  const gastosPorFecha = useMemo(() => gastos.filter((g) => estaEnRango(g.fecha)), [gastos, filtroFechaInicio, filtroFechaFin]);
  const deudasFiltradas = useMemo(
    () => deudas.filter((d) => estaEnRango(d.fechaInicio) && (filtroPersona === "todos" || d.titular === filtroPersona)),
    [deudas, filtroPersona, filtroFechaInicio, filtroFechaFin],
  );
  const ingresosFiltrados = useMemo(
    () => (filtroPersona === "todos" ? ingresosPorFecha : ingresosPorFecha.filter((i) => i.responsable === filtroPersona)),
    [ingresosPorFecha, filtroPersona],
  );
  const gastosBase = useMemo(
    () => (filtroPersona === "todos" ? gastosPorFecha : gastosPorFecha.filter((g) => (g.persona || "") === filtroPersona)),
    [gastosPorFecha, filtroPersona],
  );
  const gastosFiltrados = useMemo(() => {
    if (filtroMovimientos === "altos") return gastosBase.filter((g) => g.monto >= 200000);
    if (filtroMovimientos === "hoy") return gastosBase.filter((g) => g.fecha === hoy);
    return gastosBase;
  }, [gastosBase, filtroMovimientos, hoy]);
  const totalIngresosVista = useMemo(() => ingresosFiltrados.reduce((acc, i) => acc + i.monto, 0), [ingresosFiltrados]);
  const totalGastosVista = useMemo(() => gastosFiltrados.reduce((acc, g) => acc + g.monto, 0), [gastosFiltrados]);
  const balanceVista = totalIngresosVista - totalGastosVista;
  const ahorroVista = totalIngresosVista > 0 ? (balanceVista / totalIngresosVista) * 100 : 0;
  const gastoMayorVista = useMemo(() => gastosFiltrados.reduce((max, g) => (g.monto > (max?.monto || 0) ? g : max), null), [gastosFiltrados]);
  const porCategoriaVista = useMemo(() => {
    const base = Object.keys(porCategoria).reduce((acc, c) => ({ ...acc, [c]: 0 }), {});
    gastosFiltrados.forEach((g) => { base[g.categoria] = (base[g.categoria] || 0) + g.monto; });
    return base;
  }, [gastosFiltrados, porCategoria]);
  const categoriaPrincipalVista = useMemo(() => Object.entries(porCategoriaVista).sort((a, b) => b[1] - a[1])[0]?.[0] || "-", [porCategoriaVista]);
  const estadoVista = balanceVista < 0 ? "critico" : ahorroVista < 10 ? "alerta" : "saludable";
  const recomendacionVista =
    estadoVista === "critico"
      ? "Tu flujo esta en negativo para el rango elegido."
      : estadoVista === "alerta"
        ? `Ahorro bajo. Vigila ${categoriaPrincipalVista}.`
        : "Buen control financiero en el periodo.";
  const comparativoVista = useMemo(
    () => PERSONAS_TABLERO.map((persona) => ({
      persona,
      ingresos: ingresosPorFecha.filter((i) => i.responsable === persona).reduce((acc, i) => acc + i.monto, 0),
      gastos: gastosPorFecha.filter((g) => (g.persona || "") === persona).reduce((acc, g) => acc + g.monto, 0),
    })).map((f) => ({ ...f, balance: f.ingresos - f.gastos })),
    [ingresosPorFecha, gastosPorFecha],
  );
  const personaMasIngresa = useMemo(() => [...comparativoVista].sort((a, b) => b.ingresos - a.ingresos)[0]?.persona || "-", [comparativoVista]);
  const personaMasGasta = useMemo(() => [...comparativoVista].sort((a, b) => b.gastos - a.gastos)[0]?.persona || "-", [comparativoVista]);
  const tablaConsolidada = useMemo(() => {
    const filasGastos = gastosFiltrados.map((g) => ({
      id: `g_${g.id}`,
      tipo: "Gasto",
      persona: g.persona || "-",
      detalle: `${g.descripcion} (${g.categoria})`,
      fecha: g.fecha,
      monto: g.monto,
      extra: g.medioPago || "-",
    }));
    const filasIngresos = ingresosFiltrados.map((i) => ({
      id: `i_${i.id}`,
      tipo: "Ingreso",
      persona: i.responsable,
      detalle: i.fuenteIngreso || "Ingreso",
      fecha: i.fecha,
      monto: i.monto,
      extra: i.notaIngreso || "-",
    }));
    const filasDeudas = deudasFiltradas.map((d) => ({
      id: `d_${d.id}`,
      tipo: "Deuda",
      persona: d.titular,
      detalle: d.acreedor,
      fecha: d.fechaInicio,
      monto: d.saldoPendiente,
      extra: `Cuota ${d.cuotaMensual.toLocaleString("es-CO")}`,
    }));
    return [...filasGastos, ...filasIngresos, ...filasDeudas].sort((a, b) => b.fecha.localeCompare(a.fecha));
  }, [gastosFiltrados, ingresosFiltrados, deudasFiltradas]);

  if (!sesionActiva) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4 text-slate-900">
        <section className="w-full max-w-md rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200 transition duration-200 hover:shadow-md">
          <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Acceso Ejecutivo</p>
          <h1 className="mt-2 text-2xl font-semibold text-slate-900">Iniciar sesion</h1>
          <p className="mt-2 text-sm text-slate-600">Ingresa con tus credenciales para abrir el tablero.</p>
          <div className="mt-4 grid gap-3">
            <input className="rounded-lg border border-slate-300 bg-slate-50 px-3 py-2" placeholder="Correo" autoComplete="email"
              value={login.usuario} onChange={(e) => onCambiarLogin("usuario", e.target.value)} />
            <input className="rounded-lg border border-slate-300 bg-slate-50 px-3 py-2" type="password" placeholder="Clave" autoComplete="current-password"
              value={login.clave} onChange={(e) => onCambiarLogin("clave", e.target.value)} />
          </div>
          {errorLogin ? <p className="mt-3 text-sm text-indigo-600">{errorLogin}</p> : null}
          <button onClick={onEntrar} className="mt-4 w-full rounded-lg bg-indigo-600 px-3 py-2 font-medium text-white">Entrar</button>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-100 px-3 py-4 text-slate-900 sm:px-4 sm:py-6">
      <header className="mx-auto mb-4 max-w-7xl rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-700 p-5 text-white shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-slate-200">Dashboard Pareja</p>
            <h1 className="mt-1 text-2xl font-semibold sm:text-3xl">Control de Ingresos, Gastos y Deudas</h1>
            <p className="mt-1 text-sm text-slate-200">Tablero compartido: ambos usuarios ven el mismo estado financiero.</p>
          </div>
          <button onClick={onSalir} className="rounded-lg bg-white/15 px-3 py-2 text-sm font-medium text-white ring-1 ring-white/40">Cerrar sesion</button>
        </div>
      </header>

      <section className="mx-auto mb-4 max-w-7xl rounded-xl bg-white p-3 shadow-sm ring-1 ring-slate-200">
        <p className="text-xs text-slate-500">Filtros de analitica</p>
        <div className="mt-2 flex flex-wrap gap-2">
          <button onClick={() => setFiltroPersona("todos")} className={`rounded-lg px-3 py-1.5 text-sm transition ${filtroPersona === "todos" ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"}`}>Todos</button>
          {PERSONAS_TABLERO.map((p) => <button key={p} onClick={() => setFiltroPersona(p)} className={`rounded-lg px-3 py-1.5 text-sm capitalize transition ${clasePersona(p, filtroPersona === p)} hover:brightness-95`}>{p}</button>)}
        </div>
        <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          <label className="text-xs text-slate-500">Fecha inicio<input type="date" value={filtroFechaInicio} onChange={(e) => setFiltroFechaInicio(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 bg-slate-50 px-2 py-1.5 text-sm" /></label>
          <label className="text-xs text-slate-500">Fecha fin<input type="date" value={filtroFechaFin} onChange={(e) => setFiltroFechaFin(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 bg-slate-50 px-2 py-1.5 text-sm" /></label>
          <div className="rounded-lg bg-sky-50 px-2 py-2 text-sm text-sky-800">Mas ingresa: <strong className="capitalize">{personaMasIngresa}</strong></div>
          <div className="rounded-lg bg-rose-50 px-2 py-2 text-sm text-rose-800">Mas gasta: <strong className="capitalize">{personaMasGasta}</strong></div>
        </div>
        <div className="mt-2 grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
          <p className="rounded-lg bg-slate-50 px-2 py-1">Ingresos: <strong>${totalIngresosVista.toLocaleString("es-CO")}</strong></p>
          <p className="rounded-lg bg-slate-50 px-2 py-1">Gastos: <strong>${totalGastosVista.toLocaleString("es-CO")}</strong></p>
          <p className="rounded-lg bg-slate-50 px-2 py-1">Balance: <strong>${balanceVista.toLocaleString("es-CO")}</strong></p>
          <p className="rounded-lg bg-slate-50 px-2 py-1">Ahorro: <strong>{ahorroVista.toFixed(1)}%</strong></p>
        </div>
      </section>

      {mensaje ? <p className="mx-auto mb-4 max-w-7xl rounded-lg bg-white px-3 py-2 text-sm text-slate-700 shadow-sm ring-1 ring-slate-200">{mensaje}</p> : null}

      <div className="mx-auto grid max-w-7xl gap-4 lg:grid-cols-12">
        <section className="space-y-4 lg:col-span-4">
          <article className={CLASE_CARD}>
            <button onClick={() => alternarSeccion("ingresos")} className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-slate-50"><h2 className="font-semibold">Ingresos</h2><span>{seccionesAbiertas.ingresos ? "Ocultar" : "Ver"}</span></button>
            {seccionesAbiertas.ingresos ? (
              <div className="border-t border-slate-200 p-4">
                <div className="grid gap-3">
                  <select className="rounded-lg border border-slate-300 px-3 py-2" value={formularioIngreso.responsable} onChange={(e) => onCambiarIngreso("responsable", e.target.value)}>
                    <option value="">Quien ingresa</option>
                    {PERSONAS_TABLERO.map((p) => <option key={p} value={p}>{p}</option>)}
                  </select>
                  {erroresIngreso.responsable ? <p className="text-sm text-indigo-600">{erroresIngreso.responsable}</p> : null}
                  <input className="rounded-lg border border-slate-300 px-3 py-2" placeholder="Fuente de ingreso" value={formularioIngreso.fuenteIngreso} onChange={(e) => onCambiarIngreso("fuenteIngreso", e.target.value)} />
                  {erroresIngreso.fuenteIngreso ? <p className="text-sm text-indigo-600">{erroresIngreso.fuenteIngreso}</p> : null}
                  <input className="rounded-lg border border-slate-300 px-3 py-2" type="number" min="0" step="0.01" placeholder="Monto" value={formularioIngreso.monto} onChange={(e) => onCambiarIngreso("monto", e.target.value)} />
                  {erroresIngreso.monto ? <p className="text-sm text-indigo-600">{erroresIngreso.monto}</p> : null}
                  <input className="rounded-lg border border-slate-300 px-3 py-2" placeholder="Nota (opcional)" maxLength={60} value={formularioIngreso.notaIngreso} onChange={(e) => onCambiarIngreso("notaIngreso", e.target.value)} />
                  {erroresIngreso.notaIngreso ? <p className="text-sm text-indigo-600">{erroresIngreso.notaIngreso}</p> : null}
                  <input className="rounded-lg border border-slate-300 px-3 py-2" type="date" value={formularioIngreso.fecha} onChange={(e) => onCambiarIngreso("fecha", e.target.value)} />
                  <button onClick={onEnviarIngreso} className="rounded-lg bg-indigo-600 px-3 py-2 font-medium text-white">Guardar ingreso</button>
                </div>
                <div className="mt-3 max-h-44 overflow-auto text-sm">
                  {ingresosFiltrados.map((i) => <p key={i.id} className="mb-2 rounded-lg bg-slate-50 px-2 py-1 capitalize">{i.responsable}: ${i.monto.toLocaleString("es-CO")} ({i.fuenteIngreso})</p>)}
                </div>
              </div>
            ) : null}
          </article>

          <article className={CLASE_CARD}>
            <button onClick={() => alternarSeccion("deudas")} className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-slate-50"><h2 className="font-semibold">Deudas</h2><span>{seccionesAbiertas.deudas ? "Ocultar" : "Ver"}</span></button>
            {seccionesAbiertas.deudas ? (
              <div className="border-t border-slate-200 p-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <input className="rounded-lg border border-slate-300 px-3 py-2" placeholder="Acreedor" value={formularioDeuda.acreedor} onChange={(e) => onCambiarDeuda("acreedor", e.target.value)} />
                  <select className="rounded-lg border border-slate-300 px-3 py-2" value={formularioDeuda.titular} onChange={(e) => onCambiarDeuda("titular", e.target.value)}><option value="">Titular</option>{PERSONAS_TABLERO.map((p) => <option key={p} value={p}>{p}</option>)}</select>
                  <input className="rounded-lg border border-slate-300 px-3 py-2" type="number" min="0" step="0.01" placeholder="Monto" value={formularioDeuda.monto} onChange={(e) => onCambiarDeuda("monto", e.target.value)} />
                  <input className="rounded-lg border border-slate-300 px-3 py-2" type="number" min="0" step="0.01" placeholder="Interes anual %" value={formularioDeuda.tasaInteres} onChange={(e) => onCambiarDeuda("tasaInteres", e.target.value)} />
                  <input className="rounded-lg border border-slate-300 px-3 py-2" type="number" min="1" placeholder="Cuotas totales" value={formularioDeuda.cuotasTotales} onChange={(e) => onCambiarDeuda("cuotasTotales", e.target.value)} />
                  <input className="rounded-lg border border-slate-300 px-3 py-2" type="number" min="0" placeholder="Cuotas pagadas" value={formularioDeuda.cuotasPagadas} onChange={(e) => onCambiarDeuda("cuotasPagadas", e.target.value)} />
                </div>
                <input className="mt-3 w-full rounded-lg border border-slate-300 px-3 py-2" type="date" value={formularioDeuda.fechaInicio} onChange={(e) => onCambiarDeuda("fechaInicio", e.target.value)} />
                {Object.values(erroresDeuda)[0] ? <p className="mt-2 text-sm text-indigo-600">{Object.values(erroresDeuda)[0]}</p> : null}
                <button onClick={onEnviarDeuda} className="mt-3 w-full rounded-lg bg-indigo-600 px-3 py-2 font-medium text-white">Guardar deuda</button>
              </div>
            ) : null}
          </article>
        </section>

        <section className="space-y-4 lg:col-span-4">
          <article className={CLASE_CARD}>
            <button onClick={() => alternarSeccion("gastos")} className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-slate-50"><h2 className="font-semibold">Gastos</h2><span>{seccionesAbiertas.gastos ? "Ocultar" : "Ver"}</span></button>
            {seccionesAbiertas.gastos ? <div className="border-t border-slate-200 p-4"><GastoForm formulario={formulario} errores={errores} personas={PERSONAS_TABLERO} onCambiar={onCambiarGasto} onEnviar={onEnviarGasto} /></div> : null}
          </article>
          <article className={CLASE_CARD}>
            <button onClick={() => alternarSeccion("movimientos")} className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-slate-50"><h2 className="font-semibold">Movimientos</h2><span>{seccionesAbiertas.movimientos ? "Ocultar" : "Ver"}</span></button>
            {seccionesAbiertas.movimientos ? (
              <div className="border-t border-slate-200 p-4">
                <div className="mb-3 flex gap-2">
                  <button onClick={() => setFiltroMovimientos("todos")} className={`rounded-lg px-2 py-1 text-xs ${filtroMovimientos === "todos" ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-700"}`}>Todos</button>
                  <button onClick={() => setFiltroMovimientos("altos")} className={`rounded-lg px-2 py-1 text-xs ${filtroMovimientos === "altos" ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-700"}`}>Altos</button>
                  <button onClick={() => setFiltroMovimientos("hoy")} className={`rounded-lg px-2 py-1 text-xs ${filtroMovimientos === "hoy" ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-700"}`}>Hoy</button>
                </div>
                <GastoLista gastos={gastosFiltrados} onEliminar={eliminar} />
              </div>
            ) : null}
          </article>
        </section>

        <section className="space-y-4 lg:col-span-4">
          <article className={CLASE_CARD}>
            <button onClick={() => alternarSeccion("resumenGeneral")} className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-slate-50"><h2 className="font-semibold">Resumen General</h2><span>{seccionesAbiertas.resumenGeneral ? "Ocultar" : "Ver"}</span></button>
            {seccionesAbiertas.resumenGeneral ? (
              <div className="border-t border-slate-200 p-4">
                <ResumenPanel totalIngresosMes={totalIngresosVista} totalMes={totalGastosVista} balanceMes={balanceVista}
                  porcentajeAhorro={ahorroVista} gastoMayor={gastoMayorVista || gastoMayor} categoriaPrincipal={categoriaPrincipalVista || categoriaPrincipal}
                  estado={estadoVista} recomendacion={recomendacionVista} />
                <div className="mt-3 overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="text-slate-500"><tr><th>Persona</th><th>Ingresa</th><th>Gasta</th><th>Balance</th></tr></thead>
                    <tbody>{comparativoVista.map((f) => <tr key={f.persona} className="border-t border-slate-200"><td className="py-2 capitalize">{f.persona}</td><td>${f.ingresos.toLocaleString("es-CO")}</td><td>${f.gastos.toLocaleString("es-CO")}</td><td>${f.balance.toLocaleString("es-CO")}</td></tr>)}</tbody>
                  </table>
                </div>
              </div>
            ) : null}
          </article>
          <article className={CLASE_CARD}>
            <button onClick={() => alternarSeccion("grafica")} className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-slate-50"><h2 className="font-semibold">Grafica y Tablas</h2><span>{seccionesAbiertas.grafica ? "Ocultar" : "Ver"}</span></button>
            {seccionesAbiertas.grafica ? (
              <div className="border-t border-slate-200 p-4">
                <GraficaDonut porCategoria={porCategoriaVista} />
                <div className="mt-3 grid gap-3">
                  <article className="rounded-lg bg-slate-50 p-3"><h3 className="font-medium">Resumen por categoria</h3>{resumenCategorias.map((r) => <p key={r.categoria} className="text-sm">{r.categoria}: ${r.monto.toLocaleString("es-CO")} ({r.participacion.toFixed(1)}%)</p>)}</article>
                  <article className="rounded-lg bg-slate-50 p-3"><h3 className="font-medium">Resumen por responsable</h3>{resumenIngresosResponsable.map((r) => <p key={r.responsable} className="text-sm capitalize">{r.responsable}: ${r.monto.toLocaleString("es-CO")} ({r.participacion.toFixed(1)}%)</p>)}</article>
                  <article className="rounded-lg bg-slate-50 p-3"><h3 className="font-medium">Deudas activas</h3><p className="text-sm">Total deudas: {deudasFiltradas.length}</p><p className="text-sm">Saldo pendiente: ${deudasFiltradas.reduce((acc, d) => acc + d.saldoPendiente, 0).toLocaleString("es-CO")}</p><p className="text-sm">Cuota mensual: ${deudasFiltradas.reduce((acc, d) => acc + d.cuotaMensual, 0).toLocaleString("es-CO")}</p>{deudasFiltradas.map((d) => <div key={d.id} className="mt-2 flex items-center justify-between rounded-lg bg-white px-2 py-1 text-sm"><span className="capitalize">{d.acreedor} ({d.titular})</span><button onClick={() => eliminarDeuda(d.id)} className="text-indigo-600">Quitar</button></div>)}</article>
                </div>
              </div>
            ) : null}
          </article>
          <article className={CLASE_CARD}>
            <button onClick={() => alternarSeccion("tablaFinal")} className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-slate-50"><h2 className="font-semibold">Tabla Consolidada</h2><span>{seccionesAbiertas.tablaFinal ? "Ocultar" : "Ver"}</span></button>
            {seccionesAbiertas.tablaFinal ? (
              <div className="border-t border-slate-200 p-4">
                <p className="mb-2 text-xs text-slate-500">Vista completa filtrada por persona y rango de fecha.</p>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="text-slate-500"><tr><th>Tipo</th><th>Persona</th><th>Detalle</th><th>Fecha</th><th>Monto</th><th>Extra</th></tr></thead>
                    <tbody>
                      {tablaConsolidada.map((f) => (
                        <tr key={f.id} className="border-t border-slate-200">
                          <td className="py-2">{f.tipo}</td>
                          <td className="capitalize">{f.persona}</td>
                          <td>{f.detalle}</td>
                          <td>{f.fecha}</td>
                          <td>${f.monto.toLocaleString("es-CO")}</td>
                          <td>{f.extra}</td>
                        </tr>
                      ))}
                      {!tablaConsolidada.length ? <tr><td colSpan="6" className="py-2 text-slate-500">Sin datos para el filtro seleccionado</td></tr> : null}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : null}
          </article>
        </section>
      </div>
    </main>
  );
}
