/**
 * Regresión del flujo completo de la SPA (T1318) — HU-S01..S04, SC-F13-001/005/006/007.
 *
 * Suite verde contra lo implementado (excepción TDD de tasks.md): recorrido
 * referencia → menú → fecha | mes con valores reales del motor, reset por
 * «Cambiar referencia» y por recarga, aviso permanente, tema F12 y borde
 * `9999-12-31` consultable desde la UI de fecha (ADR-F13-009/R6).
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { createAppController } from '../controllers/appController.js'
import { clearReferencia, getReferencia } from '../models/state.js'

const AVISO = 'Proyección teórica válida salvo modificaciones posteriores'
const REF_OCT = { fecha: '2026-10-01', turno: 'diurno' }

function montarApp() {
  document.body.innerHTML = '<div id="app"></div>'
  const root = document.getElementById('app')
  createAppController(root).start()
  return root
}

function fijarReferencia(root, referencia) {
  root.querySelector('#referencia-fecha').value = referencia.fecha
  root.querySelector('#referencia-turno').value = referencia.turno
  root
    .querySelector('#referencia-form')
    .dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))
}

function consultarFecha(root, fecha) {
  root.querySelector('#consulta-fecha').value = fecha
  root
    .querySelector('#consulta-form')
    .dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))
}

function verMes(root, { month, year }) {
  root.querySelector('#calendario-mes').value = String(month)
  root.querySelector('#calendario-anio').value = String(year)
  root
    .querySelector('#calendario-form')
    .dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))
  return [...root.querySelectorAll('tr.calendario-dia')]
}

describe('regresión del flujo completo (T1318)', () => {
  beforeEach(() => {
    clearReferencia()
  })

  it('recorrido completo: referencia → menú → fecha con valores reales del motor', () => {
    const root = montarApp()
    fijarReferencia(root, REF_OCT)
    expect(root.querySelector('#menu-panel')).not.toBeNull()

    root.querySelector('#menu-fecha').click()
    consultarFecha(root, '2026-10-03')

    const resultado = root.querySelector('#consulta-resultado')
    expect(resultado.textContent).toContain('Posturno')
    expect(resultado.textContent).toContain('2026-10-03')
    // Formato §5.2: `HH:MM – HH:MM` (el fin del posturno es 23:59:59 en el motor).
    expect(root.querySelector('.consulta-horario').textContent).toContain('07:00 – 23:59')

    root.querySelector('#consulta-volver-menu').click()
    expect(root.querySelector('#menu-panel')).not.toBeNull()
    expect(getReferencia()).toEqual(REF_OCT)
  })

  it('recorrido completo: referencia → menú → mes con valores reales del motor', () => {
    const root = montarApp()
    fijarReferencia(root, REF_OCT)

    root.querySelector('#menu-mes').click()
    const filas = verMes(root, { month: 10, year: 2026 })

    expect(filas).toHaveLength(31)
    expect([...filas[30].querySelectorAll('td')].map((td) => td.textContent.trim())[2]).toBe(
      'Posturno',
    )
    root.querySelector('#calendario-volver-menu').click()
    expect(root.querySelector('#menu-panel')).not.toBeNull()
    expect(getReferencia()).toEqual(REF_OCT)
  })

  it('SC-F13-005: «Cambiar referencia» limpia el estado y vuelve a pedir la referencia', () => {
    const root = montarApp()
    fijarReferencia(root, REF_OCT)
    root.querySelector('#menu-mes').click()

    const botonCambiar = [...root.querySelectorAll('#calendario-panel button')].find((b) =>
      b.textContent.includes('Cambiar referencia'),
    )
    botonCambiar.click()

    expect(root.querySelector('#referencia-panel')).not.toBeNull()
    expect(root.querySelector('#referencia-form')).not.toBeNull()
    expect(getReferencia()).toBeNull()
  })

  it('SC-F13-005: recargar la página reinicia el estado y vuelve a pedir la referencia', async () => {
    const root = montarApp()
    fijarReferencia(root, REF_OCT)
    expect(getReferencia()).toEqual(REF_OCT)

    // Simulación de recarga: nuevo ciclo de módulos y nuevo arranque de la SPA.
    vi.resetModules()
    const stateRecargado = await import('../models/state.js')
    const { createAppController: createRecargado } = await import('../controllers/appController.js')
    expect(stateRecargado.getReferencia()).toBeNull()

    document.body.innerHTML = '<div id="app"></div>'
    const rootRecargado = document.getElementById('app')
    createRecargado(rootRecargado).start()
    expect(rootRecargado.querySelector('#referencia-panel')).not.toBeNull()
    expect(rootRecargado.querySelector('#referencia-form')).not.toBeNull()
  })

  it('SC-F13-006: el aviso canónico acompaña todas las pantallas del recorrido', () => {
    const root = montarApp()
    const comprobarAviso = (pantalla) => {
      const aviso = root.querySelector('#aviso-proyeccion')
      expect(aviso, pantalla).not.toBeNull()
      expect(aviso.textContent, pantalla).toBe(AVISO)
    }

    comprobarAviso('referencia')
    fijarReferencia(root, REF_OCT)
    comprobarAviso('menu')
    root.querySelector('#menu-fecha').click()
    consultarFecha(root, '2026-10-01')
    comprobarAviso('fecha')
    root.querySelector('#consulta-volver-menu').click()
    root.querySelector('#menu-mes').click()
    verMes(root, { month: 12, year: 2026 })
    comprobarAviso('mes')
  })

  it('SC-F13-007: conserva las clases del tema Bento F12', () => {
    const root = montarApp()
    expect(root.querySelector('.app-frame')).not.toBeNull()
    expect(root.querySelector('.app-bar')).not.toBeNull()
    expect(root.querySelector('.app-shell')).not.toBeNull()
    expect(root.querySelector('.bento-grid')).not.toBeNull()
    expect(root.querySelector('#aviso-proyeccion').classList.contains('aviso-proyeccion')).toBe(true)

    fijarReferencia(root, REF_OCT)
    root.querySelector('#menu-fecha').click()
    consultarFecha(root, '2026-10-01')
    expect(root.querySelector('#consulta-resultado')).not.toBeNull()
    expect(root.querySelector('.consulta-proyeccion').textContent).toContain('Proyección teórica')
    expect(root.querySelector('#consulta-volver-menu').classList.contains('btn-ghost')).toBe(true)
  })

  it('ADR-F13-009/R6: 9999-12-31 es consultable desde la UI de fecha (fin no representable)', () => {
    const root = montarApp()
    fijarReferencia(root, REF_OCT)
    root.querySelector('#menu-fecha').click()
    consultarFecha(root, '9999-12-31')

    const resultado = root.querySelector('#consulta-resultado')
    expect(resultado.textContent).toContain('Nocturno')
    expect(root.querySelector('.consulta-horario').textContent).toContain('19:00 – (sin hora de fin)')
  })
})
