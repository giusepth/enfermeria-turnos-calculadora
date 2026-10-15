import { describe, expect, it } from 'vitest'

import { createAppController } from '../controllers/appController.js'
import { getReferencia, setReferencia } from '../models/state.js'
import { SECUENCIA } from '../services/engine/index.js'

describe('esqueleto MVC de la SPA (T1317)', () => {
  it('el estado inicial no tiene referencia (se pierde al recargar)', () => {
    expect(getReferencia()).toBeNull()
  })

  it('el catálogo canónico de la secuencia tiene los cuatro turnos (RN-01)', () => {
    expect(SECUENCIA).toEqual(['diurno', 'nocturno', 'posturno', 'libre'])
  })

  it('el controlador renderiza el shell sin lanzar', () => {
    const container = document.createElement('div')
    const controller = createAppController(container)

    expect(() => controller.render()).not.toThrow()
    expect(container.innerHTML).toContain('Turnos Calculador')
    expect(container.querySelector('#aviso-proyeccion')).not.toBeNull()
  })

  it('una referencia válida se guarda en memoria para la sesión de la página', () => {
    expect(setReferencia({ fecha: '2026-10-01', turno: 'diurno' })).toEqual({ ok: true })
    expect(getReferencia()).toEqual({ fecha: '2026-10-01', turno: 'diurno' })
  })
})
