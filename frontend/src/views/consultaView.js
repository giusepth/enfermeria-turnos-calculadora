import { escapeHtml } from '../ui/escapeHtml.js'
import { icon } from '../ui/icons.js'

const TURNO_LABELS = {
  diurno: 'Diurno',
  nocturno: 'Nocturno',
  posturno: 'Posturno',
  libre: 'Libre',
}

export function turnoLabel(turno) {
  return TURNO_LABELS[turno] ?? turno
}

/**
 * Horario `HH:MM – HH:MM` (« (día siguiente)» si cruza medianoche) o
 * `«HH:MM – (sin hora de fin)»` en el borde `9999-12-31` (§5.2, ADR-F06-009).
 * `horario === null` (`libre`, RN-05) ⇒ cadena vacía.
 */
export function formatearHorario(horario, fechaISO) {
  if (!horario?.inicio) {
    return ''
  }
  const inicio = horario.inicio.slice(11, 16)
  if (horario.fin === null) {
    return `${inicio} – (sin hora de fin)`
  }
  if (!horario.fin) {
    return ''
  }
  const fin = horario.fin.slice(11, 16)
  const cruza = horario.fin.slice(0, 10) > fechaISO
  return `${inicio} – ${fin}${cruza ? ' (día siguiente)' : ''}`
}

function renderHorario(horario, fecha) {
  const texto = formatearHorario(horario, fecha)
  if (!texto) {
    return ''
  }
  return `<p class="consulta-horario">Horario: <strong>${escapeHtml(texto)}</strong></p>`
}

function renderResultado(resultado) {
  if (!resultado) {
    return ''
  }

  if (resultado.sinInformacion) {
    return `
      <section id="consulta-sin-informacion" class="consulta-sin-informacion" role="status">
        <p>Sin información suficiente para <strong>${escapeHtml(resultado.fecha)}</strong>.</p>
        <p class="consulta-hint">La fecha es anterior a la referencia de turno; no se infiere ningún turno.</p>
      </section>
    `
  }

  const proyeccion = resultado.esProyeccion
    ? '<p class="consulta-proyeccion">Proyección teórica</p>'
    : ''

  return `
    <section id="consulta-resultado" class="consulta-resultado" role="status">
      <h3>Turno ${escapeHtml(turnoLabel(resultado.turno))}</h3>
      <p>Fecha <strong>${escapeHtml(resultado.fecha)}</strong></p>
      ${renderHorario(resultado.horario, resultado.fecha)}
      ${proyeccion}
    </section>
  `
}

/**
 * Pantalla (a): consulta de turno por fecha específica sobre el motor portado.
 * Contrato `frontend.md` §3.4/§5.2/§6.2. Sin `loading` (cálculo síncrono, Q1).
 */
export function renderConsultaView(rootElement, state = {}) {
  if (!rootElement) {
    return
  }

  const {
    resultado = null,
    error = null,
    fecha = '',
    onConsultar,
    onVolverAlMenu,
    onCambiarReferencia,
  } = state

  rootElement.innerHTML = `
    <section class="consulta">
      <div class="section-head">
        <span class="card-icon">${icon('search')}</span>
        <div class="section-heading">
          <h2>Consulta de turno</h2>
          <p class="consulta-hint">
            Selecciona una fecha para ver el turno teórico proyectado (solo lectura).
          </p>
        </div>
      </div>
      <form id="consulta-form" class="consulta-form">
        <label>Fecha
          <input id="consulta-fecha" name="fecha" type="date" min="0001-01-01" max="9999-12-31"
            value="${escapeHtml(fecha)}" required>
        </label>
        <button id="consulta-enviar" type="submit" class="btn btn-primary">Consultar</button>
      </form>
      <p id="consulta-error" class="consulta-error" role="alert"${error ? '' : ' hidden'}>${escapeHtml(error ?? '')}</p>
      ${renderResultado(resultado)}
      <div class="pantalla-nav">
        <button id="consulta-volver-menu" type="button" class="btn btn-ghost">Volver al menú</button>
        <button type="button" class="btn btn-ghost">Cambiar referencia</button>
      </div>
    </section>
  `

  rootElement.querySelector('#consulta-form')?.addEventListener('submit', (event) => {
    event.preventDefault()
    onConsultar?.({ fecha: rootElement.querySelector('#consulta-fecha')?.value })
  })
  rootElement.querySelector('#consulta-volver-menu')?.addEventListener('click', () => onVolverAlMenu?.())
  rootElement
    .querySelector('.pantalla-nav button:not(#consulta-volver-menu)')
    ?.addEventListener('click', () => onCambiarReferencia?.())
}
