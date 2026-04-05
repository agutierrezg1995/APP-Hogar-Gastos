/** Define las categorias validas y sus colores de acento. */
export const CATEGORIAS = Object.freeze([
  "Mercado",
  "Servicios",
  "Arriendo",
  "Transporte",
  "Salud",
  "Educacion",
  "Entretenimiento",
  "Otros",
]);

/** Mapea cada categoria a un color permitido por la paleta. */
export const COLORES_CATEGORIA = Object.freeze({
  Mercado: "#4f46e5",
  Servicios: "#6366f1",
  Arriendo: "#4338ca",
  Transporte: "#3730a3",
  Salud: "#1d4ed8",
  Educacion: "#2563eb",
  Entretenimiento: "#0f172a",
  Otros: "#334155",
});

/** Verifica si una categoria pertenece al enum permitido. */
export const esCategoriaValida = (categoria) => CATEGORIAS.includes(categoria);
