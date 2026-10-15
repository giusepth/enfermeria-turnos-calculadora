import { readFileSync } from 'node:fs'

import { beforeEach, describe, expect, it } from 'vitest'

import { renderHomeView } from '../views/homeView.js'

// T1317 · Layout base Bento del shell SPA F13 (SC-F13-007 conserva F12:
// ADR-F12-002/004/007; ids de `design/contracts/frontend.md` §3.1/§2).
const read = (relative) => readFileSync(new URL(relative, import.meta.url), 'utf8')
const APP_CSS = () => read('../styles/app.css')

function mount() {
  document.body.innerHTML = '<div id="app"></div>'
  return document.getElementById('app')
}

const AVISO = 'Proyección teórica válida salvo modificaciones posteriores'

describe('layout Bento del shell SPA (T1317)', () => {
  let root

  beforeEach(() => {
    root = mount()
    renderHomeView(root, { estado: 'sin-referencia', referencia: null })
  })

  it('renderiza el marco de la app con cabecera y marca', () => {
    expect(root.querySelector('.app-frame')).not.toBeNull()
    expect(root.querySelector('.app-bar')).not.toBeNull()
    expect(root.querySelector('.brand-name').textContent).toBe('Turnos Calculador')
    expect(root.querySelector('main.app-shell')).not.toBeNull()
    expect(root.querySelector('#app-shell')).not.toBeNull()
  })

  it('la advertencia estática vive en el shell (SC-F13-006)', () => {
    const aviso = root.querySelector('#app-shell #aviso-proyeccion')
    expect(aviso).not.toBeNull()
    expect(aviso.textContent).toBe(AVISO)
  })

  it('sin referencia no muestra resumen ni menú; el panel activo es #referencia-panel', () => {
    expect(root.querySelector('#referencia-panel')).not.toBeNull()
    expect(root.querySelector('#referencia-resumen')).toBeNull()
    expect(root.querySelector('#menu-panel')).toBeNull()
  })

  it('con referencia (menu/fecha/mes) muestra #referencia-resumen con los datos vigentes', () => {
    for (const estado of ['menu', 'fecha', 'mes']) {
      const pantalla = mount()
      renderHomeView(pantalla, { estado, referencia: { fecha: '2026-10-01', turno: 'diurno' } })
      const resumen = pantalla.querySelector('#referencia-resumen')
      expect(resumen, estado).not.toBeNull()
      expect(resumen.textContent, estado).toContain('2026-10-01')
      expect(resumen.textContent, estado).toContain('Diurno')
      expect(pantalla.querySelector('#aviso-proyeccion'), estado).not.toBeNull()
    }
  })

  it('la pantalla activa se renderiza en un único .bento-grid con el panel de su id', () => {
    const grid = root.querySelectorAll('div.bento-grid')
    expect(grid).toHaveLength(1)
    const panel = root.querySelector('.bento-grid > section')
    expect(panel).not.toBeNull()
    expect(panel.id).toBe('referencia-panel')
    expect([...panel.classList].some((c) => c.startsWith('xl:col-span-'))).toBe(true)
  })

  it('.bento-grid es 1 columna en base y 12 columnas en ≥1280px; .card tiene min-width: 0', () => {
    const css = APP_CSS()
    const base = css.match(/\.bento-grid\s*\{[^}]*\}/s)?.[0] ?? ''
    expect(base).toContain('grid-template-columns: minmax(0, 1fr)')
    expect(base).not.toContain('repeat(')

    const media =
      css.match(/@media \(min-width:\s*1280px\)\s*\{[^}]*\.bento-grid\s*\{[^}]*\}/s)?.[0] ?? ''
    expect(media).toMatch(/grid-template-columns:\s*repeat\(12/)

    const card = css.match(/\.card\s*\{[^}]*\}/s)?.[0] ?? ''
    expect(card).toContain('min-width: 0')
  })
})
