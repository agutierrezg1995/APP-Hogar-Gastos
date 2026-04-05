import { v4 as uuidv4 } from "uuid";
import { esCategoriaValida } from "./categoriaModel";

/** Crea un objeto Gasto normalizado con id y fecha estandar. */
export function crearGasto({ descripcion, monto, categoria, fecha, persona, medioPago }) {
  return {
    id: uuidv4(),
    descripcion: descripcion.trim(),
    monto: Number(Number(monto).toFixed(2)),
    categoria,
    fecha,
    persona: (persona || "").trim().toLowerCase(),
    medioPago: (medioPago || "").trim(),
    creadoEn: Date.now(),
  };
}

/** Valida un gasto y retorna errores por campo sin efectos secundarios. */
export function validarGasto({ descripcion, monto, categoria, fecha, persona, medioPago }) {
  const errores = {};
  const hoy = new Date().toISOString().slice(0, 10);
  if (!descripcion || descripcion.trim().length < 2) errores.descripcion = "Minimo 2 caracteres";
  if ((descripcion || "").trim().length > 40) errores.descripcion = "Maximo 40 caracteres";
  if (!Number.isFinite(Number(monto)) || Number(monto) <= 0) errores.monto = "Debe ser mayor a 0";
  if (!esCategoriaValida(categoria)) errores.categoria = "Categoria invalida";
  if (!persona || persona.trim().length < 3) errores.persona = "Persona requerida";
  if (!medioPago || medioPago.trim().length < 2) errores.medioPago = "Medio de pago requerido";
  if (!fecha) errores.fecha = "Fecha requerida";
  if (fecha && fecha > hoy) errores.fecha = "No puede ser futura";
  return { esValido: Object.keys(errores).length === 0, errores };
}
