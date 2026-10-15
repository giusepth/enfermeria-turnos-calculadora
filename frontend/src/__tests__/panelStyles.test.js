import { describe, expect, it, vi } from 'vitest'

import { renderCalendarioView } from '../views/calendarioView.js'
import { renderConsultaView } from '../views/consultaView.js'
import { renderMenuView } from '../views/menuView.js'
import { renderReferenciaView } from '../views/referenciaView.js'

// T1317 · Paneles del flujo F13 (referencia, menú, consulta, mes): ids de
// `design/contracts/frontend.md` §3, clases del tema F12 (.btn*) y listeners.

function mount() {
  document.body.innerHTML = '<div id="app"></div>'
  return document.getElementById('app')
}

const DIA = {
  fecha: '2026-10-01',
  turno: 'diurno',
  horario: { inicio: '2026-10-01T07:00:00', fin: '2026-10-01T19:00:00' },
  sinInformacion: false,
  esProyeccion: true,
}

describe('estilos de paneles (T1317)', () => {
  it('referenciaView conserva ids, clases de botón y listener de submit', () => {
    const root = mount()
    const onSubmit = vi.fn()
    renderReferenciaView(root, {
      fecha: '2026-10-01',
      turno: 'diurno',
      error: 'algo',
      onSubmit,
    })

    for (const id of [
      '#referencia-form',
      '#referencia-fecha',
      '#referencia-turno',
      '#referencia-enviar',
      '#referencia-error',
    ]) {
      expect(root.querySelector(id), id).not.toBeNull()
    }

    const submit = root.querySelector('#referencia-enviar')
    expect(submit.classList.contains('btn')).toBe(true)
    expect(submit.classList.contains('btn-primary')).toBe(true)
    expect(root.querySelector('#referencia-error').getAttribute('role')).toBe('alert')
    expect(root.querySelector('#referencia-error').classList.contains('error')).toBe(true)

    root.querySelector('#referencia-fecha').value = '2026-10-01'
    root.querySelector('#referencia-turno').value = 'diurno'
    root.querySelector('#referencia-form').dispatchEvent(new Event('submit'))
    expect(onSubmit).toHaveBeenCalledWith({ fecha: '2026-10-01', turno: 'diurno' })
  })

  it('menuView conserva ids, clases de botón y listeners', () => {
    const root = mount()
    const onIrAFecha = vi.fn()
    const onIrAMes = vi.fn()
    const onCambiarReferencia = vi.fn()
    renderMenuView(root, { onIrAFecha, onIrAMes, onCambiarReferencia })

    expect(root.querySelector('#menu-opciones')).not.toBeNull()
    for (const id of ['#menu-fecha', '#menu-mes', '#menu-cambiar-referencia']) {
      const b = root.querySelector(id)
      expect(b, id).not.toBeNull()
      expect(b.classList.contains('btn'), id).toBe(true)
    }
    expect(root.querySelector('#menu-fecha').classList.contains('btn-primary')).toBe(true)
    expect(root.querySelector('#menu-mes').classList.contains('btn-primary')).toBe(true)
    expect(root.querySelector('#menu-cambiar-referencia').classList.contains('btn-ghost')).toBe(true)

    root.querySelector('#menu-fecha').click()
    expect(onIrAFecha).toHaveBeenCalled()
    root.querySelector('#menu-mes').click()
    expect(onIrAMes).toHaveBeenCalled()
    root.querySelector('#menu-cambiar-referencia').click()
    expect(onCambiarReferencia).toHaveBeenCalled()
  })

  it('consultaView conserva ids, semánticos y clases (estado con resultado)', () => {
    const root = mount()
    const onConsultar = vi.fn()
    const onVolverAlMenu = vi.fn()
    renderConsultaView(root, {
      resultado: DIA,
      error: null,
      fecha: '2026-10-01',
      onConsultar,
      onVolverAlMenu,
      onCambiarReferencia: vi.fn(),
    })

    for (const id of ['#consulta-form', '#consulta-fecha', '#consulta-enviar', '#consulta-resultado']) {
      expect(root.querySelector(id), id).not.toBeNull()
    }
    expect(root.querySelector('.consulta-horario')).not.toBeNull()
    expect(root.querySelector('.consulta-proyeccion')).not.toBeNull()
    expect(root.querySelector('#consulta-resultado').getAttribute('role')).toBe('status')

    const submit = root.querySelector('#consulta-enviar')
    expect(submit.classList.contains('btn')).toBe(true)
    expect(submit.classList.contains('btn-primary')).toBe(true)
    expect(root.querySelector('#consulta-volver-menu').classList.contains('btn-ghost')).toBe(true)

    root.querySelector('#consulta-form').dispatchEvent(new Event('submit'))
    expect(onConsultar).toHaveBeenCalled()
    root.querySelector('#consulta-volver-menu').click()
    expect(onVolverAlMenu).toHaveBeenCalled()
  })

  it('consultaView conserva los estados sin información y error', () => {
    const root = mount()
    renderConsultaView(root, {
      resultado: {
        fecha: '2026-09-30',
        turno: null,
        horario: null,
        sinInformacion: true,
        esProyeccion: false,
      },
    })
    expect(root.querySelector('#consulta-sin-informacion')).not.toBeNull()
    expect(root.querySelector('#consulta-sin-informacion').getAttribute('role')).toBe('status')

    const root2 = mount()
    renderConsultaView(root2, { error: 'fallo' })
    expect(root2.querySelector('#consulta-error')).not.toBeNull()
    expect(root2.querySelector('#consulta-error').getAttribute('role')).toBe('alert')
  })

  it('calendarioView conserva ids, tabla y botones de navegación', () => {
    const root = mount()
    const onVerMes = vi.fn()
    const onVolverAlMenu = vi.fn()
    renderCalendarioView(root, {
      year: 2026,
      month: 10,
      calendario: { year: 2026, month: 10, dias: [DIA] },
      error: null,
      onVerMes,
      onVolverAlMenu,
      onCambiarReferencia: vi.fn(),
    })

    for (const id of [
      '#calendario-form',
      '#calendario-mes',
      '#calendario-anio',
      '#calendario-ver',
      '#calendario-proyeccion',
      '#calendario-tabla',
      '#calendario-volver-menu',
    ]) {
      expect(root.querySelector(id), id).not.toBeNull()
    }

    const submit = root.querySelector('#calendario-ver')
    expect(submit.classList.contains('btn')).toBe(true)
    expect(submit.classList.contains('btn-primary')).toBe(true)
    expect(root.querySelector('#calendario-volver-menu').classList.contains('btn-ghost')).toBe(true)
    expect(root.querySelector('.table-scroll #calendario-tabla')).not.toBeNull()

    root.querySelector('#calendario-form').dispatchEvent(new Event('submit'))
    expect(onVerMes).toHaveBeenCalled()
    root.querySelector('#calendario-volver-menu').click()
    expect(onVolverAlMenu).toHaveBeenCalled()
  })
})
