/**
 * Suite del flujo de pantallas (T1309) — `design/contracts/frontend.md` §2/§6.
 *
 * Q2/ADR-F13-004: sin referencia ⇒ formulario de referencia; tras fijarla
 * **siempre** aparece el menú; (a) fecha | (b) mes; «Volver al menú» conserva la
 * referencia y «Cambiar referencia» la limpia (≡ recargar, SC-F13-005).
 * SC-F13-006: `#aviso-proyeccion` con el texto canónico en todas las pantallas.
 */
import { beforeEach, describe, expect, it } from 'vitest'

import { createAppController } from '../controllers/appController.js'
import { clearReferencia, getReferencia, setReferencia } from '../models/state.js'

const AVISO = 'Proyección teórica válida salvo modificaciones posteriores'
const MSG_FECHA = 'Introduce una fecha de referencia válida (AAAA-MM-DD).'

function montar() {
  document.body.innerHTML = '<div id="app"></div>'
  const root = document.getElementById('app')
  const controller = createAppController(root)
  controller.start()
  return { root, controller }
}

function enviarReferencia(root, { fecha, turno }) {
  const inputFecha = root.querySelector('#referencia-fecha')
  const selectTurno = root.querySelector('#referencia-turno')
  inputFecha.value = fecha
  selectTurno.value = turno
  root.querySelector('#referencia-form').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))
}

function visible(root, id) {
  return Boolean(root.querySelector(`#${id}`))
}

describe('flujo referencia → menú → fecha | mes', () => {
  beforeEach(() => {
    clearReferencia()
  })

  it('sin referencia se muestra el formulario de referencia', () => {
    const { root } = montar()

    expect(visible(root, 'referencia-panel')).toBe(true)
    expect(visible(root, 'referencia-form')).toBe(true)
    expect(visible(root, 'referencia-fecha')).toBe(true)
    expect(visible(root, 'referencia-turno')).toBe(true)
    expect(visible(root, 'referencia-enviar')).toBe(true)
    expect(visible(root, 'referencia-error')).toBe(true)
    expect(visible(root, 'menu-panel')).toBe(false)
    expect(visible(root, 'consulta-panel')).toBe(false)
    expect(visible(root, 'calendario-panel')).toBe(false)

    const opciones = [...root.querySelectorAll('#referencia-turno option')].map((o) => o.value)
    expect(opciones).toEqual(['diurno', 'nocturno'])
  })

  it('el aviso canónico está presente en todas las pantallas (SC-F13-006)', () => {
    const { root } = montar()
    const comprobarAviso = () => {
      const aviso = root.querySelector('#aviso-proyeccion')
      expect(aviso, 'falta #aviso-proyeccion').toBeTruthy()
      expect(aviso.textContent).toBe(AVISO)
    }

    comprobarAviso()
    enviarReferencia(root, { fecha: '2026-10-01', turno: 'diurno' })
    comprobarAviso()

    root.querySelector('#menu-fecha').click()
    comprobarAviso()
    root.querySelector('#consulta-volver-menu').click()
    comprobarAviso()

    root.querySelector('#menu-mes').click()
    comprobarAviso()
    root.querySelector('#calendario-volver-menu').click()
    comprobarAviso()
  })

  it('tras fijar la referencia aparece SIEMPRE el menú (SC-F13-001)', () => {
    const { root } = montar()
    enviarReferencia(root, { fecha: '2026-10-01', turno: 'diurno' })

    expect(visible(root, 'referencia-panel')).toBe(false)
    expect(visible(root, 'menu-panel')).toBe(true)
    expect(visible(root, 'menu-fecha')).toBe(true)
    expect(visible(root, 'menu-mes')).toBe(true)
    expect(visible(root, 'menu-cambiar-referencia')).toBe(true)
    expect(visible(root, 'referencia-resumen')).toBe(true)
    expect(root.querySelector('#referencia-resumen').textContent).toContain('2026-10-01')
    expect(getReferencia()).toEqual({ fecha: '2026-10-01', turno: 'diurno' })
  })

  it('la opción (a) lleva a la consulta por fecha y «Volver al menú» conserva la referencia', () => {
    const { root } = montar()
    enviarReferencia(root, { fecha: '2026-10-01', turno: 'diurno' })
    root.querySelector('#menu-fecha').click()

    expect(visible(root, 'menu-panel')).toBe(false)
    expect(visible(root, 'consulta-panel')).toBe(true)
    expect(visible(root, 'consulta-form')).toBe(true)
    expect(visible(root, 'consulta-fecha')).toBe(true)
    expect(visible(root, 'consulta-enviar')).toBe(true)
    expect(visible(root, 'consulta-error')).toBe(true)
    expect(visible(root, 'consulta-volver-menu')).toBe(true)

    root.querySelector('#consulta-volver-menu').click()
    expect(visible(root, 'menu-panel')).toBe(true)
    expect(getReferencia()).toEqual({ fecha: '2026-10-01', turno: 'diurno' })
  })

  it('la opción (b) lleva al calendario del mes y «Volver al menú» conserva la referencia', () => {
    const { root } = montar()
    enviarReferencia(root, { fecha: '2026-10-01', turno: 'diurno' })
    root.querySelector('#menu-mes').click()

    expect(visible(root, 'menu-panel')).toBe(false)
    expect(visible(root, 'calendario-panel')).toBe(true)
    expect(visible(root, 'calendario-form')).toBe(true)
    expect(visible(root, 'calendario-mes')).toBe(true)
    expect(visible(root, 'calendario-anio')).toBe(true)
    expect(visible(root, 'calendario-ver')).toBe(true)
    expect(visible(root, 'calendario-error')).toBe(true)
    expect(visible(root, 'calendario-volver-menu')).toBe(true)

    root.querySelector('#calendario-volver-menu').click()
    expect(visible(root, 'menu-panel')).toBe(true)
    expect(getReferencia()).toEqual({ fecha: '2026-10-01', turno: 'diurno' })
  })

  it('«Cambiar referencia» limpia el estado y vuelve al formulario (≡ recargar)', () => {
    const { root } = montar()
    enviarReferencia(root, { fecha: '2026-10-01', turno: 'diurno' })

    root.querySelector('#menu-cambiar-referencia').click()
    expect(visible(root, 'referencia-panel')).toBe(true)
    expect(visible(root, 'menu-panel')).toBe(false)
    expect(getReferencia()).toBeNull()

    // También desde la pantalla de fecha.
    enviarReferencia(root, { fecha: '2026-10-01', turno: 'diurno' })
    root.querySelector('#menu-fecha').click()
    const botonCambiar = [...root.querySelectorAll('#consulta-panel button')].find((b) =>
      b.textContent.includes('Cambiar referencia'),
    )
    expect(botonCambiar, 'falta «Cambiar referencia» en la pantalla de fecha').toBeTruthy()
    botonCambiar.click()
    expect(visible(root, 'referencia-panel')).toBe(true)
    expect(getReferencia()).toBeNull()
  })

  it('una referencia inválida muestra el mensaje corrector y conserva el formulario (HU-S01 CA 3)', () => {
    const { root } = montar()
    // `input type="date"` descarta en el DOM las fechas imposibles (2026-02-30
    // llega vacío al controlador), igual que el picker nativo (riesgo R6).
    enviarReferencia(root, { fecha: '2026-02-30', turno: 'nocturno' })

    expect(visible(root, 'referencia-panel')).toBe(true)
    expect(root.querySelector('#referencia-error').textContent).toBe(MSG_FECHA)
    // El formulario no se limpia: el turno introducido se conserva.
    expect(root.querySelector('#referencia-turno').value).toBe('nocturno')
    expect(getReferencia()).toBeNull()
  })
})
