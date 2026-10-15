/**
 * Suite de consulta por fecha (T1311) — RF-T02/HU-S02 sobre motor + estado.
 *
 * Paridad Q6: canónico P-07, cruce de medianoche P-15, libre P-29, RN-13 P-20
 * y borde `9999-12-31` con fin no representable (P-16, HU-S02 CA 5).
 * Ids y textos: `design/contracts/frontend.md` §3.4/§5/§6.
 */
import { beforeEach, describe, expect, it } from 'vitest'

import { createAppController } from '../controllers/appController.js'
import { clearReferencia } from '../models/state.js'

const AVISO = 'Proyección teórica válida salvo modificaciones posteriores'
const REF_OCT = { fecha: '2026-10-01', turno: 'diurno' }

function abrirConsulta(referencia = REF_OCT) {
  clearReferencia()
  document.body.innerHTML = '<div id="app"></div>'
  const root = document.getElementById('app')
  createAppController(root).start()
  root.querySelector('#referencia-fecha').value = referencia.fecha
  root.querySelector('#referencia-turno').value = referencia.turno
  root
    .querySelector('#referencia-form')
    .dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))
  root.querySelector('#menu-fecha').click()
  return root
}

function consultar(root, fecha) {
  root.querySelector('#consulta-fecha').value = fecha
  root
    .querySelector('#consulta-form')
    .dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))
}

describe('consulta por fecha (vista sobre el motor portado)', () => {
  beforeEach(() => {
    clearReferencia()
  })

  it('expone los ids de frontend.md §3.4 y el aviso estático', () => {
    const root = abrirConsulta()

    for (const id of [
      'consulta-panel',
      'consulta-form',
      'consulta-fecha',
      'consulta-enviar',
      'consulta-error',
      'consulta-volver-menu',
    ]) {
      expect(root.querySelector(`#${id}`), `falta #${id}`).toBeTruthy()
    }
    // Los bloques #consulta-resultado / #consulta-sin-informacion se verifican
    // en los casos P-07/P-20 (solo existe el que corresponde al resultado).
    const aviso = root.querySelector('#aviso-proyeccion')
    expect(aviso).toBeTruthy()
    expect(aviso.textContent).toBe(AVISO)
  })

  it('P-07: tabla canónica 1–5 de octubre (ref 2026-10-01/diurno)', () => {
    const root = abrirConsulta()
    const esperado = {
      '2026-10-01': 'Diurno',
      '2026-10-02': 'Nocturno',
      '2026-10-03': 'Posturno',
      '2026-10-04': 'Libre',
      '2026-10-05': 'Diurno',
    }

    for (const [fecha, turno] of Object.entries(esperado)) {
      consultar(root, fecha)
      expect(root.querySelector('#consulta-resultado'), fecha).toBeTruthy()
      expect(root.querySelector('#consulta-resultado').textContent, fecha).toContain(turno)
      expect(root.querySelector('#consulta-resultado').textContent, fecha).toContain(fecha)
    }
  })

  it('renderiza el horario diurno «07:00 – 19:00» con la etiqueta de proyección', () => {
    const root = abrirConsulta()
    consultar(root, '2026-10-01')

    const horario = root.querySelector('.consulta-horario')
    expect(horario).toBeTruthy()
    expect(horario.textContent).toContain('07:00 – 19:00')
    expect(horario.textContent).not.toContain('(día siguiente)')
    expect(root.querySelector('.consulta-proyeccion').textContent).toContain('Proyección teórica')
  })

  it('P-15: el nocturno cruza medianoche con « (día siguiente)»', () => {
    const root = abrirConsulta()
    consultar(root, '2026-10-02')

    const horario = root.querySelector('.consulta-horario')
    expect(horario.textContent).toContain('19:00 – 07:00 (día siguiente)')
  })

  it('P-29: el turno libre no tiene horario y sí es proyección', () => {
    const root = abrirConsulta()
    consultar(root, '2026-10-04')

    const resultado = root.querySelector('#consulta-resultado')
    expect(resultado.textContent).toContain('Libre')
    expect(root.querySelector('.consulta-horario')).toBeNull()
    expect(root.querySelector('.consulta-proyeccion')).toBeTruthy()
  })

  it('P-20: fecha previa a la referencia ⇒ «Sin información suficiente» (RN-13)', () => {
    const root = abrirConsulta()
    consultar(root, '2026-09-30')

    expect(root.querySelector('#consulta-sin-informacion')).toBeTruthy()
    expect(root.querySelector('#consulta-sin-informacion').textContent).toContain(
      'Sin información suficiente',
    )
    expect(root.querySelector('#consulta-resultado')).toBeNull()
  })

  it('P-16/HU-S02 CA 5: 9999-12-31 nocturno ⇒ «19:00 – (sin hora de fin)»', () => {
    const root = abrirConsulta()
    consultar(root, '9999-12-31')

    const resultado = root.querySelector('#consulta-resultado')
    expect(resultado.textContent).toContain('Nocturno')
    const horario = root.querySelector('.consulta-horario')
    expect(horario).toBeTruthy()
    expect(horario.textContent).toContain('19:00 – (sin hora de fin)')
    expect(horario.textContent).not.toContain('07:00')
  })
})
