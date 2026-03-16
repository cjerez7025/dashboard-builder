/**
 * SessionManager — Guarda y carga sesiones de dashboard como archivo JSON
 * Opción 2: JSON descargable + importar
 */

export const SESSION_VERSION = '1.0'

/**
 * Construye el objeto sesión completo
 */
export function buildSession({ config, rows, chatHistory, themeId, datasetMeta }) {
  return {
    version:     SESSION_VERSION,
    savedAt:     new Date().toISOString(),
    name:        config?.title || 'Dashboard sin título',
    themeId,
    chatHistory: (chatHistory || []).map(m => ({
      role:    m.role,
      content: m.content,
      status:  m.status,
      // No guardamos config completo por tamaño — solo el prompt
    })),
    config,
    datasetMeta: datasetMeta || null,
    // Guardamos muestra de rows (primeras 500 para no pesar demasiado)
    rowsSample: rows?.slice(0, 500) || [],
    rowsTotal:  rows?.length || 0,
  }
}

/**
 * Descarga la sesión como archivo .dbsession.json
 */
export function downloadSession(session) {
  const slug = (session.name || 'dashboard')
    .replace(/[^a-zA-Z0-9\s]/g, '')
    .trim().replace(/\s+/g, '_')
    .toLowerCase()
    .slice(0, 40)

  const date = new Date(session.savedAt)
    .toISOString().slice(0, 10)

  const filename = `${slug}_${date}.dbsession.json`

  const blob = new Blob(
    [JSON.stringify(session, null, 2)],
    { type: 'application/json;charset=utf-8' }
  )
  const url = URL.createObjectURL(blob)
  const a   = document.createElement('a')
  a.href     = url
  a.download = filename
  a.style.display = 'none'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  setTimeout(() => URL.revokeObjectURL(url), 1000)
  return filename
}

/**
 * Lee un archivo .dbsession.json y retorna la sesión
 */
export function loadSessionFromFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const session = JSON.parse(e.target.result)
        if (!session.config || !session.version) {
          reject(new Error('Archivo inválido — no es una sesión de Dashboard Builder'))
          return
        }
        resolve(session)
      } catch {
        reject(new Error('Error al leer el archivo. Asegúrate de que sea un .dbsession.json válido'))
      }
    }
    reader.onerror = () => reject(new Error('Error al leer el archivo'))
    reader.readAsText(file)
  })
}

/**
 * Guarda lista de sesiones recientes en localStorage (solo metadatos, sin datos pesados)
 */
export function saveToRecentList(session) {
  try {
    const raw     = localStorage.getItem('db_recent_sessions') || '[]'
    const list    = JSON.parse(raw)
    const entry   = {
      id:      `${Date.now()}`,
      name:    session.name,
      savedAt: session.savedAt,
      themeId: session.themeId,
      visuals: session.config?.visuals?.length || 0,
      prompts: session.chatHistory?.filter(m => m.role === 'user').length || 0,
    }
    // Remove duplicates by name, keep latest
    const filtered = list.filter(s => s.name !== entry.name)
    const updated  = [entry, ...filtered].slice(0, 20) // max 20 recientes
    localStorage.setItem('db_recent_sessions', JSON.stringify(updated))
    return updated
  } catch {
    return []
  }
}

export function getRecentList() {
  try {
    return JSON.parse(localStorage.getItem('db_recent_sessions') || '[]')
  } catch {
    return []
  }
}

export function removeFromRecentList(id) {
  try {
    const list    = getRecentList()
    const updated = list.filter(s => s.id !== id)
    localStorage.setItem('db_recent_sessions', JSON.stringify(updated))
    return updated
  } catch {
    return []
  }
}
