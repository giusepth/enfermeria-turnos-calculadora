/**
 * Suite de paridad de secuencia y horarios (T1302) — casos P-07…P-19 de
 * `design/contracts/engine.md` §3.2 (port 1:1 de `backend/tests/test_sequence.py`).
 *
 * Normativa Q6/ADR-F13-007: si el port discrepa de la tabla, el port está mal.
 */
import { describe, expect, it } from 'vitest'

import { SECUENCIA, horarioParaTurno, turnoParaFecha } from '../sequence.js'

const REF_DIURNO = { fecha: '2026-10-01', turno: 'diurno' }
const REF_NOCTURNO = { fecha: '2026-10-01', turno: 'nocturno' }

describe('SECUENCIA (RN-01)', () => {
  it('es ["diurno","nocturno","posturno","libre"]', () => {
    expect(SECUENCIA).toEqual(['diurno', 'nocturno', 'posturno', 'libre'])
  })
})

describe('turnoParaFecha (P-07…P-13)', () => {
  it('P-07: canónico diurno (ref 2026-10-01/diurno)', () => {
    const esperado = {
      '2026-10-01': 'diurno',
      '2026-10-02': 'nocturno',
      '2026-10-03': 'posturno',
      '2026-10-04': 'libre',
      '2026-10-05': 'diurno',
    }
    for (const [fecha, turno] of Object.entries(esperado)) {
      expect(turnoParaFecha(fecha, REF_DIURNO), fecha).toBe(turno)
    }
  })

  it('P-08: canónico nocturno (ref 2026-10-01/nocturno)', () => {
    const esperado = ['nocturno', 'posturno', 'libre', 'diurno', 'nocturno']
    esperado.forEach((turno, offset) => {
      const fecha = sumarOffset('2026-10-01', offset)
      expect(turnoParaFecha(fecha, REF_NOCTURNO), fecha).toBe(turno)
    })
  })

  it('P-09: repetición 48 días coincide con SECUENCIA[dias % 4] (RN-06)', () => {
    for (let dias = 0; dias < 48; dias += 1) {
      const fecha = sumarOffset('2026-10-01', dias)
      expect(turnoParaFecha(fecha, REF_DIURNO), fecha).toBe(SECUENCIA[dias % 4])
    }
  })

  it('P-10: cruce de mes — 2026-11-01 (31 días) = SECUENCIA[31 % 4]', () => {
    // 31 % 4 = 3 → "libre". El literal «nocturno» de la fila P-10 de la tabla es un
    // error de transcripción (contradice su propia fórmula y a
    // `test_consulta_api.py::test_t501_borde_de_cambio_de_mes`, que afirma "libre").
    expect(turnoParaFecha('2026-11-01', REF_DIURNO)).toBe(SECUENCIA[31 % 4])
    expect(turnoParaFecha('2026-11-01', REF_DIURNO)).toBe('libre')
  })

  it('P-11: cruce de año (ref 2026-12-31/diurno)', () => {
    const ref = { fecha: '2026-12-31', turno: 'diurno' }
    expect(turnoParaFecha('2026-12-31', ref)).toBe('diurno')
    expect(turnoParaFecha('2027-01-01', ref)).toBe('nocturno')
    expect(turnoParaFecha('2027-01-02', ref)).toBe('posturno')
  })

  it('P-12: borde cambio de mes (ref 2026-10-31/diurno)', () => {
    const ref = { fecha: '2026-10-31', turno: 'diurno' }
    expect(turnoParaFecha('2026-11-01', ref)).toBe('nocturno')
    expect(turnoParaFecha('2026-11-02', ref)).toBe('posturno')
  })

  it('P-13: febrero bisiesto (ref 2028-02-28/diurno)', () => {
    const ref = { fecha: '2028-02-28', turno: 'diurno' }
    expect(turnoParaFecha('2028-02-28', ref)).toBe('diurno')
    expect(turnoParaFecha('2028-02-29', ref)).toBe('nocturno')
    expect(turnoParaFecha('2028-03-01', ref)).toBe('posturno')
  })

  it('P-19: turno de referencia fuera del catálogo lanza Error', () => {
    // Paridad con el `ValueError` de Python: solo se rechaza lo que no está en
    // SECUENCIA. La restricción de referencia a {diurno, nocturno} la valida
    // `models/state.js`, no el motor (contrato engine.md §1.3).
    expect(() => turnoParaFecha('2026-10-01', { fecha: '2026-10-01', turno: 'mañana' })).toThrow(
      Error,
    )
    expect(() =>
      turnoParaFecha('2026-10-01', { fecha: '2026-10-01', turno: 'DIURNO' }),
    ).toThrow(Error)
    expect(() => turnoParaFecha('2026-10-01', { fecha: '2026-10-01', turno: '' })).toThrow(Error)
  })
})

describe('horarioParaTurno (P-14…P-19)', () => {
  it('P-14: diurno 07:00–19:00 de la misma fecha (RN-02)', () => {
    expect(horarioParaTurno('diurno', '2026-10-01')).toEqual({
      inicio: '2026-10-01T07:00:00',
      fin: '2026-10-01T19:00:00',
    })
  })

  it('P-15: nocturno cruza medianoche (RN-03)', () => {
    expect(horarioParaTurno('nocturno', '2026-10-01')).toEqual({
      inicio: '2026-10-01T19:00:00',
      fin: '2026-10-02T07:00:00',
    })
  })

  it('P-16: nocturno 9999-12-31 ⇒ fin null, sin error y sin clamp (ADR-F06-009)', () => {
    expect(horarioParaTurno('nocturno', '9999-12-31')).toEqual({
      inicio: '9999-12-31T19:00:00',
      fin: null,
    })
  })

  it('P-17: posturno 07:00 hasta el final del día (RN-04/RN-05)', () => {
    expect(horarioParaTurno('posturno', '2026-10-02')).toEqual({
      inicio: '2026-10-02T07:00:00',
      fin: '2026-10-02T23:59:59',
    })
  })

  it('P-18: libre sin horario (RN-05)', () => {
    expect(horarioParaTurno('libre', '2026-10-04')).toBeNull()
  })

  it('P-19: turno fuera del catálogo lanza Error', () => {
    expect(() => horarioParaTurno('DIURNO', '2026-10-01')).toThrow(Error)
    expect(() => horarioParaTurno('mañana', '2026-10-01')).toThrow(Error)
    expect(() => horarioParaTurno('', '2026-10-01')).toThrow(Error)
  })
})

/** Suma `offset` días a un DayString sin depender del módulo de fechas (aislamiento del test). */
function sumarOffset(fecha, offset) {
  const [anio, mes, dia] = fecha.split('-').map(Number)
  const base = Date.UTC(anio, mes - 1, dia)
  const d = new Date(base + offset * 86400000)
  const y = String(d.getUTCFullYear()).padStart(4, '0')
  const m = String(d.getUTCMonth() + 1).padStart(2, '0')
  const day = String(d.getUTCDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}
