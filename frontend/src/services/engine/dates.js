/**
 * Fechas `DayString` (YYYY-MM-DD) del motor — contrato `engine.md` §2.1.
 *
 * RNF-13 / ADR-F13-002: toda la aritmética es de días calendario con
 * aritmética pura de {anio, mes, dia}. Sin `Date` local, sin conversión de
 * zona y sin `new Date(iso)`. Sin desfase UTC posible.
 */

const REGEX_DAY = /^(\d{4})-(\d{2})-(\d{2})$/
const DIAS_POR_MES = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]
const ANIO_MIN = 1
const ANIO_MAX = 9999

/** Año bisiesto gregoriano (2028 sí, 1900 no, 2000 sí). */
function esBisiesto(anio) {
  return (anio % 4 === 0 && anio % 100 !== 0) || anio % 400 === 0
}

/** Días del mes `1..12` de `anio`. */
function diasDelMes(anio, mes) {
  if (mes === 2 && esBisiesto(anio)) {
    return 29
  }
  return DIAS_POR_MES[mes - 1]
}

function esEnteroEnRango(valor, min, max) {
  return Number.isInteger(valor) && valor >= min && valor <= max
}

/** Días desde la era civil (1970-01-01 = 0), sin `Date`. */
function diasDesdeCivil(anio, mes, dia) {
  const y = anio - (mes <= 2 ? 1 : 0)
  const era = Math.floor(y / 400)
  const yoe = y - era * 400
  const doy = Math.floor((153 * (mes + (mes > 2 ? -3 : 9)) + 2) / 5) + dia - 1
  const doe = yoe * 365 + Math.floor(yoe / 4) - Math.floor(yoe / 100) + doy
  return era * 146097 + doe - 719468
}

/** Inversa de `diasDesdeCivil`, sin `Date`. */
function civilDesdeDias(z) {
  const dias = z + 719468
  const era = Math.floor(dias / 146097)
  const doe = dias - era * 146097
  const yoe = Math.floor(
    (doe - Math.floor(doe / 1460) + Math.floor(doe / 36524) - Math.floor(doe / 146096)) / 365,
  )
  const y = yoe + era * 400
  const doy = doe - (365 * yoe + Math.floor(yoe / 4) - Math.floor(yoe / 100))
  const mp = Math.floor((5 * doy + 2) / 153)
  const dia = doy - Math.floor((153 * mp + 2) / 5) + 1
  const mes = mp + (mp < 10 ? 3 : -9)
  return { anio: mes <= 2 ? y + 1 : y, mes, dia }
}

function pad(valor, ancho) {
  return String(valor).padStart(ancho, '0')
}

/**
 * ¿`s` es un `DayString` válido (fecha real, `year ∈ [1, 9999]`)?
 * 2028-02-29 sí; 2026-02-29 no.
 */
export function esDayStringValido(s) {
  if (typeof s !== 'string') {
    return false
  }
  const partes = REGEX_DAY.exec(s)
  if (!partes) {
    return false
  }
  const anio = Number(partes[1])
  const mes = Number(partes[2])
  const dia = Number(partes[3])
  return (
    esEnteroEnRango(anio, ANIO_MIN, ANIO_MAX) &&
    esEnteroEnRango(mes, 1, 12) &&
    esEnteroEnRango(dia, 1, diasDelMes(anio, mes))
  )
}

/** Descompone un `DayString` válido. Lanza `Error` si no lo es. */
export function parseDay(s) {
  if (!esDayStringValido(s)) {
    throw new Error(`DayString inválido: ${String(s)}`)
  }
  const partes = REGEX_DAY.exec(s)
  return { anio: Number(partes[1]), mes: Number(partes[2]), dia: Number(partes[3]) }
}

/** Recompone `{anio, mes, dia}` en `DayString`. Inversa de `parseDay`. */
export function formatDay({ anio, mes, dia }) {
  if (
    !esEnteroEnRango(anio, ANIO_MIN, ANIO_MAX) ||
    !esEnteroEnRango(mes, 1, 12) ||
    !esEnteroEnRango(dia, 1, diasDelMes(anio, mes))
  ) {
    throw new Error(`Fecha no representable: ${anio}-${mes}-${dia}`)
  }
  return `${pad(anio, 4)}-${pad(mes, 2)}-${pad(dia, 2)}`
}

/** Diferencia en días calendario `b - a` (negativa si `b < a`). */
export function diasEntre(a, b) {
  const desde = parseDay(a)
  const hasta = parseDay(b)
  return (
    diasDesdeCivil(hasta.anio, hasta.mes, hasta.dia) -
    diasDesdeCivil(desde.anio, desde.mes, desde.dia)
  )
}

/** `d + n` días. Único camino para el paso de mes/año. */
export function sumarDias(d, n) {
  if (!Number.isInteger(n)) {
    throw new Error(`Desplazamiento no entero: ${String(n)}`)
  }
  const { anio, mes, dia } = parseDay(d)
  return formatDay(civilDesdeDias(diasDesdeCivil(anio, mes, dia) + n))
}

/** Día de la semana `0..6` con `0 = domingo` (paridad con `Date.prototype.getDay`). */
export function diaDeLaSemana(d) {
  const { anio, mes, dia } = parseDay(d)
  return (((diasDesdeCivil(anio, mes, dia) + 4) % 7) + 7) % 7
}

/**
 * Rango de un mes: `{primero, ultimo, dias}`. Valida `year ∈ [1, 9999]` y
 * `month ∈ [1, 12]`; lanza `Error` si no. Rama especial de diciembre (paridad
 * Python): `month === 12` ⇒ `ultimo = YYYY-12-31` sin calcular `year + 1`.
 */
export function rangoMes(year, month) {
  if (!esEnteroEnRango(year, ANIO_MIN, ANIO_MAX) || !esEnteroEnRango(month, 1, 12)) {
    throw new Error(`Mes/año fuera de rango: ${String(year)}-${String(month)}`)
  }
  const primero = formatDay({ anio: year, mes: month, dia: 1 })
  const ultimo =
    month === 12
      ? formatDay({ anio: year, mes: 12, dia: 31 })
      : formatDay({ anio: year, mes: month, dia: diasDelMes(year, month) })
  return { primero, ultimo, dias: diasEntre(primero, ultimo) + 1 }
}
