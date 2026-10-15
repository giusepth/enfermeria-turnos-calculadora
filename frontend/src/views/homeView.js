import { escapeHtml } from '../ui/escapeHtml.js'
import { icon } from '../ui/icons.js'
import { renderAvisoProyeccion } from '../ui/avisoProyeccion.js'

/** Pantalla activa → id del panel (contrato `frontend.md` §2/§3). */
const PANELES = {
  'sin-referencia': 'referencia-panel',
  menu: 'menu-panel',
  fecha: 'consulta-panel',
  mes: 'calendario-panel',
}

const TURNO_LABELS = {
  diurno: 'Diurno',
  nocturno: 'Nocturno',
  posturno: 'Posturno',
  libre: 'Libre',
}

function renderResumen(referencia) {
  if (!referencia) {
    return ''
  }
  const turno = TURNO_LABELS[referencia.turno] ?? referencia.turno
  return `<p id="referencia-resumen" class="card-desc">Referencia vigente: <strong>${escapeHtml(
    referencia.fecha,
  )}</strong> · ${escapeHtml(turno)}</p>`
}

/**
 * Shell Bento (F12) de la SPA: cabecera, advertencia estática (#aviso-proyeccion),
 * resumen de la referencia (solo menú/fecha/mes) y el panel de la pantalla activa.
 */
export function renderHomeView(rootElement, { estado = 'sin-referencia', referencia = null } = {}) {
  if (!rootElement) {
    return
  }

  const panelId = PANELES[estado] ?? PANELES['sin-referencia']
  const resumen = estado === 'sin-referencia' ? '' : renderResumen(referencia)

  rootElement.innerHTML = `
    <div class="app-frame">
      <header class="app-bar">
        <div class="app-bar-inner">
          <div class="brand">
            <span class="brand-mark" aria-hidden="true"></span>
            <h1 class="brand-name">Turnos Calculador</h1>
          </div>
          <p class="app-tagline">Estimación de turnos de enfermería por proyección teórica.</p>
        </div>
      </header>
      <main class="app-shell bg-fondo">
        <div id="app-shell">
          ${renderAvisoProyeccion()}
          ${resumen}
          <div class="bento-grid">
            <section id="${panelId}" class="xl:col-span-12"></section>
          </div>
        </div>
      </main>
    </div>
  `
}
