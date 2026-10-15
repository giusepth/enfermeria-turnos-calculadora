import { icon } from '../ui/icons.js'

/**
 * Menú de opciones (Q2/ADR-F13-004): (a) turno por fecha específica o
 * (b) lista de turnos de un mes específico. Contrato `frontend.md` §3.3.
 */
export function renderMenuView(rootElement, state = {}) {
  if (!rootElement) {
    return
  }

  const { onIrAFecha, onIrAMes, onCambiarReferencia } = state

  rootElement.innerHTML = `
    <section class="card">
      <div class="card-head">
        <span class="card-icon">${icon('search')}</span>
        <div class="card-heading">
          <h2 class="card-title">Menú de opciones</h2>
          <p class="card-desc">Elige qué quieres estimar con la referencia vigente.</p>
        </div>
      </div>
      <nav id="menu-opciones" class="menu-opciones">
        <button id="menu-fecha" type="button" class="btn btn-primary">Turno por fecha específica</button>
        <button id="menu-mes" type="button" class="btn btn-primary">Lista de turnos de un mes específico</button>
      </nav>
      <button id="menu-cambiar-referencia" type="button" class="btn btn-ghost">Cambiar referencia</button>
    </section>
  `

  rootElement.querySelector('#menu-fecha')?.addEventListener('click', () => onIrAFecha?.())
  rootElement.querySelector('#menu-mes')?.addEventListener('click', () => onIrAMes?.())
  rootElement
    .querySelector('#menu-cambiar-referencia')
    ?.addEventListener('click', () => onCambiarReferencia?.())
}
