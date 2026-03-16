'use client'
import { useState } from 'react'
import styles from './PowerBIExport.module.css'

export default function PowerBIExport({ config, dataSource, onClose }) {
  // Auto-fill URL and src from the loaded data source
  const initUrl = dataSource?.type === 'sheets' ? (dataSource.url || '') : ''
  const initSrc = dataSource?.type === 'sheets' ? 'sheets'
                : dataSource?.type === 'json'   ? 'json'
                : 'sheets'
  const [src,      setSrc]      = useState(initSrc)
  const [url,      setUrl]      = useState(initUrl)
  const [refresh,  setRefresh]  = useState('300')
  const [themeId,  setThemeId]  = useState('')
  const [showTitle,setShowTitle]= useState(true)
  const [copied,   setCopied]   = useState(false)

  // Build embed URL
  // Convert any Google Sheets URL to the CSV export format
  function normalizeSheetUrl(rawUrl) {
    if (!rawUrl) return ''
    try {
      // Extract sheet ID
      const idMatch = rawUrl.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/)
      if (!idMatch) return rawUrl
      const sheetId = idMatch[1]
      // Extract gid — from ?gid=, #gid= or &gid=
      const gidMatch = rawUrl.match(/[?#&]gid=(\d+)/)
      const gid = gidMatch ? gidMatch[1] : '0'
      return `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=${gid}`
    } catch {
      return rawUrl
    }
  }

  function buildUrl() {
    try {
      const base    = window.location.origin
      // Use btoa with UTF-8 safe encoding
      const cfgJson = JSON.stringify(config)
      const cfgB64  = btoa(encodeURIComponent(cfgJson).replace(/%([0-9A-F]{2})/g,
        (_, p1) => String.fromCharCode(parseInt(p1, 16))))
      const cleanUrl = src === 'sheets' ? normalizeSheetUrl(url.trim()) : url.trim()
      const params   = new URLSearchParams()
      params.set('src',    src)
      if (cleanUrl)        params.set('url',    cleanUrl)
      params.set('config', cfgB64)
      if (refresh !== '0') params.set('refresh', refresh)
      if (themeId)         params.set('theme',   themeId)
      if (!showTitle)      params.set('title',   '0')
      return `${base}/embed?${params.toString()}`
    } catch {
      return ''
    }
  }

  const embedUrl = buildUrl()

  function copyUrl() {
    navigator.clipboard.writeText(embedUrl).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  const iframeCode = `<iframe
  src="${embedUrl}"
  width="100%"
  height="800"
  frameborder="0"
  allowtransparency="true"
  style="border:none;border-radius:12px;"
/>`

  const REFRESH_OPTIONS = [
    { v:'0',    l:'Sin auto-refresh' },
    { v:'60',   l:'Cada 1 minuto' },
    { v:'300',  l:'Cada 5 minutos' },
    { v:'900',  l:'Cada 15 minutos' },
    { v:'3600', l:'Cada hora' },
  ]

  return (
    <div className={styles.overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div className={styles.modal}>

        <div className={styles.header}>
          <div className={styles.title}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M21 3H3v18l4-4h14V3z" fill="#F2C811"/>
              <rect x="7" y="7" width="10" height="2" rx="1" fill="#1A1A1A"/>
              <rect x="7" y="11" width="7"  height="2" rx="1" fill="#1A1A1A"/>
            </svg>
            Exportar para Power BI
          </div>
          <button className="btn btn-ghost" style={{ fontSize:12 }} onClick={onClose}>✕</button>
        </div>

        <div className={styles.body}>

          {/* Step 1 — Data source */}
          <div className={styles.step}>
            <div className={styles.stepNum}>1</div>
            <div className={styles.stepBody}>
              <p className={styles.stepTitle}>Origen de datos dinámico</p>
              <p className={styles.stepSub}>Cuando los datos cambian, el panel se actualiza solo</p>

              <div className={styles.srcTabs}>
                {[
                  { id:'sheets',  label:'Google Sheets', icon:'📊' },
                  { id:'json',    label:'JSON URL',       icon:'🔗' },
                  { id:'csv_url', label:'CSV URL',        icon:'📄' },
                ].map(t => (
                  <button key={t.id}
                    className={`${styles.srcTab} ${src===t.id ? styles.srcTabActive : ''}`}
                    onClick={() => setSrc(t.id)}>
                    {t.icon} {t.label}
                  </button>
                ))}
              </div>

              <input className="input" style={{ fontSize:12 }}
                placeholder={
                  src === 'sheets'  ? 'https://docs.google.com/spreadsheets/d/...' :
                  src === 'json'    ? 'https://api.ejemplo.com/datos' :
                                     'https://ejemplo.com/datos.csv'
                }
                value={url}
                onChange={e => setUrl(e.target.value)}
              />
              {src === 'sheets' && (
                <p className={styles.hint}>El Sheet debe ser "Cualquier persona con el enlace puede ver"</p>
              )}
            </div>
          </div>

          {/* Step 2 — Refresh */}
          <div className={styles.step}>
            <div className={styles.stepNum}>2</div>
            <div className={styles.stepBody}>
              <p className={styles.stepTitle}>Auto-refresh</p>
              <p className={styles.stepSub}>Cada cuánto tiempo se recargan los datos automáticamente</p>
              <div className={styles.refreshGrid}>
                {REFRESH_OPTIONS.map(o => (
                  <button key={o.v}
                    className={`${styles.refreshBtn} ${refresh===o.v ? styles.refreshBtnActive : ''}`}
                    onClick={() => setRefresh(o.v)}>
                    {o.l}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Step 3 — Options */}
          <div className={styles.step}>
            <div className={styles.stepNum}>3</div>
            <div className={styles.stepBody}>
              <p className={styles.stepTitle}>Opciones</p>
              <label className={styles.checkbox}>
                <input type="checkbox" checked={showTitle}
                  onChange={e => setShowTitle(e.target.checked)} />
                <span>Mostrar título del dashboard</span>
              </label>
            </div>
          </div>

          {/* Step 4 — URL generada */}
          <div className={styles.step}>
            <div className={styles.stepNum}>4</div>
            <div className={styles.stepBody}>
              <p className={styles.stepTitle}>URL generada</p>
              <div className={styles.urlBox}>
                <span className={styles.urlText}>{embedUrl}</span>
                <button className={`btn btn-primary ${styles.copyBtn}`} onClick={copyUrl}>
                  {copied ? '✓ Copiada' : 'Copiar URL'}
                </button>
              </div>
            </div>
          </div>

          {/* Step 5 — Instructions */}
          <div className={styles.instructions}>
            <p className={styles.instrTitle}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M21 3H3v18l4-4h14V3z" fill="#F2C811"/>
              </svg>
              Cómo agregar en Power BI
            </p>
            <ol className={styles.instrList}>
              <li>Abre Power BI Desktop</li>
              <li>Ve a <strong>Inicio → Obtener datos → Web</strong></li>
              <li>En la URL ingresa la dirección de arriba y confirma</li>
              <li>Power BI cargará el panel como contenido web</li>
              <li><strong>Alternativa:</strong> Usa el visual <em>HTML Viewer</em> de Powerviz (AppSource) y pega la URL directamente</li>
            </ol>

            <div className={styles.iframeSection}>
              <p className={styles.instrTitle} style={{ marginTop:12 }}>O incrusta directamente con iframe</p>
              <pre className={styles.code}>{iframeCode}</pre>
              <button className="btn btn-ghost" style={{ fontSize:11 }}
                onClick={() => { navigator.clipboard.writeText(iframeCode); setCopied(true); setTimeout(()=>setCopied(false),2000) }}>
                {copied ? '✓ Copiado' : 'Copiar código iframe'}
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
