'use client'
import { useState, useRef, useEffect } from 'react'
import styles from './ExportMenu.module.css'

// ── Pure browser download — zero dependencies ──────────────────────────────
function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob)
  const a   = document.createElement('a')
  a.setAttribute('href', url)
  a.setAttribute('download', filename)
  a.setAttribute('style', 'display:none')
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

function safeTitle(config) {
  return (config?.title || 'dashboard')
    .replace(/[^a-zA-Z0-9_\-\s]/g, '')
    .trim().replace(/\s+/g, '_').toLowerCase() || 'dashboard'
}

// ── JSON — native, no deps ─────────────────────────────────────────────────
function runJSON(config, title) {
  const blob = new Blob(
    [JSON.stringify(config, null, 2)],
    { type: 'application/json;charset=utf-8' }
  )
  downloadBlob(blob, `${title}_config.json`)
}

// ── CSV — native, no deps ──────────────────────────────────────────────────
function runCSV(rows, title) {
  const headers = Object.keys(rows[0])
  function esc(v) {
    const s = (v === null || v === undefined) ? '' : String(v)
    if (s.includes(',') || s.includes('"') || s.includes('\n')) {
      return '"' + s.replace(/"/g, '""') + '"'
    }
    return s
  }
  const lines = [
    headers.join(','),
    ...rows.map(r => headers.map(h => esc(r[h])).join(','))
  ]
  const blob = new Blob(
    ['\uFEFF' + lines.join('\r\n')],
    { type: 'text/csv;charset=utf-8' }
  )
  downloadBlob(blob, `${title}.csv`)
}

// ── Excel — uses xlsx via dynamic import ───────────────────────────────────
async function runExcel(rows, config, title) {
  let XLSX
  try {
    const mod = await import('xlsx')
    XLSX = mod.default ?? mod
  } catch (e) {
    throw new Error('No se pudo cargar la librería xlsx: ' + e.message)
  }

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), 'Datos')

  if (config?.visuals) {
    config.visuals
      .filter(v => v.type === 'table' && Array.isArray(v.config?.columns))
      .slice(0, 4)
      .forEach(v => {
        const filtered = rows.map(r => {
          const o = {}
          v.config.columns.forEach(c => { o[c] = r[c] })
          return o
        })
        XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(filtered), v.title.slice(0, 31))
      })
  }

  const b64 = XLSX.write(wb, { bookType: 'xlsx', type: 'base64' })
  const raw = atob(b64)
  const buf = new Uint8Array(raw.length)
  for (let i = 0; i < raw.length; i++) buf[i] = raw.charCodeAt(i)
  downloadBlob(
    new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }),
    `${title}.xlsx`
  )
}

// ── PNG — uses html2canvas ─────────────────────────────────────────────────
async function runPNG(elementId, title) {
  const el = document.getElementById(elementId)
  if (!el) throw new Error('No se encontró el dashboard. Asegúrate de que esté visible en pantalla.')

  let html2canvas
  try {
    const mod = await import('html2canvas')
    html2canvas = mod.default ?? mod
  } catch (e) {
    throw new Error('No se pudo cargar html2canvas: ' + e.message)
  }

  const canvas = await html2canvas(el, {
    scale: 2,
    backgroundColor: '#07091A',
    useCORS: true,
    allowTaint: true,
    logging: false,
    foreignObjectRendering: false,
    ignoreElements: el => el.tagName === 'IFRAME',
  })

  await new Promise((resolve, reject) => {
    canvas.toBlob(
      blob => {
        if (!blob) { reject(new Error('No se pudo generar la imagen')); return }
        downloadBlob(blob, `${title}.png`)
        resolve()
      },
      'image/png',
      1.0
    )
  })
}

// ── PDF — uses html2canvas + jspdf ────────────────────────────────────────
async function runPDF(elementId, title) {
  const el = document.getElementById(elementId)
  if (!el) throw new Error('No se encontró el dashboard. Asegúrate de que esté visible en pantalla.')

  let html2canvas, jsPDF
  try {
    const mod = await import('html2canvas')
    html2canvas = mod.default ?? mod
  } catch (e) {
    throw new Error('No se pudo cargar html2canvas: ' + e.message)
  }
  try {
    const mod = await import('jspdf')
    jsPDF = mod.jsPDF ?? mod.default
  } catch (e) {
    throw new Error('No se pudo cargar jsPDF: ' + e.message)
  }

  const canvas = await html2canvas(el, {
    scale: 1.5,
    backgroundColor: '#07091A',
    useCORS: true,
    logging: false,
    foreignObjectRendering: false,
  })

  const W   = canvas.width  / 1.5
  const H   = canvas.height / 1.5
  const pdf = new jsPDF({
    orientation: W > H ? 'landscape' : 'portrait',
    unit:        'px',
    format:      [W, H],
    compress:    true,
  })
  pdf.addImage(canvas.toDataURL('image/jpeg', 0.9), 'JPEG', 0, 0, W, H)
  pdf.save(`${title}.pdf`)
}

// ── Component ──────────────────────────────────────────────────────────────
const FORMATS = [
  { id: 'json',  label: 'JSON Config',  icon: '⚙️', desc: 'Configuración del dashboard' },
  { id: 'csv',   label: 'CSV',          icon: '📊', desc: 'Datos en texto plano'         },
  { id: 'excel', label: 'Excel .xlsx',  icon: '📗', desc: 'Archivo con hojas de datos'   },
  { id: 'png',   label: 'PNG',          icon: '🖼️', desc: 'Captura del dashboard'        },
  { id: 'pdf',   label: 'PDF',          icon: '📄', desc: 'Documento imprimible'         },
  { id: 'powerbi', label: 'Power BI',     icon: '⚡', desc: 'Panel dinámico con iframe'    },
]

export default function ExportMenu({ config, rows, onPowerBI }) {
  const [open,  setOpen]  = useState(false)
  const [busy,  setBusy]  = useState(null)
  const [done,  setDone]  = useState(null)
  const [error, setError] = useState(null)
  const menuRef           = useRef()

  useEffect(() => {
    function handler(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpen(false)
        setError(null)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  async function handleClick(id) {
    if (busy) return
    setBusy(id)
    setError(null)
    setDone(null)

    const title = safeTitle(config)

    try {
      switch (id) {
        case 'json':    runJSON(config, title);                  break
        case 'csv':     runCSV(rows, title);                     break
        case 'excel':   await runExcel(rows, config, title);     break
        case 'png':     await runPNG('dashboard-render', title); break
        case 'pdf':     await runPDF('dashboard-render', title); break
        case 'powerbi': onPowerBI?.(); setOpen(false);           return
      }
      setDone(id)
      setTimeout(() => { setDone(null); setOpen(false) }, 1500)
    } catch (err) {
      console.error('[Export]', id, err)
      setError(err.message)
    } finally {
      setBusy(null)
    }
  }

  const noRows = !rows?.length

  return (
    <div className={styles.wrap} ref={menuRef}>
      <button
        className="btn btn-secondary"
        style={{ fontSize: 12 }}
        onClick={() => { setOpen(o => !o); setError(null) }}
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
          <polyline points="7,10 12,15 17,10"/>
          <line x1="12" y1="15" x2="12" y2="3"/>
        </svg>
        Export
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
          style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform .15s' }}>
          <polyline points="6,9 12,15 18,9"/>
        </svg>
      </button>

      {open && (
        <div className={`${styles.menu} fade-up`}>
          <p className={styles.title}>Exportar como</p>

          {FORMATS.map(f => {
            const disabled = !!busy || (['csv', 'excel'].includes(f.id) && noRows)
            const isBusy   = busy === f.id
            const isDone   = done === f.id

            return (
              <button
                key={f.id}
                className={`${styles.item} ${isDone ? styles.done : ''}`}
                onClick={() => handleClick(f.id)}
                disabled={disabled}
              >
                <span className={styles.icon}>
                  {isBusy
                    ? <span className="spinner" style={{ width: 13, height: 13 }} />
                    : isDone ? '✓' : f.icon}
                </span>
                <span className={styles.text}>
                  <span className={styles.label}>{f.label}</span>
                  <span className={styles.desc}>
                    {['csv', 'excel'].includes(f.id) && noRows ? 'Sin datos cargados' : f.desc}
                  </span>
                </span>
              </button>
            )
          })}

          {error && (
            <div className={styles.error}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                strokeWidth="2" style={{ flexShrink: 0, marginTop: 1 }}>
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              <span>{error}</span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
