/**
 * GET /api/data
 *   ?url=<google-sheets-url>             → fetch sheet data (CSV)
 *   ?url=<url>&action=list_sheets        → list all sheet tabs
 *   ?url=<url>&gid=<gid>                 → fetch specific sheet tab
 */

export const runtime = 'nodejs'

function extractSheetId(url) {
  const match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/)
  return match ? match[1] : null
}

function parseCSVtoRows(csv) {
  const lines = csv.trim().split('\n')
  if (lines.length < 2) return []
  const headers = lines[0].split(',').map(h => h.replace(/^"|"$/g, '').trim())
  return lines.slice(1).filter(l => l.trim()).map(line => {
    const vals = []
    let cur = '', inQ = false
    for (let i = 0; i < line.length; i++) {
      const ch = line[i]
      if (ch === '"') { inQ = !inQ; continue }
      if (ch === ',' && !inQ) { vals.push(cur.trim()); cur = ''; continue }
      cur += ch
    }
    vals.push(cur.trim())
    const row = {}
    headers.forEach((h, i) => { row[h] = vals[i] ?? '' })
    return row
  })
}

// Fetch list of sheet tabs from the HTML page (Google Sheets makes them visible)
async function fetchSheetTabs(sheetId) {
  try {
    const res = await fetch(`https://docs.google.com/spreadsheets/d/${sheetId}/edit`, {
      headers: { 'User-Agent': 'Mozilla/5.0' }
    })
    if (!res.ok) return null
    const html = await res.text()

    // Tabs are encoded in the page as JSON — find all sheet name+gid pairs
    const tabs = []

    // Pattern 1: "name","sheets","...","gid" in bootstrapData
    const matches = [...html.matchAll(/"sheetId":(\d+),"title":"([^"]+)"/g)]
    matches.forEach(m => {
      tabs.push({ gid: m[1], name: m[2] })
    })

    // Pattern 2: look for data-id attributes on tab elements
    if (tabs.length === 0) {
      const tabMatches = [...html.matchAll(/data-id="(\d+)"[^>]*>([^<]+)</g)]
      tabMatches.forEach(m => {
        const name = m[2].trim()
        if (name && !tabs.find(t => t.gid === m[1])) {
          tabs.push({ gid: m[1], name })
        }
      })
    }

    return tabs.length > 0 ? tabs : null
  } catch {
    return null
  }
}

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const url    = searchParams.get('url')
  const action = searchParams.get('action')
  const gid    = searchParams.get('gid')

  if (!url) return Response.json({ error: 'Missing url parameter' }, { status: 400 })

  const sheetId = extractSheetId(url)
  if (!sheetId) {
    return Response.json({
      error: 'No se pudo extraer el ID del Sheet. Pega la URL completa de Google Sheets.'
    }, { status: 400 })
  }

  // ── Action: list sheet tabs ────────────────────────────────────────────
  if (action === 'list_sheets') {
    const tabs = await fetchSheetTabs(sheetId)
    if (tabs && tabs.length > 1) {
      return Response.json({ tabs })
    }
    // Fallback — return single default tab
    return Response.json({ tabs: [{ gid: '0', name: 'Hoja 1' }] })
  }

  // ── Action: fetch sheet data ───────────────────────────────────────────
  // Use gid from param, or extract from URL, or default to 0
  const resolvedGid = gid || url.match(/[#&]gid=(\d+)/)?.[1] || '0'
  const exportUrl   = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=${resolvedGid}`

  try {
    const res = await fetch(exportUrl, {
      headers: { 'User-Agent': 'DashboardBuilder/1.0' },
    })

    if (!res.ok) {
      if (res.status === 401 || res.status === 403) {
        return Response.json({
          error: 'Acceso denegado. El Sheet debe ser "Cualquier persona con el enlace puede ver".',
        }, { status: 403 })
      }
      return Response.json({ error: `Error al obtener el sheet: HTTP ${res.status}` }, { status: res.status })
    }

    const csv  = await res.text()
    const rows = parseCSVtoRows(csv)

    if (rows.length === 0) {
      return Response.json({ error: 'La hoja parece estar vacía.' }, { status: 400 })
    }

    return Response.json({ rows, rowCount: rows.length })
  } catch (err) {
    return Response.json({ error: `Error de red: ${err.message}` }, { status: 500 })
  }
}
