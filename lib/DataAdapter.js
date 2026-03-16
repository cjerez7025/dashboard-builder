import * as XLSX from 'xlsx'

/**
 * DataAdapter — normalizes any data source into a unified schema
 */

// Detect column type from sample values
function detectType(values) {
  const nonEmpty = values.filter(v => v !== null && v !== undefined && v !== '')
  if (nonEmpty.length === 0) return 'string'

  const datePatterns = [
    /^\d{4}-\d{2}-\d{2}/,
    /^\d{2}\/\d{2}\/\d{4}/,
    /^\d{2}-\d{2}-\d{4}/,
    /^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)/i,
  ]
  const isDate = nonEmpty.slice(0, 5).every(v =>
    datePatterns.some(p => p.test(String(v))) || (!isNaN(Date.parse(String(v))) && isNaN(Number(v)))
  )
  if (isDate) return 'date'

  const numCount = nonEmpty.filter(v => {
    const cleaned = String(v).replace(/[$,%\s]/g, '')
    return !isNaN(parseFloat(cleaned)) && isFinite(cleaned)
  }).length
  if (numCount / nonEmpty.length > 0.75) return 'number'

  return 'string'
}

// Parse a numeric value from various formats
function parseNum(v) {
  if (v === null || v === undefined || v === '') return null
  if (typeof v === 'number') return v
  const cleaned = String(v).replace(/[$,%\s]/g, '')
  const n = parseFloat(cleaned)
  return isNaN(n) ? null : n
}

// Build the normalized dataset summary
function buildSummary(columns, rows) {
  const numericColumns     = columns.filter(c => c.type === 'number').map(c => c.name)
  const categoricalColumns = columns.filter(c => c.type === 'string').map(c => c.name)
  const dateColumns        = columns.filter(c => c.type === 'date').map(c => c.name)

  return {
    rowCount:   rows.length,
    columnCount: columns.length,
    numericColumns,
    categoricalColumns,
    dateColumns,
  }
}

// Normalize rows — coerce numeric columns to numbers
function normalizeRows(rows, columns) {
  const numCols = new Set(columns.filter(c => c.type === 'number').map(c => c.name))
  return rows.map(row => {
    const out = { ...row }
    numCols.forEach(col => {
      if (out[col] !== undefined) out[col] = parseNum(out[col])
    })
    return out
  })
}

// Build columns array with samples
function buildColumns(rows) {
  if (!rows.length) return []
  const keys = Object.keys(rows[0])
  return keys.map(name => {
    const values = rows.map(r => r[name]).filter(Boolean).slice(0, 20)
    const type   = detectType(values)
    const sample = values.slice(0, 3)
    return { name, type, sample }
  })
}

/** CSV text → rows */
function parseCSV(text) {
  // Dynamic import for browser-safe usage
  const lines = text.trim().split('\n')
  if (lines.length < 2) throw new Error('CSV must have at least a header row and one data row')

  const sep = text.includes('\t') ? '\t' : ','
  const headers = lines[0].split(sep).map(h => h.replace(/^"|"$/g, '').trim())

  return lines.slice(1)
    .filter(l => l.trim())
    .map(line => {
      // Handle quoted fields
      const vals = []
      let cur = '', inQ = false
      for (let i = 0; i < line.length; i++) {
        const ch = line[i]
        if (ch === '"') { inQ = !inQ; continue }
        if (ch === sep && !inQ) { vals.push(cur.trim()); cur = ''; continue }
        cur += ch
      }
      vals.push(cur.trim())

      const row = {}
      headers.forEach((h, i) => { row[h] = vals[i] ?? '' })
      return row
    })
}

/** Main entry point */
export async function loadData(source) {
  let rows = []

  switch (source.type) {
    case 'sheets': {
      // Build URL — include gid if user selected a specific tab
      let apiUrl = `/api/data?url=${encodeURIComponent(source.url)}`
      if (source.gid) apiUrl += `&gid=${source.gid}`
      const res = await fetch(apiUrl)
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || 'Error al cargar Google Sheets')
      }
      const data = await res.json()
      rows = data.rows
      break
    }

    case 'csv': {
      // source.text OR source.file
      let text = source.text
      if (!text && source.file) {
        text = await source.file.text()
      }
      if (!text) throw new Error('No CSV data provided')

      if (source.file?.name?.endsWith('.xlsx') || source.file?.name?.endsWith('.xls')) {
        // Excel via SheetJS — use selected sheet index if provided
        const ab   = await source.file.arrayBuffer()
        const wb   = XLSX.read(ab)
        const idx  = source.sheetIndex ?? 0
        const sheetName = wb.SheetNames[idx] || wb.SheetNames[0]
        if (!sheetName) throw new Error('No se encontró la hoja seleccionada')
        rows = XLSX.utils.sheet_to_json(wb.Sheets[sheetName])
      } else {
        rows = parseCSV(text)
      }
      break
    }

    case 'json': {
      const res = await fetch(source.url, {
        headers: source.headers || {},
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`)
      const json = await res.json()
      rows = Array.isArray(json) ? json : json.data || json.rows || json.results || []
      if (!Array.isArray(rows)) throw new Error('Could not find an array in the JSON response')
      break
    }

    case 'paste': {
      const text = source.text?.trim()
      if (!text) throw new Error('No data pasted')
      // Try JSON first
      if (text.startsWith('[') || text.startsWith('{')) {
        try {
          const json = JSON.parse(text)
          rows = Array.isArray(json) ? json : [json]
        } catch {
          rows = parseCSV(text)
        }
      } else {
        rows = parseCSV(text)
      }
      break
    }

    case 'pbi_model': {
      // Dataset already built by PowerBIReader — pass through
      if (!source.dataset) throw new Error('No dataset provided from Power BI model')
      return source.dataset
    }

    default:
      throw new Error(`Unknown source type: ${source.type}`)
  }

  if (!Array.isArray(rows) || rows.length === 0) {
    throw new Error('No data rows found in the source')
  }

  const columns = buildColumns(rows)
  const normalized = normalizeRows(rows, columns)
  const summary = buildSummary(columns, normalized)

  return { columns, rows: normalized, summary }
}

/** Compute an aggregation on rows for a given column */
export function aggregate(rows, col, agg) {
  const vals = rows.map(r => r[col]).filter(v => v !== null && v !== undefined)

  switch (agg) {
    case 'count':        return rows.length
    case 'sum':          return vals.reduce((a, b) => a + (Number(b) || 0), 0)
    case 'avg':          { const nums = vals.map(Number).filter(n => !isNaN(n)); return nums.length ? nums.reduce((a, b) => a + b, 0) / nums.length : 0 }
    case 'max':          return Math.max(...vals.map(Number).filter(n => !isNaN(n)))
    case 'min':          return Math.min(...vals.map(Number).filter(n => !isNaN(n)))
    case 'distinctcount':return new Set(vals).size
    default:             return vals.length
  }
}

/** Group rows by a categorical column and compute metric */
export function groupBy(rows, groupCol, metricCol, agg, limit = 20, sortBy = 'value', sortDir = 'desc') {
  const groups = {}

  rows.forEach(row => {
    const key = row[groupCol] ?? '(empty)'
    if (!groups[key]) groups[key] = []
    groups[key].push(row)
  })

  let result = Object.entries(groups).map(([name, groupRows]) => ({
    name: String(name),
    value: aggregate(groupRows, metricCol, agg),
  }))

  if (sortBy === 'value') {
    result.sort((a, b) => sortDir === 'desc' ? b.value - a.value : a.value - b.value)
  } else {
    result.sort((a, b) => sortDir === 'desc' ? b.name.localeCompare(a.name) : a.name.localeCompare(b.name))
  }

  return result.slice(0, limit)
}

/** Group rows by date + metric for time series */
export function timeSeries(rows, dateCol, metricCol, agg) {
  const groups = {}

  rows.forEach(row => {
    const raw = row[dateCol]
    if (!raw) return
    const d = new Date(raw)
    if (isNaN(d)) return
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    if (!groups[key]) groups[key] = []
    groups[key].push(row)
  })

  return Object.entries(groups)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, groupRows]) => ({
      date,
      value: aggregate(groupRows, metricCol, agg),
    }))
}

/** Format a number for display */
export function formatValue(value, format = 'number') {
  if (value === null || value === undefined || isNaN(value)) return '—'
  const n = Number(value)

  switch (format) {
    case 'currency':
      if (Math.abs(n) >= 1e9) return `$${(n / 1e9).toFixed(1)}B`
      if (Math.abs(n) >= 1e6) return `$${(n / 1e6).toFixed(1)}M`
      if (Math.abs(n) >= 1e3) return `$${(n / 1e3).toFixed(1)}K`
      return `$${n.toFixed(2)}`
    case 'percent':
      return `${n.toFixed(1)}%`
    case 'number':
    default:
      if (Math.abs(n) >= 1e9) return `${(n / 1e9).toFixed(1)}B`
      if (Math.abs(n) >= 1e6) return `${(n / 1e6).toFixed(1)}M`
      if (Math.abs(n) >= 1e3) return `${(n / 1e3).toFixed(1)}K`
      return n % 1 === 0 ? n.toLocaleString() : n.toFixed(2)
  }
}
