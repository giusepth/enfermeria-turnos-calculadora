/**
 * Estado de la SPA en memoria — `design/data-model.md` §1 (ADR-F13-003).
 *
 * Único estado: la referencia (fecha + turno), perdida al recargar la página
 * (Q2, deseado). Prohibida toda API de almacenamiento del navegador, red y
 * export/import (verificable por grep de SC-F13-005 y por `state.test.js`).
 */
import { esDayStringValido } from '../services/engine/dates.js'

const MSG_FECHA = 'Introduce una fecha de referencia válida (AAAA-MM-DD).'
const MSG_TURNO = 'Elige el turno de referencia: Diurno o Nocturno.'

/** Turnos admitidos como referencia (supuesto 1 de la spec; herencia F04). */
const TURNOS_REFERENCIA = ['diurno', 'nocturno']

let referencia = null

/** Referencia vigente o `null` (pantalla `sin-referencia`). */
export function getReferencia() {
  return referencia
}

/**
 * Establece la única referencia. Valida antes de mutar: inválida ⇒
 * `{ok: false, error}` y el estado queda intacto (HU-S01 CA 3, RNF-12).
 */
export function setReferencia({ fecha, turno } = {}) {
  if (!esDayStringValido(fecha)) {
    return { ok: false, error: MSG_FECHA }
  }
  if (!TURNOS_REFERENCIA.includes(turno)) {
    return { ok: false, error: MSG_TURNO }
  }
  referencia = { fecha, turno }
  return { ok: true }
}

/** Deja el estado inicial («Cambiar referencia» ≡ recargar). */
export function clearReferencia() {
  referencia = null
}
