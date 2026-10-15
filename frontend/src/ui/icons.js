/*
 * Iconografía de la app: SVG dibujados a mano, un solo trazo (1.75) y
 * `currentColor` para heredar el color del contexto. Sin emoji ni fuentes
 * externas (la build prohíbe URLs remotas).
 */

function svg(paths) {
  return `<svg class="icon" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${paths}</svg>`
}

const PATHS = {
  calendarPlus:
    '<rect x="3" y="4.5" width="18" height="16" rx="2.5"/><path d="M3 9.5h18"/><path d="M8 3v3M16 3v3"/><path d="M12 12.5v5M9.5 15h5"/>',
  calendar:
    '<rect x="3" y="4.5" width="18" height="16" rx="2.5"/><path d="M3 9.5h18"/><path d="M8 3v3M16 3v3"/><path d="M7.5 13.5h2M11 13.5h2M14.5 13.5h2M7.5 17h2M11 17h2"/>',
  search: '<circle cx="11" cy="11" r="6.5"/><path d="M20 20l-3.7-3.7"/>',
  history:
    '<path d="M3.75 12a8.25 8.25 0 1 0 2.4-5.83"/><path d="M3.75 4.5V9.5H8.5"/><path d="M12 8v4.4l2.9 1.9"/>',
  user: '<circle cx="12" cy="8.5" r="3.6"/><path d="M5.25 19.5a6.75 6.75 0 0 1 13.5 0"/>',
  logout:
    '<path d="M14.5 4.5H6.75A1.75 1.75 0 0 0 5 6.25v11.5A1.75 1.75 0 0 0 6.75 19.5H14.5"/><path d="M18.5 12H9.75"/><path d="M15.75 8.75 19 12l-3.25 3.25"/>',
  list:
    '<path d="M8.5 6.5H20M8.5 12H20M8.5 17.5H20"/><circle cx="4.25" cy="6.5" r="1.1"/><circle cx="4.25" cy="12" r="1.1"/><circle cx="4.25" cy="17.5" r="1.1"/>',
  arrowRight: '<path d="M5 12h13"/><path d="M13 7l5 5-5 5"/>',
}

export function icon(name) {
  return svg(PATHS[name] ?? '')
}
