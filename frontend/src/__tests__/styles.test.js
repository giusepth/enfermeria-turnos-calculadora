import { readFileSync } from 'node:fs'

import { describe, expect, it } from 'vitest'

// T1201 · Setup Tailwind v4 + tokens (RF-V01, RF-V02, RF-V03, RF-V09, RNF-V04;
// HU-V01, HU-V06; SC-F12-001/002/006/010; ADR-F12-001/002).
const read = (relative) => readFileSync(new URL(relative, import.meta.url), 'utf8')

const VITE_CONFIG = '../../vite.config.js'
const PACKAGE_JSON = '../../package.json'
const MAIN_JS = '../main.js'
const APP_CSS = '../styles/app.css'

// Catálogo normativo de tokens del ADR-F12-002 (§6.1 del design/plan.md).
const TOKENS = {
  fondo: '#0A0E15',
  'superficie-1': '#141C27',
  'superficie-2': '#1D2734',
  texto: '#F1F5F9',
  'texto-secundario': '#A8B5C4',
  acento: '#7AA5FF',
  tinta: '#0B1220',
  borde: '#6B7889',
  error: '#FF8A80',
  exito: '#5FD99B',
}

function tokenPattern(name, hex) {
  const escaped = name.replace(/-/g, '\\-')
  return new RegExp(`--color-${escaped}\\s*:\\s*${hex}\\b`, 'i')
}

describe('setup de estilos Tailwind v4 y tokens (T1201)', () => {
  it('integra el plugin @tailwindcss/vite en vite.config.js sin perder vitest', () => {
    const config = read(VITE_CONFIG)

    expect(config).toMatch(/@tailwindcss\/vite/)
    expect(config).toMatch(/plugins:\s*\[[^\]]*tailwindcss\(\)/)
    // La configuración de vitest existente se conserva.
    expect(config).toMatch(/environment:\s*'happy-dom'/)
    expect(config).toMatch(/include:\s*\['src\/\*\*\/\*\.test\.js'\]/)
  })

  it('declara tailwindcss y @tailwindcss/vite como devDependencies', () => {
    const pkg = JSON.parse(read(PACKAGE_JSON))

    expect(pkg.devDependencies).toHaveProperty('tailwindcss')
    expect(pkg.devDependencies).toHaveProperty('@tailwindcss/vite')
  })

  it('importa app.css como primer import de main.js', () => {
    const main = read(MAIN_JS)
    const firstImport = main.match(/^import\s+.*$/m)?.[0] ?? ''

    expect(firstImport).toContain('./styles/app.css')
    expect(main.split('\n')[0]).toContain("./styles/app.css")
  })

  it('define @import "tailwindcss" y los tokens del ADR-F12-002 con su hex', () => {
    const css = read(APP_CSS)

    expect(css).toMatch(/@import\s+"tailwindcss"/)
    expect(css).toMatch(/@theme\s*\{/)
    for (const [name, hex] of Object.entries(TOKENS)) {
      expect(css).toMatch(tokenPattern(name, hex))
    }
  })

  it('define los componentes base del sistema visual en app.css', () => {
    const css = read(APP_CSS)

    for (const cls of ['.card', '.bento-grid', '.btn-primary', '.btn-ghost', '.table-scroll']) {
      expect(css).toContain(cls)
    }
  })
})
