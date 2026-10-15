import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

// T1205 · Accesibilidad: contraste WCAG 2.2 AA, foco visible y objetivo ≥ 24×24 px
// (RNF-V01, RNF-V02, RNF-V06, RF-V07; HU-V04, HU-V05; SC-F12-006/007; ADR-F12-002/005).

const CSS_URL = '../styles/app.css'

function readCss() {
  return readFileSync(new URL(CSS_URL, import.meta.url), 'utf8')
}

function themeTokens(css) {
  const block = css.match(/@theme\s*\{([\s\S]*?)\}/)
  expect(block, 'no se encontró el bloque @theme').not.toBeNull()
  const tokens = {}
  for (const match of block[1].matchAll(/(--color-[\w-]+)\s*:\s*(#[0-9a-fA-F]{6})/g)) {
    tokens[match[1]] = match[2]
  }
  return tokens
}

function channel(value) {
  const c = value / 255
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
}

function relativeLuminance(hex) {
  const clean = hex.replace('#', '')
  const r = parseInt(clean.slice(0, 2), 16)
  const g = parseInt(clean.slice(2, 4), 16)
  const b = parseInt(clean.slice(4, 6), 16)
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b)
}

function contrastRatio(hexA, hexB) {
  const a = relativeLuminance(hexA)
  const b = relativeLuminance(hexB)
  const [lighter, darker] = a >= b ? [a, b] : [b, a]
  return (lighter + 0.05) / (darker + 0.05)
}

const TEXT_TOKENS = ['texto', 'texto-secundario', 'acento', 'error', 'exito']
const SURFACES = ['fondo', 'superficie-1', 'superficie-2']

describe('accesibilidad visual (T1205)', () => {
  const css = readCss()
  const tokens = themeTokens(css)

  it('expone los 9 roles + tinta en @theme', () => {
    for (const name of [...SURFACES, ...TEXT_TOKENS, 'tinta', 'borde']) {
      expect(tokens[`--color-${name}`], `--color-${name}`).toMatch(/^#[0-9A-Fa-f]{6}$/)
    }
  })

  it('el texto normal alcanza ≥ 4.5:1 sobre las tres superficies', () => {
    for (const token of TEXT_TOKENS) {
      for (const surface of SURFACES) {
        const ratio = contrastRatio(tokens[`--color-${token}`], tokens[`--color-${surface}`])
        expect(
          ratio,
          `${token} vs ${surface} = ${ratio.toFixed(2)}`,
        ).toBeGreaterThanOrEqual(4.5)
      }
    }
  })

  it('la tinta sobre el acento (botón primario) alcanza ≥ 4.5:1', () => {
    const ratio = contrastRatio(tokens['--color-tinta'], tokens['--color-acento'])
    expect(ratio, `tinta vs acento = ${ratio.toFixed(2)}`).toBeGreaterThanOrEqual(4.5)
  })

  it('el acento (UI/foco) y el borde alcanzan ≥ 3:1 sobre las superficies', () => {
    for (const surface of SURFACES) {
      const accent = contrastRatio(tokens['--color-acento'], tokens[`--color-${surface}`])
      expect(accent, `acento vs ${surface} = ${accent.toFixed(2)}`).toBeGreaterThanOrEqual(3)
      const border = contrastRatio(tokens['--color-borde'], tokens[`--color-${surface}`])
      expect(border, `borde vs ${surface} = ${border.toFixed(2)}`).toBeGreaterThanOrEqual(3)
    }
  })

  it('declara un anillo de foco visible con el acento', () => {
    const rule = css.match(/:focus-visible\s*\{[^}]*\}/)
    expect(rule, 'falta la regla :focus-visible').not.toBeNull()
    expect(rule[0]).toMatch(/outline\s*:\s*[^;]*var\(--color-acento\)/)
    expect(rule[0]).toMatch(/outline\s*:\s*(?:2px|3px)/)
  })

  it('garantiza objetivo táctil ≥ 24×24 px en controles', () => {
    const cssNumbers = (property) => {
      const found = []
      for (const match of css.matchAll(new RegExp(`${property}\\s*:\\s*(\\d+(?:\\.\\d+)?)px`, 'g'))) {
        found.push(Number(match[1]))
      }
      return found
    }
    const minHeights = cssNumbers('min-height')
    const minWidths = cssNumbers('min-width')
    // Al menos un mínimo de 24px en alto y ancho para controles.
    expect(minHeights.some((v) => v >= 24)).toBe(true)
    expect(minWidths.some((v) => v >= 24)).toBe(true)

    // Los controles interactivos tienen un objetivo declarado.
    const controls = css.match(/(?:button|capture|input|select|textarea|a)\s*[,{]/g) ?? []
    expect(controls.length).toBeGreaterThan(0)

    // `.btn` fija un mínimo cómodo de 40px de alto.
    const btn = css.match(/\.btn\s*\{[^}]*\}/)
    expect(btn, 'falta la regla .btn').not.toBeNull()
    expect(btn[0]).toMatch(/min-height\s*:\s*40px/)
  })
})
