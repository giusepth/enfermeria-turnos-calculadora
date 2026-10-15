/**
 * Barrel del motor portado (ADR-F13-001) — único punto de import para
 * vistas/controladores. Contrato: `design/contracts/engine.md`.
 *
 * @typedef {`${number}-${number}-${number}`} DayString Día calendario `YYYY-MM-DD`.
 * @typedef {'diurno' | 'nocturno' | 'posturno' | 'libre'} Turno
 * @typedef {{ fecha: DayString, turno: 'diurno' | 'nocturno' }} Referencia
 * @typedef {{ inicio: string, fin: string | null }} Horario
 * @typedef {{
 *   fecha: DayString,
 *   turno: Turno | null,
 *   horario: Horario | null,
 *   sinInformacion: boolean,
 *   esProyeccion: boolean
 * }} ProyeccionDia
 * @typedef {{ year: number, month: number, dias: ProyeccionDia[] }} CalendarioMensual
 */
export {
  diaDeLaSemana,
  diasEntre,
  esDayStringValido,
  formatDay,
  parseDay,
  rangoMes,
  sumarDias,
} from './dates.js'
export { SECUENCIA, horarioParaTurno, turnoParaFecha } from './sequence.js'
export { proyectarDia, proyectarMes } from './projection.js'
