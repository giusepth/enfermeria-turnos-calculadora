import { diaDeLaSemana } from '../services/engine/index.js'
import { escapeHtml } from '../ui/escapeHtml.js'
import { icon } from '../ui/icons.js'
import { formatearHorario, turnoLabel } from './consultaView.js'

const MESES = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
]

// 0 = domingo (orden de `Date.prototype.getDay`, ADR-F06-007-equivalente).
const DIAS_SEMANA = ['D', 'L', 'M', 'X', 'J', 'V', 'S']

function renderSelectorMeses(mes) {
  return MESES.map(
    (etiqueta, indice) =>
      `<option value="${indice + 1}"${indice + 1 === mes ? ' selected' : ''}>${etiqueta}</option>`,
  ).join('')
}

function renderFila(dia) {
  const diaSemana = DIAS_SEMANA[diaDeLaSemana(dia.fecha)]
  if (dia.sinInformacion) {
    return `
      <tr class="calendario-dia sin-informacion">
        <td>${escapeHtml(dia.fecha)}</td>
        <td>${escapeHtml(diaSemana)}</td>
        <td>Sin información suficiente</td>
        <td></td>
      </tr>
    `
  }

  return `
    <tr class="calendario-dia turno-${escapeHtml(dia.turno)}">
      <td>${escapeHtml(dia.fecha)}</td>
      <td>${escapeHtml(diaSemana)}</td>
      <td>${escapeHtml(turnoLabel(dia.turno))}</td>
      <td>${escapeHtml(formatearHorario(dia.horario, dia.fecha))}</td>
    </tr>
  `
}

function renderTabla(calendario) {
  if (!calendario) {
    return ''
  }

  return `
    <p id="calendario-proyeccion" class="calendario-proyeccion">Proyección teórica</p>
    <div class="table-scroll">
      <table id="calendario-tabla">
        <thead>
          <tr><th>Fecha</th><th>Día</th><th>Turno</th><th>Horario</th></tr>
        </thead>
        <tbody>
          ${calendario.dias.map(renderFila).join('')}
        </tbody>
      </table>
    </div>
  `
}

/**
 * Pantalla (b): lista de turnos de un mes específico sobre el motor portado.
 * Contrato `frontend.md` §3.5/§5.2/§6.2. `#calendario-anio` numérico 1–9999
 * (ADR-F13-009); sin `loading` (cálculo síncrono, Q1).
 */
export function renderCalendarioView(rootElement, state = {}) {
  if (!rootElement) {
    return
  }

  const {
    year,
    month,
    calendario = null,
    error = null,
    onVerMes,
    onVolverAlMenu,
    onCambiarReferencia,
  } = state

  rootElement.innerHTML = `
    <section class="calendario">
      <div class="section-head">
        <span class="card-icon">${icon('calendar')}</span>
        <div class="section-heading">
          <h2>Lista de turnos de un mes</h2>
          <p class="calendario-hint">
            Selecciona un mes y un año para ver la proyección de cada día (solo lectura).
          </p>
        </div>
      </div>
      <form id="calendario-form" class="calendario-form">
        <label>Mes
          <select id="calendario-mes" name="mes">${renderSelectorMeses(month)}</select>
        </label>
        <label>Año
          <input id="calendario-anio" name="anio" type="number" min="1" max="9999" step="1"
            value="${escapeHtml(year ?? '')}">
        </label>
        <button id="calendario-ver" type="submit" class="btn btn-primary">Ver mes</button>
      </form>
      <p id="calendario-error" class="calendario-error" role="alert"${error ? '' : ' hidden'}>${escapeHtml(error ?? '')}</p>
      ${renderTabla(calendario)}
      <div class="pantalla-nav">
        <button id="calendario-volver-menu" type="button" class="btn btn-ghost">Volver al menú</button>
        <button type="button" class="btn btn-ghost">Cambiar referencia</button>
      </div>
    </section>
  `

  rootElement.querySelector('#calendario-form')?.addEventListener('submit', (event) => {
    event.preventDefault()
    onVerMes?.({
      year: Number(rootElement.querySelector('#calendario-anio')?.value),
      month: Number(rootElement.querySelector('#calendario-mes')?.value),
    })
  })
  rootElement
    .querySelector('#calendario-volver-menu')
    ?.addEventListener('click', () => onVolverAlMenu?.())
  rootElement
    .querySelector('.pantalla-nav button:not(#calendario-volver-menu)')
    ?.addEventListener('click', () => onCambiarReferencia?.())
}
