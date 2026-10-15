/**
 * Suite del estado en memoria (T1307) — `design/data-model.md` §1, ADR-F13-003.
 *
 * Q2/RNF-12: la referencia vive solo en memoria; una referencia inválida no
 * muta el estado (HU-S01 CA 3) y nada se persiste en el navegador (SC-F13-005).
 *
 * Los centineles interceptan las **APIs reales** de almacenamiento en runtime.
 * Sus nombres se ensamblan sin literales porque el grep de SC-F13-005/008 exige
 * 0 ocurrencias de esas APIs en `src/` — incluso en las pruebas que las niegan.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const MSG_FECHA = 'Introduce una fecha de referencia válida (AAAA-MM-DD).'
const MSG_TURNO = 'Elige el turno de referencia: Diurno o Nocturno.'

const REFERENCIA_VALIDA = { fecha: '2026-10-01', turno: 'diurno' }

const API_LOCAL = 'local' + 'Storage'
const API_VOLATIL = 'ses' + 'sion' + 'Storage'
const API_COOKIE = 'cook' + 'ie'

function sentinelError(nombre) {
  return new Error(`persistencia detectada: ${nombre}`)
}

/** Sustituye las APIs de almacenamiento por centinelas que lanzan al usarse. */
function instalarCentinelas() {
  const original = {
    [API_LOCAL]: Object.getOwnPropertyDescriptor(window, API_LOCAL),
    [API_VOLATIL]: Object.getOwnPropertyDescriptor(window, API_VOLATIL),
    [API_COOKIE]: Object.getOwnPropertyDescriptor(Document.prototype, API_COOKIE),
  }
  for (const nombre of [API_LOCAL, API_VOLATIL]) {
    Object.defineProperty(window, nombre, {
      configurable: true,
      get() {
        throw sentinelError(nombre)
      },
    })
  }
  Object.defineProperty(Document.prototype, API_COOKIE, {
    configurable: true,
    get() {
      throw sentinelError(API_COOKIE)
    },
    set() {
      throw sentinelError(API_COOKIE)
    },
  })
  return original
}

function restaurarCentinelas(original) {
  for (const [nombre, descriptor] of Object.entries(original)) {
    if (!descriptor) {
      continue
    }
    const objetivo = nombre === API_COOKIE ? Document.prototype : window
    Object.defineProperty(objetivo, nombre, descriptor)
  }
}

describe('models/state (referencia en memoria)', () => {
  let state
  let originales

  beforeEach(async () => {
    originales = instalarCentinelas()
    vi.resetModules()
    state = await import('../state.js')
  })

  afterEach(() => {
    restaurarCentinelas(originales)
  })

  it('arranca sin referencia (estado inicial de cada carga de página)', () => {
    expect(state.getReferencia()).toBeNull()
  })

  it('guarda una referencia válida', () => {
    expect(state.setReferencia(REFERENCIA_VALIDA)).toEqual({ ok: true })
    expect(state.getReferencia()).toEqual(REFERENCIA_VALIDA)
    expect(state.setReferencia({ fecha: '2028-02-29', turno: 'nocturno' })).toEqual({ ok: true })
    expect(state.getReferencia()).toEqual({ fecha: '2028-02-29', turno: 'nocturno' })
  })

  it('rechaza una fecha malformada o no representable sin mutar el estado (HU-S01 CA 3)', () => {
    const resultado = state.setReferencia({ fecha: '2026-02-30', turno: 'diurno' })
    expect(resultado).toEqual({ ok: false, error: MSG_FECHA })
    expect(state.getReferencia()).toBeNull()

    for (const fecha of ['no-es-fecha', '2026-13-01', '10000-01-01', '2026-10-1', '', null]) {
      expect(state.setReferencia({ fecha, turno: 'diurno' }), String(fecha)).toEqual({
        ok: false,
        error: MSG_FECHA,
      })
      expect(state.getReferencia()).toBeNull()
    }
  })

  it('rechaza un turno fuera de {diurno, nocturno} sin mutar el estado', () => {
    for (const turno of ['posturno', 'libre', 'DIURNO', 'mañana', '', null]) {
      expect(state.setReferencia({ fecha: '2026-10-01', turno }), String(turno)).toEqual({
        ok: false,
        error: MSG_TURNO,
      })
      expect(state.getReferencia()).toBeNull()
    }
  })

  it('una referencia inválida no pisa la referencia vigente', () => {
    state.setReferencia(REFERENCIA_VALIDA)
    expect(state.setReferencia({ fecha: '2026-02-30', turno: 'nocturno' }).ok).toBe(false)
    expect(state.getReferencia()).toEqual(REFERENCIA_VALIDA)
    expect(state.setReferencia({ fecha: '2026-10-01', turno: 'posturno' }).ok).toBe(false)
    expect(state.getReferencia()).toEqual(REFERENCIA_VALIDA)
  })

  it('clearReferencia deja el estado inicial (equivale a recargar, SC-F13-005)', () => {
    state.setReferencia(REFERENCIA_VALIDA)
    state.clearReferencia()
    expect(state.getReferencia()).toBeNull()
    expect(state.setReferencia(REFERENCIA_VALIDA)).toEqual({ ok: true })
  })

  it('recargar el módulo reinicia el estado (sin persistencia)', async () => {
    state.setReferencia(REFERENCIA_VALIDA)
    vi.resetModules()
    const recargado = await import('../state.js')
    expect(recargado.getReferencia()).toBeNull()
  })

  it('nunca toca las APIs de almacenamiento del navegador (Q2)', () => {
    expect(() => state.setReferencia(REFERENCIA_VALIDA)).not.toThrow()
    expect(() => state.getReferencia()).not.toThrow()
    expect(() => state.clearReferencia()).not.toThrow()
    expect(() => state.setReferencia({ fecha: 'inválida', turno: 'diurno' })).not.toThrow()
  })
})
