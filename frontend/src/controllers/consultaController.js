/**
 * Controlador de la opción (a): consulta por fecha.
 * Consume `models/state` + `services/engine` (sin red; Q1/Q2, RNF-02).
 * Errores de entrada/motor traducidos a mensajes de UI (RNF-12, `frontend.md` §6.2).
 */
import { getReferencia } from '../models/state.js'
import { esDayStringValido, proyectarDia } from '../services/engine/index.js'
import { renderConsultaView } from '../views/consultaView.js'

const MSG_FECHA_INVALIDA = 'Introduce una fecha válida (AAAA-MM-DD).'
const MSG_ERROR_INTERNO = 'No se pudo calcular la proyección. Revisa los datos e inténtalo de nuevo.'

export function createConsultaController({ onVolverAlMenu, onCambiarReferencia } = {}) {
  let rootElement = null
  let state = { fecha: '', resultado: null, error: null }

  function render() {
    renderConsultaView(rootElement, {
      ...state,
      onConsultar: consultar,
      onVolverAlMenu,
      onCambiarReferencia,
    })
  }

  function consultar({ fecha } = {}) {
    const dia = fecha ?? state.fecha
    try {
      if (!esDayStringValido(dia)) {
        state = { fecha: dia, resultado: null, error: MSG_FECHA_INVALIDA }
      } else {
        state = { fecha: dia, resultado: proyectarDia(dia, getReferencia()), error: null }
      }
    } catch {
      state = { fecha: dia, resultado: null, error: MSG_ERROR_INTERNO }
    }
    render()
    return state
  }

  return {
    start(mountElement) {
      rootElement = mountElement
      // Estado efímero de UI: se pierde al navegar (data-model.md §2).
      state = { fecha: '', resultado: null, error: null }
      render()
    },
    consultar,
  }
}
