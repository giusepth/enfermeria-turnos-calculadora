/**
 * Suite de fechas del motor (T1301) — casos P-01…P-06 de `design/contracts/engine.md` §3.1.
 *
 * Normativa Q6: cada fila de la tabla de paridad tiene su assert 1:1.
 * RNF-13/ADR-F13-002: día calendario `DayString` sin desfase UTC ni `Date` local.
 */
import { describe, expect, it } from 'vitest'

import {
  diaDeLaSemana,
  diasEntre,
  esDayStringValido,
  formatDay,
  parseDay,
  rangoMes,
  sumarDias,
} from '../dates.js'

describe('esDayStringValido', () => {
  it('acepta días reales en formato YYYY-MM-DD canónico', () => {
    expect(esDayStringValido('2026-10-01')).toBe(true)
    expect(esDayStringValido('0001-01-01')).toBe(true)
    expect(esDayStringValido('9999-12-31')).toBe(true)
  })

  it('acepta 2028-02-29 (bisiesto) y rechaza 2026-02-29', () => {
    expect(esDayStringValido('2028-02-29')).toBe(true)
    expect(esDayStringValido('2026-02-29')).toBe(false)
  })

  it('rechaza fechas mal formadas o no representables', () => {
    expect(esDayStringValido('2026-13-01')).toBe(false)
    expect(esDayStringValido('2026-00-10')).toBe(false)
    expect(esDayStringValido('2026-04-31')).toBe(false)
    expect(esDayStringValido('2026-1-01')).toBe(false)
    expect(esDayStringValido('10000-01-01')).toBe(false)
    expect(esDayStringValido('0000-01-01')).toBe(false)
    expect(esDayStringValido('20261001')).toBe(false)
    expect(esDayStringValido('2026-10-1')).toBe(false)
    expect(esDayStringValido('')).toBe(false)
  })
})

describe('parseDay / formatDay', () => {
  it('descompone y recompone un DayString (inversas)', () => {
    expect(parseDay('2026-10-01')).toEqual({ anio: 2026, mes: 10, dia: 1 })
    expect(formatDay({ anio: 2026, mes: 10, dia: 1 })).toBe('2026-10-01')
    expect(formatDay(parseDay('0001-01-01'))).toBe('0001-01-01')
    expect(formatDay(parseDay('9999-12-31'))).toBe('9999-12-31')
    expect(formatDay(parseDay('2028-02-29'))).toBe('2028-02-29')
  })

  it('parseDay lanza Error con DayString inválido', () => {
    expect(() => parseDay('2026-02-30')).toThrow(Error)
    expect(() => parseDay('no-es-fecha')).toThrow(Error)
    expect(() => parseDay('10000-01-01')).toThrow(Error)
  })
})

describe('diasEntre / sumarDias', () => {
  it('diferencia en días calendario b - a, sin desfase (RNF-13)', () => {
    expect(diasEntre('2026-10-01', '2026-10-01')).toBe(0)
    expect(diasEntre('2026-10-01', '2026-11-01')).toBe(31)
    expect(diasEntre('2026-10-01', '2026-12-31')).toBe(91)
    expect(diasEntre('2026-10-01', '2026-09-30')).toBe(-1)
    expect(diasEntre('2026-12-31', '2027-01-01')).toBe(1)
    expect(diasEntre('2028-02-28', '2028-02-29')).toBe(1)
    expect(diasEntre('2028-02-29', '2028-03-01')).toBe(1)
    expect(diasEntre('2026-10-01', '9999-12-31')).toBe(2912169)
  })

  it('sumarDias es el único camino de paso de mes/año', () => {
    expect(sumarDias('2026-10-31', 1)).toBe('2026-11-01')
    expect(sumarDias('2026-12-31', 1)).toBe('2027-01-01')
    expect(sumarDias('2028-02-28', 1)).toBe('2028-02-29')
    expect(sumarDias('2026-03-01', -1)).toBe('2026-02-28')
    expect(sumarDias('2026-10-01', 0)).toBe('2026-10-01')
    expect(sumarDias('0001-01-31', 1)).toBe('0001-02-01')
    expect(sumarDias('9999-12-31', 0)).toBe('9999-12-31')
  })
})

describe('diaDeLaSemana', () => {
  it('devuelve 0 = domingo (paridad con Date.prototype.getDay)', () => {
    expect(diaDeLaSemana('2026-10-04')).toBe(0) // domingo
    expect(diaDeLaSemana('2026-10-01')).toBe(4) // jueves
    expect(diaDeLaSemana('2028-02-29')).toBe(2) // martes
    expect(diaDeLaSemana('0001-01-01')).toBe(1) // lunes
    expect(diaDeLaSemana('9999-12-31')).toBe(5) // viernes
  })
})

describe('rangoMes (P-01…P-06)', () => {
  it('P-01: rangoMes(2026, 10) = 2026-10-01..2026-10-31 (31 días)', () => {
    expect(rangoMes(2026, 10)).toEqual({ primero: '2026-10-01', ultimo: '2026-10-31', dias: 31 })
  })

  it('P-02: rangoMes(2026, 12) = 2026-12-01..2026-12-31 (31 días, rama especial de diciembre)', () => {
    expect(rangoMes(2026, 12)).toEqual({ primero: '2026-12-01', ultimo: '2026-12-31', dias: 31 })
  })

  it('P-03: rangoMes(1, 1) y rangoMes(1, 12) en el límite inferior', () => {
    expect(rangoMes(1, 1)).toEqual({ primero: '0001-01-01', ultimo: '0001-01-31', dias: 31 })
    expect(rangoMes(1, 12)).toEqual({ primero: '0001-12-01', ultimo: '0001-12-31', dias: 31 })
  })

  it('P-04: rangoMes(9999, 11) y rangoMes(9999, 12) sin desbordar a año 10000', () => {
    expect(rangoMes(9999, 11)).toEqual({ primero: '9999-11-01', ultimo: '9999-11-30', dias: 30 })
    expect(rangoMes(9999, 12)).toEqual({ primero: '9999-12-01', ultimo: '9999-12-31', dias: 31 })
  })

  it('P-05: febrero bisiesto — 2026-02 = 28 días y 2028-02 = 29 días', () => {
    expect(rangoMes(2026, 2)).toEqual({ primero: '2026-02-01', ultimo: '2026-02-28', dias: 28 })
    expect(rangoMes(2028, 2)).toEqual({ primero: '2028-02-01', ultimo: '2028-02-29', dias: 29 })
  })

  it('P-06: entradas inválidas lanzan Error', () => {
    expect(() => rangoMes(0, 1)).toThrow(Error)
    expect(() => rangoMes(10000, 1)).toThrow(Error)
    expect(() => rangoMes(2026, 0)).toThrow(Error)
    expect(() => rangoMes(2026, 13)).toThrow(Error)
    expect(() => rangoMes(2026.5, 1)).toThrow(Error)
    expect(() => rangoMes(2026, '10')).toThrow(Error)
    expect(() => rangoMes('2026', 10)).toThrow(Error)
  })
})
