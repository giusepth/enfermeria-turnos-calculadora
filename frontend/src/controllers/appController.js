import { clearReferencia, getReferencia, setReferencia } from '../models/state.js'
import { renderHomeView } from '../views/homeView.js'
import { renderMenuView } from '../views/menuView.js'
import { renderReferenciaView } from '../views/referenciaView.js'
import { createCalendarioController } from './calendarioController.js'
import { createConsultaController } from './consultaController.js'

/**
 * Máquina de estados del flujo (ADR-F13-004, `frontend.md` §2):
 * `sin-referencia → menu → fecha | mes`, con «Volver al menú» y
 * «Cambiar referencia» (limpia el estado ≡ recargar, sin persistencia).
 */
const PANELES = {
  'sin-referencia': 'referencia-panel',
  menu: 'menu-panel',
  fecha: 'consulta-panel',
  mes: 'calendario-panel',
}

const REFERENCIA_INICIAL = { fecha: '', turno: 'diurno', error: null }

export function createAppController(rootElement) {
  let pantalla = 'sin-referencia'
  let referenciaForm = { ...REFERENCIA_INICIAL }

  const consultaController = createConsultaController({
    onVolverAlMenu,
    onCambiarReferencia: cambiarReferencia,
  })
  const calendarioController = createCalendarioController({
    onVolverAlMenu,
    onCambiarReferencia: cambiarReferencia,
  })

  function irAFecha() {
    pantalla = 'fecha'
    render()
  }

  function irAMes() {
    pantalla = 'mes'
    render()
  }

  function onVolverAlMenu() {
    pantalla = 'menu'
    render()
  }

  function cambiarReferencia() {
    clearReferencia()
    referenciaForm = { ...REFERENCIA_INICIAL }
    pantalla = 'sin-referencia'
    render()
  }

  function establecerReferencia({ fecha, turno } = {}) {
    const resultado = setReferencia({ fecha, turno })
    if (!resultado.ok) {
      // HU-S01 CA 3: no se fija la referencia y el formulario conserva los valores.
      referenciaForm = { fecha: fecha ?? '', turno: turno ?? 'diurno', error: resultado.error }
      pantalla = 'sin-referencia'
      render()
      return
    }
    referenciaForm = { ...REFERENCIA_INICIAL }
    pantalla = 'menu'
    render()
  }

  function render() {
    renderHomeView(rootElement, { estado: pantalla, referencia: getReferencia() })
    const panel = rootElement.querySelector(`#${PANELES[pantalla]}`)
    if (!panel) {
      return
    }
    if (pantalla === 'sin-referencia') {
      renderReferenciaView(panel, { ...referenciaForm, onSubmit: establecerReferencia })
    } else if (pantalla === 'menu') {
      renderMenuView(panel, {
        onIrAFecha: irAFecha,
        onIrAMes: irAMes,
        onCambiarReferencia: cambiarReferencia,
      })
    } else if (pantalla === 'fecha') {
      consultaController.start(panel)
    } else if (pantalla === 'mes') {
      calendarioController.start(panel)
    }
  }

  return {
    render,
    start() {
      render()
    },
  }
}
