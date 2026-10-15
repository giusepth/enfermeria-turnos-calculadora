/**
 * Secuencia y horarios del motor — contrato `engine.md` §2.2 (RN-01..RN-06).
 *
 * Determinista: `(indice(ref.turno) + diasEntre(ref.fecha, fecha)) % 4` sobre
 * `SECUENCIA`, sin secuencia precalculada (RF-T05). Sin estado, sin `Date`.
 */
import { diasEntre, sumarDias } from './dates.js'

/** Orden canónico de la secuencia ordinaria (RN-01). */
export const SECUENCIA = ['diurno', 'nocturno', 'posturno', 'libre']

const CICLO = SECUENCIA.length

function indiceDeTurno(turno) {
  const indice = SECUENCIA.indexOf(turno)
  if (indice === -1) {
    throw new Error(`turno fuera del catálogo: ${String(turno)}`)
  }
  return indice
}

/**
 * Turno de `fecha` según la secuencia desde la referencia única (RN-06).
 * No aplica RN-13 (eso es `proyectarDia`).
 */
export function turnoParaFecha(fecha, ref) {
  const indice = indiceDeTurno(ref.turno)
  const dias = diasEntre(ref.fecha, fecha)
  return SECUENCIA[((indice + dias) % CICLO + CICLO) % CICLO]
}

/**
 * Horario del turno para su fecha asignada (RN-02..RN-05), o `null` si es `libre`.
 *
 * - diurno: `fecha 07:00` → `fecha 19:00`.
 * - nocturno: `fecha 19:00` → `fecha+1 07:00` (cruza medianoche). En el borde
 *   `fecha === '9999-12-31'` el fin es irrepresentable: se devuelve
 *   `fin = null` conservando `inicio` (ADR-F06-009 / ADR-F13-006, Q11).
 *   Nunca excepción, nunca clamp a `23:59:59`.
 * - posturno: `fecha 07:00` → fin del día calendario `fecha` (`23:59:59`).
 * - libre: sin turno ordinario (`null`, RN-05).
 */
export function horarioParaTurno(turno, fecha) {
  indiceDeTurno(turno)
  if (turno === 'diurno') {
    return { inicio: `${fecha}T07:00:00`, fin: `${fecha}T19:00:00` }
  }
  if (turno === 'nocturno') {
    return {
      inicio: `${fecha}T19:00:00`,
      fin: fecha === '9999-12-31' ? null : `${sumarDias(fecha, 1)}T07:00:00`,
    }
  }
  if (turno === 'posturno') {
    return { inicio: `${fecha}T07:00:00`, fin: `${fecha}T23:59:59` }
  }
  return null
}
