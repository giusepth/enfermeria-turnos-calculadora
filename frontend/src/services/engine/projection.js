/**
 * Proyección por fecha y por mes — contrato `engine.md` §2.3 (RN-13).
 *
 * Composición de F04/F05 para una referencia única: `fecha < ref.fecha` ⇒
 * `sinInformacion` (el día de la referencia sí se calcula, inclusivo). Una
 * única ruta de cálculo: `proyectarMes` delega día por día en `proyectarDia`.
 */
import { diasEntre, rangoMes, sumarDias } from './dates.js'
import { horarioParaTurno, turnoParaFecha } from './sequence.js'

export { rangoMes }

/**
 * Proyección de un día. Nunca infiere turno (RN-13): sin información ⇒
 * `turno`, `horario` en `null`, `esProyeccion` en `false`.
 */
export function proyectarDia(fecha, ref) {
  if (diasEntre(ref.fecha, fecha) < 0) {
    return { fecha, turno: null, horario: null, sinInformacion: true, esProyeccion: false }
  }
  const turno = turnoParaFecha(fecha, ref)
  return {
    fecha,
    turno,
    horario: horarioParaTurno(turno, fecha),
    sinInformacion: false,
    esProyeccion: true,
  }
}

/**
 * Lista del mes (28–31 filas, orden ascendente), una ruta de cálculo
 * delegando en `proyectarDia`. Lanza `Error` si `year`/`month` son inválidos.
 */
export function proyectarMes(year, month, ref) {
  const { primero, dias } = rangoMes(year, month)
  const resultado = []
  for (let offset = 0; offset < dias; offset += 1) {
    resultado.push(proyectarDia(sumarDias(primero, offset), ref))
  }
  return resultado
}
