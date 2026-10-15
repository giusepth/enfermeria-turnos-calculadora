/**
 * Validación de entradas inválidas (RNF-12, HU-S01 CA 3) — añadidas por el
 * tester en `specs/013-spa-estimacion-turnos/audits/audit-code.md`.
 *
 * Verifican comportamiento YA implementado en los controladores: entradas
 * inválidas (fecha mal formada, mes 0/13, año fuera de rango, turno no
 * permitido) producen un mensaje corrector visible, no mutan el estado y no
 * provocan crash. Sin código de producto nuevo.
 */
import { beforeEach, describe, expect, it } from 'vitest'

import { createAppController } from '../controllers/appController.js'
import { createCalendarioController } from '../controllers/calendarioController.js'
import { clearReferencia, getReferencia } from '../models/state.js'

const MSG_FECHA_CONSULTA = 'Introduce una fecha válida (AAAA-MM-DD).'
const MSG_RANGO = 'Introduce un mes (1-12) y un año entre 1 y 9999.'
const MSG_TURNO = 'Elige el turno de referencia: Diurno o Nocturno.'

function montarApp() {
  document.body.innerHTML = '<div id="app"></div>'
  const root = document.getElementById('app')
  createAppController(root).start()
  return root
}

function fijarReferencia(root, { fecha, turno }) {
  root.querySelector('#referencia-fecha').value = fecha
  root.querySelector('#referencia-turno').value = turno
  root
    .querySelector('#referencia-form')
    .dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))
}

function abrirConsulta(root) {
  fijarReferencia(root, { fecha: '2026-10-01', turno: 'diurno' })
  root.querySelector('#menu-fecha').click()
}

function abrirCalendario(root) {
  fijarReferencia(root, { fecha: '2026-10-01', turno: 'diurno' })
  root.querySelector('#menu-mes').click()
}

function enviarConsulta(root, fecha) {
  root.querySelector('#consulta-fecha').value = fecha
  root
    .querySelector('#consulta-form')
    .dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))
}

describe('RNF-12 · entradas inválidas ⇒ error visible, sin crash', () => {
  beforeEach(() => {
    clearReferencia()
  })

  it('HU-S01 CA 3: turno no permitido ⇒ mensaje corrector y sin referencia', () => {
    const root = montarApp()
    // El <select> solo admite diurno/nocturno; un valor fuera de catálogo
    // llega como cadena vacía y debe rechazarse sin mutar el estado.
    fijarReferencia(root, { fecha: '2026-10-01', turno: 'posturno' })

    const error = root.querySelector('#referencia-error')
    expect(error).toBeTruthy()
    expect(error.getAttribute('role')).toBe('alert')
    expect(error.textContent).toBe(MSG_TURNO)
    expect(root.querySelector('#referencia-panel')).toBeTruthy()
    expect(getReferencia()).toBeNull()
  })

  it('fecha de consulta mal formada ⇒ «Introduce una fecha válida…» sin resultado', () => {
    const root = montarApp()
    abrirConsulta(root)

    for (const fecha of ['no-es-fecha', '2026-13-40', '2026-02-30']) {
      enviarConsulta(root, fecha)
      const error = root.querySelector('#consulta-error')
      expect(error, fecha).toBeTruthy()
      expect(error.getAttribute('role'), fecha).toBe('alert')
      // El <input type="date"> nativo sanea fechas imposibles a '' (R6);
      // en todos los casos el controlador muestra el mismo mensaje corrector.
      expect(error.textContent, fecha).toBe(MSG_FECHA_CONSULTA)
      expect(root.querySelector('#consulta-resultado'), fecha).toBeNull()
      expect(root.querySelector('#consulta-sin-informacion'), fecha).toBeNull()
    }
  })

  it('fecha de consulta vacía ⇒ mensaje corrector y sin crash', () => {
    const root = montarApp()
    abrirConsulta(root)
    enviarConsulta(root, '')

    expect(root.querySelector('#consulta-error').textContent).toBe(MSG_FECHA_CONSULTA)
    expect(root.querySelector('#consulta-resultado')).toBeNull()
  })

  it('mes 0 / mes 13 / año 0 / año 10000 / año no entero ⇒ mensaje de rango', () => {
    const root = document.createElement('div')
    document.body.appendChild(root)
    const controller = createCalendarioController()
    controller.start(root)

    const invalidas = [
      { year: 2026, month: 0 },
      { year: 2026, month: 13 },
      { year: 0, month: 1 },
      { year: 10000, month: 1 },
      { year: 2026.5, month: 1 },
    ]

    for (const entrada of invalidas) {
      const estado = controller.verMes(entrada)
      expect(estado.error, JSON.stringify(entrada)).toBe(MSG_RANGO)
      expect(estado.calendario, JSON.stringify(entrada)).toBeNull()
      const error = root.querySelector('#calendario-error')
      expect(error, JSON.stringify(entrada)).toBeTruthy()
      expect(error.getAttribute('role'), JSON.stringify(entrada)).toBe('alert')
      expect(error.textContent, JSON.stringify(entrada)).toBe(MSG_RANGO)
      expect(root.querySelector('#calendario-tabla'), JSON.stringify(entrada)).toBeNull()
    }
  })

  it('mes/año vacíos en el formulario ⇒ mensaje corrector visible sin crash', () => {
    const root = montarApp()
    abrirCalendario(root)

    root.querySelector('#calendario-mes').value = ''
    root.querySelector('#calendario-anio').value = ''
    root
      .querySelector('#calendario-form')
      .dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))

    expect(root.querySelector('#calendario-error').textContent).toBe(MSG_RANGO)
    expect(root.querySelector('#calendario-tabla')).toBeNull()
    expect(root.querySelector('#calendario-panel')).toBeTruthy()
  })
})
