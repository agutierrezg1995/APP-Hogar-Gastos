# APP Hogar Gastos

Aplicacion web tipo dashboard para control financiero del hogar, disenada para uso compartido en pareja.

## Objetivo

Gestionar en una sola pantalla:
- Ingresos
- Gastos
- Deudas
- Resumen general con filtros por persona y fecha

La aplicacion funciona sin backend y guarda informacion en almacenamiento local del navegador.

## Tecnologias

- React 18
- Vite 5
- Tailwind CSS 3
- Recharts
- UUID

## Caracteristicas actuales

- Login con cuentas permitidas y control basico de seguridad.
- Dashboard compartido para ambos usuarios.
- Tarjetas plegables/desplegables para experiencia movil.
- Filtros por persona:
  - anguspunkx
  - lizafernanda
- Filtros por fecha (inicio y fin).
- Registro de gastos con validaciones:
  - persona
  - descripcion
  - monto
  - medio de pago
  - categoria
  - fecha
- Registro de ingresos con validaciones:
  - responsable
  - fuente de ingreso
  - monto
  - nota opcional
  - fecha
- Registro de deudas con validaciones:
  - acreedor
  - titular
  - monto
  - interes anual
  - cuotas totales
  - cuotas pagadas
  - fecha de inicio
- Calculos financieros:
  - balance
  - porcentaje de ahorro
  - comparativo por persona
  - saldo pendiente de deudas
  - cuota mensual estimada de deudas
- Tabla consolidada final con datos clave filtrados por fecha/persona.

## Seguridad minima aplicada

- Validacion de credenciales por hash SHA-256 en cliente.
- Bloqueo temporal por intentos fallidos de login.
- Expiracion de sesion.
- Limpieza de sesion al cerrar.

Nota: al ser una app 100% frontend y sin backend, esta seguridad es basica y orientada a uso domestico.

## Instalacion y ejecucion

1. Instalar dependencias:

npm install

2. Ejecutar en desarrollo:

npx vite --host --strictPort --port 5180

3. Abrir en navegador:

http://localhost:5180/

4. Generar build:

npm run build

## Uso en movil (instalable)

La app incluye configuracion PWA basica:
- manifest web
- service worker
- icono de app

Para instalar en celular:
1. Abrir la app desde el navegador movil.
2. Usar la opcion Agregar a pantalla de inicio.

## Estructura principal

- src/App.jsx
- src/hooks/useGastosController.js
- src/models/gastoModel.js
- src/models/categoriaModel.js
- src/components/GastoForm.jsx
- src/components/GastoLista.jsx
- src/components/ResumenPanel.jsx
- src/components/GraficaDonut.jsx
- public/manifest.webmanifest
- public/sw.js
- public/logo-app.svg

## Estado del proyecto

Aplicacion funcional en entorno local con enfoque mobile-first, dashboard interactivo y persistencia local.
