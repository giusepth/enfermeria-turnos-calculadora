# Calculadora de turnos de enfermería

Aplicación web para estimar de forma **teórica** los turnos de una enfermera a partir de un turno de referencia.

## Cómo funciona

El flujo es fijo, en tres pantallas:

1. **Turno de referencia** — se introduce una fecha y un turno: `Diurno` o `Nocturno`.
2. **Menú** — se elige entre consultar una fecha puntual o el mes completo.
3. **Resultado** — el turno calculado para esa fecha, o la lista de todos los turnos del mes.

La secuencia ordinaria rota en un ciclo de 4 días — `diurno → nocturno → posturno → libre` — y se calcula de forma determinista a partir de la referencia, sin secuencia precalculada.

> **Proyección teórica válida salvo modificaciones posteriores.** El resultado no es una confirmación oficial del empleador.

## Características

- **100% client-side**: sin backend, sin API y sin base de datos.
- La referencia vive **solo en memoria**: al recargar la página se vuelve a pedir. Es intencional.
- Las fechas se tratan como días calendario locales, sin desplazamientos por zona horaria.
- Acepta cualquier año representable (1–9999).

## Stack

- [Vite](https://vitejs.dev/) + JavaScript (sin framework)
- [Tailwind CSS](https://tailwindcss.com/) v4
- [Vitest](https://vitest.dev/) para las pruebas

## Estructura

```
frontend/
  index.html
  vite.config.js
  src/
    services/engine/   # motor de cálculo: fechas, secuencia y proyección
    models/            # estado de la referencia (solo en memoria)
    views/             # vista de cada pantalla
    controllers/        # controladores de la navegación
    ui/                # utilidades de interfaz
    styles/            # estilos
    __tests__/         # pruebas transversales
```

## Desarrollo

```bash
cd frontend
npm install
npm run dev        # servidor de desarrollo en http://localhost:5173
```

## Pruebas y build

```bash
npm run test       # suite de pruebas (Vitest)
npm run build      # genera el build estático en dist/
```

## Despliegue

El entregable es el **build estático** (`frontend/dist`): se sirve en cualquier hosting de sitios estáticos, sin variables de entorno.

En Vercel, como la app vive en `frontend/`, hay que configurar **Root Directory = `frontend`**.
