/**
 * Advertencia estática de proyección (RN-10+RN-15, Q10, SC-F13-006).
 *
 * Texto canónico fijado por `design/contracts/frontend.md` §6.1 (ADR-F13-010):
 * permanente en el shell, sin datos dinámicos.
 */
export const AVISO_PROYECCION = 'Proyección teórica válida salvo modificaciones posteriores'

/** HTML de la advertencia (`#aviso-proyeccion`), texto estático. */
export function renderAvisoProyeccion() {
  return `<p id="aviso-proyeccion" class="aviso-proyeccion">${AVISO_PROYECCION}</p>`
}
