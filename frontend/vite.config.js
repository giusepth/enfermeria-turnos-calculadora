import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vitest/config'

// F12 (T1201/T1207, RNF-V04): Tailwind v4 antepone al CSS un banner de licencia
// con la URL `https://tailwindcss.com`. Se elimina del bundle para que el CSS
// construido no contenga ninguna URL externa (el banner es solo un comentario).
const stripTailwindBanner = {
  name: 'strip-tailwind-banner',
  generateBundle(_options, bundle) {
    for (const asset of Object.values(bundle)) {
      if (asset.type === 'asset' && asset.fileName.endsWith('.css')) {
        asset.source = String(asset.source).replace(/\/\*!\s*tailwindcss[^*]*\*\//g, '')
      }
    }
  },
}

export default defineConfig({
  plugins: [tailwindcss(), stripTailwindBanner],
  build: {
    // F13 (Q1/Q2, T1319): sin polyfill de modulepreload — su `fetch()` interno
    // contaminaría el grep de prohibiciones del bundle y no hace falta en
    // navegadores modernos (el entregable es un estático servido tal cual).
    modulePreload: { polyfill: false },
  },
  server: {
    host: true,
    port: 5173,
  },
  test: {
    environment: 'happy-dom',
    include: ['src/**/*.test.js'],
  },
})
