/**
 * Controlador de la opción (b): lista de turnos de un mes.
 * Consume `models/state` + `services/engine` (sin red; Q1/Q2, RNF-02).
 * Errores de entrada/motor traducidos a mensajes de UI (RNF-12, `frontend.md` §6.2).
 */
import { getReferencia } from '../models/state.js'
import { proyectarMes } from '../services/engine/index.js'
import { renderCalendarioView } from '../views/calendarioView.js'

const MSG_RANGO = 'Introduce un mes (1-12) y un año entre 1 y 9999.'
const MSG_ERROR_INTERNO = 'No se pudo calcular la proyección. Revisa los datos e inténtalo de nuevo.'

function mesActual() {
  return new Date().getMonth() + 1
}

function anioActual() {
  return new Date().getFullYear()
}

export function createCalendarioController({ onVolverAlMenu, onCambiarReferencia } = {}) {
  let rootElement = null
  let state = { year: anioActual(), month: mesActual(), calendario: null, error: null }

  function render() {
    renderCalendarioView(rootElement, {
      ...state,
      onVerMes: verMes,
      onVolverAlMenu,
      onCambiarReferencia,
    })
  }

  function verMes({ year, month } = {}) {
    const anio = Number(year)
    const mes = Number(month)
    const esRangoValido =
      Number.isInteger(anio) && anio >= 1 && anio <= 9999 && Number.isInteger(mes) && mes >= 1 && mes <= 12

    try {
      if (!esRangoValido) {
        state = { year: anio, month: mes, calendario: null, error: MSG_RANGO }
      } else {
        state = {
          year: anio,
          month: mes,
          calendario: { year: anio, month: mes, dias: proyectarMes(anio, mes, getReferencia()) },
          error: null,
        }
      }
    } catch {
      state = { year: anio, month: mes, calendario: null, error: MSG_ERROR_INTERNO }
    }
    render()
    return state
  }

  return {
    start(mountElement) {
      rootElement = mountElement
      // Estado efímero de UI: se pierde al navegar (data-model.md §2).
      state = { year: anioActual(), month: mesActual(), calendario: null, error: null }
      render()
    },
    verMes,
  }
}
