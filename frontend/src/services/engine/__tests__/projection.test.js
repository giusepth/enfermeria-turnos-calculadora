/**
 * Suite de paridad de proyección (T1303) — casos P-20…P-30 de
 * `design/contracts/engine.md` §3.3 (fuente: `test_consulta_api.py` y
 * `test_calendario_api.py`). Cada caso usa la **referencia exacta** de la tabla
 * (ADR-F13-007): febrero usa refs propias, no la canónica de octubre.
 */
import { describe, expect, it } from 'vitest'

import { proyectarDia, proyectarMes } from '../projection.js'

const REF_OCT = { fecha: '2026-10-01', turno: 'diurno' }

describe('proyectarDia (P-20, P-21, P-29, P-30)', () => {
  it('P-20: fecha previa a la referencia ⇒ sinInformacion (RN-13)', () => {
    expect(proyectarDia('2026-09-30', REF_OCT)).toEqual({
      fecha: '2026-09-30',
      turno: null,
      horario: null,
      sinInformacion: true,
      esProyeccion: false,
    })
  })

  it('P-21: el día de la referencia se calcula (inclusivo)', () => {
    expect(proyectarDia('2026-10-01', REF_OCT)).toEqual({
      fecha: '2026-10-01',
      turno: 'diurno',
      horario: { inicio: '2026-10-01T07:00:00', fin: '2026-10-01T19:00:00' },
      sinInformacion: false,
      esProyeccion: true,
    })
  })

  it('P-29: el turno libre proyecta horario null con esProyeccion true', () => {
    expect(proyectarDia('2026-10-04', REF_OCT)).toEqual({
      fecha: '2026-10-04',
      turno: 'libre',
      horario: null,
      sinInformacion: false,
      esProyeccion: true,
    })
  })

  it('P-30: los horarios se serializan YYYY-MM-DDTHH:MM:SS sin zona', () => {
    const noche = proyectarDia('2026-10-02', REF_OCT)
    expect(noche.horario).toEqual({
      inicio: '2026-10-02T19:00:00',
      fin: '2026-10-03T07:00:00',
    })
    const post = proyectarDia('2026-10-03', REF_OCT)
    expect(post.horario).toEqual({
      inicio: '2026-10-03T07:00:00',
      fin: '2026-10-03T23:59:59',
    })
    for (const dia of [noche, post]) {
      expect(dia.horario.inicio).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/)
      expect(dia.horario.fin).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/)
    }
    expect(proyectarDia('2026-10-02', REF_OCT).horario.fin.endsWith('Z')).toBe(false)
  })
})

describe('proyectarMes (P-22…P-28)', () => {
  it('P-22: octubre 2026 (ref 2026-10-01/diurno) — 31 filas, 31 → posturno', () => {
    const dias = proyectarMes(2026, 10, REF_OCT)
    expect(dias).toHaveLength(31)
    expect(dias[0].fecha).toBe('2026-10-01')
    expect(dias[30].fecha).toBe('2026-10-31')
    const porDia = Object.fromEntries(dias.map((d) => [d.fecha.slice(8), d.turno]))
    expect(porDia['01']).toBe('diurno')
    expect(porDia['02']).toBe('nocturno')
    expect(porDia['03']).toBe('posturno')
    expect(porDia['04']).toBe('libre')
    expect(porDia['05']).toBe('diurno')
    expect(porDia['31']).toBe('posturno')
  })

  it('P-23: diciembre 2026 (ref 2026-10-01/diurno) — 2026-12-31 → libre (corrección H-09)', () => {
    const dias = proyectarMes(2026, 12, REF_OCT)
    expect(dias).toHaveLength(31)
    const ultimo = dias[30]
    expect(ultimo).toEqual({
      fecha: '2026-12-31',
      turno: 'libre',
      horario: null,
      sinInformacion: false,
      esProyeccion: true,
    })
  })

  it('P-24: febrero 2026 (ref 2026-02-01/diurno) — 28 filas, 28 → libre', () => {
    const ref = { fecha: '2026-02-01', turno: 'diurno' }
    const dias = proyectarMes(2026, 2, ref)
    expect(dias).toHaveLength(28)
    expect(dias[0]).toMatchObject({ fecha: '2026-02-01', turno: 'diurno', sinInformacion: false })
    expect(dias[27]).toMatchObject({
      fecha: '2026-02-28',
      turno: 'libre',
      horario: null,
      esProyeccion: true,
    })
  })

  it('P-25: febrero 2028 (ref 2028-02-01/diurno) — 29 filas, 28→libre y 29→diurno', () => {
    const ref = { fecha: '2028-02-01', turno: 'diurno' }
    const dias = proyectarMes(2028, 2, ref)
    expect(dias).toHaveLength(29)
    expect(dias[26]).toMatchObject({ fecha: '2028-02-27', turno: 'posturno' })
    expect(dias[27]).toMatchObject({ fecha: '2028-02-28', turno: 'libre' })
    expect(dias[28]).toMatchObject({ fecha: '2028-02-29', turno: 'diurno', sinInformacion: false })
  })

  it('P-26: mes íntegramente anterior (ref 2026-10-01, mes 2026-09) — 30 filas sinInformacion', () => {
    const dias = proyectarMes(2026, 9, REF_OCT)
    expect(dias).toHaveLength(30)
    for (const dia of dias) {
      expect(dia).toEqual({
        fecha: dia.fecha,
        turno: null,
        horario: null,
        sinInformacion: true,
        esProyeccion: false,
      })
    }
  })

  it('P-27: mes que contiene la referencia (ref 2026-10-15/diurno, mes 2026-10)', () => {
    const ref = { fecha: '2026-10-15', turno: 'diurno' }
    const dias = proyectarMes(2026, 10, ref)
    expect(dias).toHaveLength(31)
    for (let dia = 1; dia <= 14; dia += 1) {
      const fila = dias[dia - 1]
      expect(fila.sinInformacion, fila.fecha).toBe(true)
      expect(fila.turno).toBeNull()
    }
    for (let dia = 15; dia <= 31; dia += 1) {
      const fila = dias[dia - 1]
      expect(fila.sinInformacion, fila.fecha).toBe(false)
      expect(fila.esProyeccion).toBe(true)
    }
    expect(dias[14].turno).toBe('diurno')
  })

  it('P-28: diciembre 9999 (ref 2026-10-01/diurno) — última fila nocturno con fin null', () => {
    const dias = proyectarMes(9999, 12, REF_OCT)
    expect(dias).toHaveLength(31)
    expect(dias[0].fecha).toBe('9999-12-01')
    expect(dias[30]).toEqual({
      fecha: '9999-12-31',
      turno: 'nocturno',
      horario: { inicio: '9999-12-31T19:00:00', fin: null },
      sinInformacion: false,
      esProyeccion: true,
    })
  })

  it('proyectarMes lanza Error con año/mes fuera de rango', () => {
    expect(() => proyectarMes(0, 1, REF_OCT)).toThrow(Error)
    expect(() => proyectarMes(2026, 13, REF_OCT)).toThrow(Error)
    expect(() => proyectarMes(2026, 2.5, REF_OCT)).toThrow(Error)
  })
})
