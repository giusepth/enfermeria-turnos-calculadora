import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

import { renderCalendarioView } from '../views/calendarioView.js'
import { renderHomeView } from '../views/homeView.js'

// T1317 · Responsive 375–1280 sin scroll horizontal (conserva ADR-F12-006;
// SC-F13-007/009 sobre el shell F13).

function readCss() {
  return readFileSync(join(import.meta.dirname, '..', 'styles', 'app.css'), 'utf8')
}

function ruleBlock(css, selector) {
  const escaped = selector.replace(/[.#[\]]/g, '\\$&')
  const match = css.match(new RegExp(`${escaped}\\s*\\{([^}]*)\\}`))
  return match ? match[1] : null
}

describe('responsive 375–1280 (T1317)', () => {
  const css = readCss()

  it('.bento-grid es una columna en base y multicolumna solo en media queries', () => {
    const base = ruleBlock(css, '.bento-grid')
    expect(base, 'falta la regla base de .bento-grid').not.toBeNull()
    expect(base).toMatch(/grid-template-columns\s*:\s*minmax\(0,\s*1fr\)/)

    // Sin `repeat(...)` en la declaración base (solo dentro de @media).
    expect(base).not.toMatch(/grid-template-columns\s*:[^;]*repeat\(/)

    expect(css).toMatch(/@media[^{]*min-width:\s*768px[^{]*\{[^@]*\.bento-grid/)
    expect(css).toMatch(/@media[^{]*min-width:\s*1280px[^{]*\{[^@]*\.bento-grid/)
  })

  it('.table-scroll permite desplazar la tabla sin desbordar la página', () => {
    const block = ruleBlock(css, '.table-scroll')
    expect(block, 'falta .table-scroll').not.toBeNull()
    expect(block).toMatch(/overflow-x\s*:\s*auto/)
    expect(block).toMatch(/max-width\s*:\s*100%/)
  })

  it('.card evita el desbordamiento y el texto largo puede romperse', () => {
    const card = ruleBlock(css, '.card')
    expect(card, 'falta la regla .card').not.toBeNull()
    expect(card).toMatch(/min-width\s*:\s*0/)

    expect(css).toMatch(/overflow-wrap\s*:\s*(anywhere|break-word)/)
  })

  it('no hay anchos mínimos fijos > 375 px', () => {
    const widths = [...css.matchAll(/min-width\s*:\s*(\d+)px/g)].map((m) => ({
      value: Number(m[1]),
      index: m.index,
    }))
    for (const { value, index } of widths) {
      // Ignora los `min-width` de las cabeceras @media (p. ej. `(min-width: 768px)`).
      const before = css.slice(0, index).trimEnd()
      if (before.endsWith('(') || before.endsWith(',')) {
        continue
      }
      expect(value, `min-width: ${value}px > 375px`).toBeLessThanOrEqual(375)
    }
  })

  it('la lista del mes vive dentro de .table-scroll', () => {
    document.body.innerHTML = '<div id="app"></div>'
    const root = document.getElementById('app')
    renderCalendarioView(root, {
      year: 2026,
      month: 10,
      calendario: {
        year: 2026,
        month: 10,
        dias: [
          {
            fecha: '2026-10-01',
            turno: 'diurno',
            horario: { inicio: '2026-10-01T07:00:00', fin: '2026-10-01T19:00:00' },
            sinInformacion: false,
            esProyeccion: true,
          },
        ],
      },
    })
    expect(root.querySelector('.table-scroll #calendario-tabla')).not.toBeNull()
  })

  it('el shell envuelve las pantallas en .bento-grid', () => {
    document.body.innerHTML = '<div id="app"></div>'
    const root = document.getElementById('app')
    renderHomeView(root, { estado: 'menu', referencia: { fecha: '2026-10-01', turno: 'diurno' } })
    expect(root.querySelector('.bento-grid')).not.toBeNull()
  })
})
