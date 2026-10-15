import { escapeHtml } from '../ui/escapeHtml.js'
import { icon } from '../ui/icons.js'

/**
 * Pantalla inicial: turno de referencia (fecha + diurno/nocturno).
 * Contrato `frontend.md` §3.2; errores de §6.2 en `#referencia-error`.
 */
export function renderReferenciaView(rootElement, state = {}) {
  if (!rootElement) {
    return
  }

  const { fecha = '', turno = 'diurno', error = null, onSubmit } = state

  rootElement.innerHTML = `
    <form id="referencia-form" class="card">
      <div class="card-head">
        <span class="card-icon">${icon('calendarPlus')}</span>
        <div class="card-heading">
          <h2 class="card-title">Turno de referencia</h2>
          <p class="card-desc">Indica el día y el turno desde el que se proyecta el ciclo.</p>
        </div>
      </div>
      <label>Fecha de referencia
        <input id="referencia-fecha" name="fecha" type="date" min="0001-01-01" max="9999-12-31" required
          value="${escapeHtml(fecha)}">
      </label>
      <label>Turno de referencia
        <select id="referencia-turno" name="turno">
          <option value="diurno"${turno === 'diurno' ? ' selected' : ''}>Diurno</option>
          <option value="nocturno"${turno === 'nocturno' ? ' selected' : ''}>Nocturno</option>
        </select>
      </label>
      <button id="referencia-enviar" type="submit" class="btn btn-primary">Fijar referencia</button>
      <p id="referencia-error" class="error" role="alert"${error ? '' : ' hidden'}>${escapeHtml(error ?? '')}</p>
    </form>
  `

  rootElement.querySelector('#referencia-form')?.addEventListener('submit', (event) => {
    event.preventDefault()
    onSubmit?.({
      fecha: rootElement.querySelector('#referencia-fecha')?.value ?? '',
      turno: rootElement.querySelector('#referencia-turno')?.value ?? '',
    })
  })
}
