/**
 * Suite de calendario mensual (T1313) — RF-T03/HU-S03 sobre motor + estado.
 *
 * Paridad Q6: oct 2026 31→Posturno (P-22), dic 2026 31→Libre (P-23, H-09),
 * febrero 28/29 sin desfase (P-24/P-25, referencias propias de cada caso),
 * RN-13 parcial/total (P-26/P-27) y año alcanzable hasta 9999 (ADR-F13-009).
 * Ids: `design/contracts/frontend.md` §3.5.
 */
import { beforeEach, describe, expect, it } from 'vitest'

import { createAppController } from '../controllers/appController.js'
import { clearReferencia } from '../models/state.js'

const REF_OCT = { fecha: '2026-10-01', turno: 'diurno' }

function abrirCalendario(referencia = REF_OCT) {
  clearReferencia()
  document.body.innerHTML = '<div id="app"></div>'
  const root = document.getElementById('app')
  createAppController(root).start()
  root.querySelector('#referencia-fecha').value = referencia.fecha
  root.querySelector('#referencia-turno').value = referencia.turno
  root
    .querySelector('#referencia-form')
    .dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))
  root.querySelector('#menu-mes').click()
  return root
}

function verMes(root, { month, year }) {
  root.querySelector('#calendario-mes').value = String(month)
  root.querySelector('#calendario-anio').value = String(year)
  root
    .querySelector('#calendario-form')
    .dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))
  return [...root.querySelectorAll('tr.calendario-dia')]
}

function textoFila(fila) {
  return [...fila.querySelectorAll('td')].map((td) => td.textContent.trim())
}

describe('calendario mensual (vista sobre el motor portado)', () => {
  beforeEach(() => {
    clearReferencia()
  })

  it('expone los ids de frontend.md §3.5', () => {
    const root = abrirCalendario()

    for (const id of [
      'calendario-panel',
      'calendario-form',
      'calendario-mes',
      'calendario-anio',
      'calendario-ver',
      'calendario-error',
      'calendario-volver-menu',
    ]) {
      expect(root.querySelector(`#${id}`), `falta #${id}`).toBeTruthy()
    }
  })

  it('P-22: octubre 2026 = 31 filas, 1→Diurno … 31→Posturno', () => {
    const root = abrirCalendario()
    const filas = verMes(root, { month: 10, year: 2026 })

    expect(filas).toHaveLength(31)
    const esperado = {
      '2026-10-01': 'Diurno',
      '2026-10-02': 'Nocturno',
      '2026-10-03': 'Posturno',
      '2026-10-04': 'Libre',
      '2026-10-05': 'Diurno',
      '2026-10-31': 'Posturno',
    }
    for (const fila of filas) {
      const [fecha, , turno] = textoFila(fila)
      if (fecha in esperado) {
        expect(turno, fecha).toBe(esperado[fecha])
      }
    }
    // Orden ascendente y día de la semana (diaDeLaSemana: 0 = domingo).
    const fechas = filas.map((fila) => textoFila(fila)[0])
    expect(fechas).toEqual([...fechas].sort())
    expect(fechas[0]).toBe('2026-10-01')
    expect(fechas[30]).toBe('2026-10-31')
    expect(textoFila(filas[0])[1]).toBe('J') // jueves
    expect(textoFila(filas[3])[1]).toBe('D') // domingo 2026-10-04
  })

  it('P-23: diciembre 2026 — 2026-12-31 es Libre (corrección H-09)', () => {
    const root = abrirCalendario()
    const filas = verMes(root, { month: 12, year: 2026 })

    expect(filas).toHaveLength(31)
    const ultima = textoFila(filas[30])
    expect(ultima[0]).toBe('2026-12-31')
    expect(ultima[2]).toBe('Libre')
  })

  it('P-24: febrero 2026 (ref 2026-02-01/diurno) = 28 filas sin desfase', () => {
    const root = abrirCalendario({ fecha: '2026-02-01', turno: 'diurno' })
    const filas = verMes(root, { month: 2, year: 2026 })

    expect(filas).toHaveLength(28)
    expect(textoFila(filas[0])).toEqual(['2026-02-01', expect.any(String), 'Diurno', expect.any(String)])
    const ultima = textoFila(filas[27])
    expect(ultima[0]).toBe('2026-02-28')
    expect(ultima[2]).toBe('Libre')
  })

  it('P-25: febrero 2028 (ref 2028-02-01/diurno) = 29 filas, 29→Diurno', () => {
    const root = abrirCalendario({ fecha: '2028-02-01', turno: 'diurno' })
    const filas = verMes(root, { month: 2, year: 2028 })

    expect(filas).toHaveLength(29)
    expect(textoFila(filas[27])[0]).toBe('2028-02-28')
    expect(textoFila(filas[27])[2]).toBe('Libre')
    expect(textoFila(filas[28])[0]).toBe('2028-02-29')
    expect(textoFila(filas[28])[2]).toBe('Diurno')
  })

  it('P-26: mes íntegramente anterior ⇒ todas las filas sin información (RN-13)', () => {
    const root = abrirCalendario()
    const filas = verMes(root, { month: 9, year: 2026 })

    expect(filas).toHaveLength(30)
    for (const fila of filas) {
      expect(fila.classList.contains('sin-informacion')).toBe(true)
      expect(fila.textContent).toContain('Sin información suficiente')
    }
  })

  it('P-27: mes que contiene la referencia ⇒ filas parciales (ref 2026-10-15)', () => {
    const root = abrirCalendario({ fecha: '2026-10-15', turno: 'diurno' })
    const filas = verMes(root, { month: 10, year: 2026 })

    expect(filas).toHaveLength(31)
    for (let dia = 1; dia <= 14; dia += 1) {
      expect(filas[dia - 1].classList.contains('sin-informacion'), `día ${dia}`).toBe(true)
    }
    for (let dia = 15; dia <= 31; dia += 1) {
      expect(filas[dia - 1].classList.contains('sin-informacion'), `día ${dia}`).toBe(false)
      expect(textoFila(filas[dia - 1])[2], `día ${dia}`).not.toBe('')
    }
  })

  it('ADR-F13-009: #calendario-anio alcanza 9999 (diciembre de 9999)', () => {
    const root = abrirCalendario()
    const inputAnio = root.querySelector('#calendario-anio')

    expect(inputAnio.getAttribute('min')).toBe('1')
    expect(inputAnio.getAttribute('max')).toBe('9999')

    const filas = verMes(root, { month: 12, year: 9999 })
    expect(filas).toHaveLength(31)
    expect(textoFila(filas[0])[0]).toBe('9999-12-01')
    expect(textoFila(filas[30])[0]).toBe('9999-12-31')
    expect(textoFila(filas[30])[2]).toBe('Nocturno')
    expect(textoFila(filas[30])[3]).toContain('19:00 – (sin hora de fin)')
  })
})
