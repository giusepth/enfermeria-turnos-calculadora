import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { gzipSync } from 'node:zlib'
import { beforeAll, describe, expect, it } from 'vitest'

import { renderCalendarioView } from '../views/calendarioView.js'
import { renderConsultaView } from '../views/consultaView.js'
import { renderHomeView } from '../views/homeView.js'
import { renderMenuView } from '../views/menuView.js'
import { renderReferenciaView } from '../views/referenciaView.js'

// T1317 · Selectores del shell F13 + presupuesto del build (RNF-V04/RNF-V05
// heredados de F12; SC-F13-007/009). Lista cerrada de ids: `design/contracts/frontend.md` §3.
//
// NOTA para el visual-tester (T1317, riesgo R5): `.claude/skills/visual-testing-playwright/
// harness/selectors.json` aún describe las vistas podadas (login/registro/auditoría/
// programación). Este test queda limitado a los ids de F13 y **no** valida el harness:
// actualiza `selectors.json` a los ids de esta lista.

const TEST_DIR = import.meta.dirname
const FRONTEND_DIR = join(TEST_DIR, '..', '..')
const DIST_DIR = join(FRONTEND_DIR, 'dist')

const AVISO = 'Proyección teórica válida salvo modificaciones posteriores'

// Lista cerrada de ids/clases de `contracts/frontend.md` §3 (normativa).
const SHELL_IDS = ['#app-shell', '#aviso-proyeccion']
const REFERENCIA_IDS = [
  '#referencia-panel',
  '#referencia-form',
  '#referencia-fecha',
  '#referencia-turno',
  '#referencia-enviar',
  '#referencia-error',
]
const MENU_IDS = ['#menu-panel', '#menu-opciones', '#menu-fecha', '#menu-mes', '#menu-cambiar-referencia']
const CONSULTA_IDS = [
  '#consulta-form',
  '#consulta-fecha',
  '#consulta-enviar',
  '#consulta-error',
  '#consulta-volver-menu',
]
const CONSULTA_RESULTADO = ['#consulta-resultado', '.consulta-horario', '.consulta-proyeccion']
const CONSULTA_SIN_INFO = ['#consulta-sin-informacion']
const CALENDARIO_IDS = [
  '#calendario-form',
  '#calendario-mes',
  '#calendario-anio',
  '#calendario-ver',
  '#calendario-error',
  '#calendario-volver-menu',
]
const CALENDARIO_TABLA = ['#calendario-proyeccion', '#calendario-tabla', 'tr.calendario-dia']

function mount() {
  document.body.innerHTML = '<div id="app"></div>'
  return document.getElementById('app')
}

function renderConIds(root, ids) {
  for (const selector of ids) {
    expect(root.querySelector(selector), `falta ${selector}`).not.toBeNull()
  }
}

beforeAll(() => {
  // El presupuesto se mide sobre el build real (ADR-F12-003).
  execFileSync('npm', ['run', 'build'], { cwd: FRONTEND_DIR, stdio: 'pipe' })
}, 120_000)

describe('selectores del shell F13 (T1317)', () => {
  it('referencia expone la lista cerrada de §3.2', () => {
    const root = mount()
    renderHomeView(root, { estado: 'sin-referencia', referencia: null })
    renderReferenciaView(root.querySelector('#referencia-panel'), { onSubmit: () => {} })
    renderConIds(root, SHELL_IDS)
    renderConIds(root, REFERENCIA_IDS)
    expect(root.querySelector('#aviso-proyeccion').textContent).toBe(AVISO)
  })

  it('menú expone la lista cerrada de §3.3 y el resumen de la referencia', () => {
    const root = mount()
    renderHomeView(root, { estado: 'menu', referencia: { fecha: '2026-10-01', turno: 'diurno' } })
    renderMenuView(root.querySelector('#menu-panel'), {})
    renderConIds(root, SHELL_IDS)
    renderConIds(root, MENU_IDS)
    expect(root.querySelector('#referencia-resumen')).not.toBeNull()
  })

  it('consulta expone la lista cerrada de §3.4 en sus estados', () => {
    const rootC = mount()
    renderHomeView(rootC, { estado: 'fecha', referencia: { fecha: '2026-10-01', turno: 'diurno' } })
    renderConsultaView(rootC.querySelector('#consulta-panel'), {
      resultado: {
        fecha: '2026-10-01',
        turno: 'diurno',
        horario: { inicio: '2026-10-01T07:00:00', fin: '2026-10-01T19:00:00' },
        sinInformacion: false,
        esProyeccion: true,
      },
    })
    renderConIds(rootC, CONSULTA_IDS)
    renderConIds(rootC, CONSULTA_RESULTADO)

    const rootSinInfo = mount()
    renderHomeView(rootSinInfo, { estado: 'fecha', referencia: null })
    renderConsultaView(rootSinInfo.querySelector('#consulta-panel'), {
      resultado: {
        fecha: '2026-09-30',
        turno: null,
        horario: null,
        sinInformacion: true,
        esProyeccion: false,
      },
    })
    renderConIds(rootSinInfo, CONSULTA_SIN_INFO)
  })

  it('calendario expone la lista cerrada de §3.5 (año numérico 1–9999)', () => {
    const root = mount()
    renderHomeView(root, { estado: 'mes', referencia: { fecha: '2026-10-01', turno: 'diurno' } })
    renderCalendarioView(root.querySelector('#calendario-panel'), {
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
          {
            fecha: '2026-10-02',
            turno: null,
            horario: null,
            sinInformacion: true,
            esProyeccion: false,
          },
        ],
      },
    })
    renderConIds(root, CALENDARIO_IDS)
    renderConIds(root, CALENDARIO_TABLA)

    const inputAnio = root.querySelector('#calendario-anio')
    expect(inputAnio.getAttribute('min')).toBe('1')
    expect(inputAnio.getAttribute('max')).toBe('9999')
    expect(root.querySelector('tr.calendario-dia.sin-informacion')).not.toBeNull()
  })
})

describe('presupuesto del build (T1317)', () => {
  it('el build produce un único CSS sin recursos externos y dentro del presupuesto', () => {
    expect(existsSync(DIST_DIR), 'falta dist/, no se pudo construir').toBe(true)

    const assets = readdirSync(join(DIST_DIR, 'assets'))
    const cssFiles = assets.filter((name) => name.endsWith('.css'))
    expect(cssFiles, 'debe existir exactamente un CSS').toHaveLength(1)

    const cssPath = join(DIST_DIR, 'assets', cssFiles[0])
    const css = readFileSync(cssPath, 'utf8')
    const gzipBytes = gzipSync(Buffer.from(css)).length
    expect(gzipBytes, `CSS gzip ${gzipBytes} B > 15360 B`).toBeLessThanOrEqual(15 * 1024)

    const external = css.match(/https?:\/\/[^\s"')]+/g) ?? []
    expect(external, `URLs externas en el CSS: ${external.join(', ')}`).toEqual([])

    const html = readFileSync(join(DIST_DIR, 'index.html'), 'utf8')
    expect(html.match(/https?:\/\/[^\s"')]+/g) ?? []).toEqual([])
    expect(html).not.toMatch(/<link[^>]+href="https?:\/\//)
    expect(html).not.toMatch(/<script[^>]+src="https?:\/\//)

    const cssStat = statSync(cssPath)
    expect(cssStat.size).toBeGreaterThan(0)
  })
})
