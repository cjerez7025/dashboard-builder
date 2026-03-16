'use client'
import { useState, useRef } from 'react'
import styles from './SourceSelector.module.css'
import PowerBIImporter from './PowerBIImporter'
import { detectExcelSheets, detectGoogleSheetTabs } from '@/lib/SheetDetector'

const TABS = [
  { id: 'sheets', label: 'Google Sheets', icon: '📊' },
  { id: 'excel',  label: 'Excel',         icon: '📗' },
  { id: 'csv',    label: 'CSV',           icon: '📄' },
  { id: 'json',   label: 'JSON URL',      icon: '🔗' },
  { id: 'paste',  label: 'Pegar datos',   icon: '📋' },
  { id: 'pbi',    label: 'Power BI',      icon: '📈' },
]

export default function SourceSelector({ onLoad, loading, onDirectConvert }) {
  const [tab,         setTab]         = useState('sheets')
  const [sheetsUrl,   setSheetsUrl]   = useState('')
  const [jsonUrl,     setJsonUrl]     = useState('')
  const [jsonHeaders, setJsonHeaders] = useState('')
  const [pasteText,   setPasteText]   = useState('')
  const [dragOver,    setDragOver]    = useState(false)
  const [fileObj,     setFileObj]     = useState(null)
  const [fileInfo,    setFileInfo]    = useState(null)
  const [localError,  setLocalError]  = useState(null)

  // Sheet detection state
  const [sheets,          setSheets]          = useState(null)
  const [selectedSheet,   setSelectedSheet]   = useState(null)
  const [detectingSheets, setDetectingSheets] = useState(false)

  const fileRef = useRef()

  // ── Reset sheets when switching tabs ────────────────────────────────────
  function switchTab(id) {
    setTab(id)
    setSheets(null)
    setSelectedSheet(null)
    setLocalError(null)
    setFileObj(null)
    setFileInfo(null)
  }

  // ── Excel file handling ─────────────────────────────────────────────────
  async function handleExcelFile(file) {
    if (!file) return
    setFileObj(file)
    setFileInfo({ name: file.name, size: (file.size / 1024).toFixed(1) + ' KB' })
    setSheets(null)
    setSelectedSheet(null)
    setLocalError(null)
    setDetectingSheets(true)

    try {
      const detected = await detectExcelSheets(file)
      console.log('[SheetDetector] Excel sheets:', detected)
      setSheets(detected)
      setSelectedSheet(detected[0])
    } catch (e) {
      console.error('[SheetDetector] Excel error:', e)
      setLocalError('Error leyendo hojas: ' + e.message)
      setSheets([{ index: 0, name: 'Hoja 1' }])
      setSelectedSheet({ index: 0, name: 'Hoja 1' })
    } finally {
      setDetectingSheets(false)
    }
  }

  // ── CSV file handling ───────────────────────────────────────────────────
  function handleCSVFile(file) {
    if (!file) return
    setFileObj(file)
    setFileInfo({ name: file.name, size: (file.size / 1024).toFixed(1) + ' KB' })
    setSheets(null)
    setSelectedSheet(null)
    setLocalError(null)
  }

  // ── Google Sheets tab detection ─────────────────────────────────────────
  async function handleDetectGoogleSheets() {
    if (!sheetsUrl.trim()) return
    setSheets(null)
    setSelectedSheet(null)
    setLocalError(null)
    setDetectingSheets(true)

    try {
      const tabs = await detectGoogleSheetTabs(sheetsUrl.trim())
      console.log('[SheetDetector] Google tabs:', tabs)
      if (tabs && tabs.length > 0) {
        setSheets(tabs)
        setSelectedSheet(tabs[0])
      } else {
        setLocalError('No se detectaron hojas. Carga directamente o verifica que el sheet sea público.')
      }
    } catch (e) {
      setLocalError('Error detectando hojas: ' + e.message)
    } finally {
      setDetectingSheets(false)
    }
  }

  // ── Build source & submit ───────────────────────────────────────────────
  function handleSubmit(e) {
    e.preventDefault()
    setLocalError(null)

    try {
      let source

      if (tab === 'sheets') {
        if (!sheetsUrl.trim()) throw new Error('Ingresa la URL de Google Sheets')
        source = { type: 'sheets', url: sheetsUrl.trim() }
        if (selectedSheet?.gid !== undefined) source.gid = selectedSheet.gid

      } else if (tab === 'excel') {
        if (!fileObj) throw new Error('Selecciona un archivo Excel')
        source = {
          type: 'csv',
          file: fileObj,
          sheetIndex: selectedSheet?.index ?? 0,
        }

      } else if (tab === 'csv') {
        if (!fileObj) throw new Error('Selecciona un archivo CSV')
        source = { type: 'csv', file: fileObj }

      } else if (tab === 'json') {
        if (!jsonUrl.trim()) throw new Error('Ingresa la URL del endpoint')
        try {
          const headers = jsonHeaders.trim() ? JSON.parse(jsonHeaders) : {}
          source = { type: 'json', url: jsonUrl.trim(), headers }
        } catch {
          throw new Error('Headers debe ser JSON válido')
        }

      } else if (tab === 'paste') {
        if (!pasteText.trim()) throw new Error('Pega datos primero')
        source = { type: 'paste', text: pasteText.trim() }
      }

      onLoad(source)
    } catch (err) {
      setLocalError(err.message)
    }
  }

  const hasSheetChoice = sheets && sheets.length > 1
  const canSubmit      = !loading && !detectingSheets

  return (
    <div className={styles.wrap}>
      <div className={styles.header}>
        <h2 className={styles.title}>Conectar datos</h2>
        <p className={styles.sub}>Elige el origen de tus datos</p>
      </div>

      {/* Tabs */}
      <div className={styles.tabs} style={{ gridTemplateColumns: `repeat(${TABS.length}, 1fr)` }}>
        {TABS.map(t => (
          <button key={t.id}
            className={`${styles.tab} ${tab === t.id ? styles.active : ''}`}
            onClick={() => switchTab(t.id)}>
            <span>{t.icon}</span>
            <span>{t.label}</span>
          </button>
        ))}
      </div>

      <form className={styles.form} onSubmit={handleSubmit}>

        {/* ── Google Sheets ── */}
        {tab === 'sheets' && (
          <div className={styles.field}>
            <label className={styles.label}>URL de Google Sheets</label>
            <div className={styles.urlRow}>
              <input className="input" style={{ flex: 1 }}
                placeholder="https://docs.google.com/spreadsheets/d/..."
                value={sheetsUrl}
                onChange={e => { setSheetsUrl(e.target.value); setSheets(null); setSelectedSheet(null) }}
              />
              <button type="button" className="btn btn-secondary"
                style={{ fontSize: 11, whiteSpace: 'nowrap', flexShrink: 0 }}
                disabled={!sheetsUrl.trim() || detectingSheets}
                onClick={handleDetectGoogleSheets}>
                {detectingSheets
                  ? <><span className="spinner" style={{ width: 11, height: 11 }} /> Detectando…</>
                  : '🔍 Ver hojas'}
              </button>
            </div>
            <p className={styles.hint}>El Sheet debe ser "Cualquier persona con el enlace puede ver"</p>
          </div>
        )}

        {/* ── Excel ── */}
        {tab === 'excel' && (
          <>
            {!fileInfo ? (
              <div
                className={`${styles.dropzone} ${dragOver ? styles.dragOver : ''}`}
                onDragOver={e => { e.preventDefault(); setDragOver(true) }}
                onDragLeave={() => setDragOver(false)}
                onDrop={e => { e.preventDefault(); setDragOver(false); handleExcelFile(e.dataTransfer.files[0]) }}
                onClick={() => fileRef.current?.click()}
              >
                <input ref={fileRef} type="file" accept=".xlsx,.xls" style={{ display: 'none' }}
                  onChange={e => handleExcelFile(e.target.files[0])} />
                <div className={styles.dropIcon}>📗</div>
                <p className={styles.dropText}>Arrastra tu Excel aquí</p>
                <p className={styles.hint}>.xlsx · .xls · o click para buscar</p>
              </div>
            ) : (
              <div className={styles.fileCard}>
                <span style={{ fontSize: 20 }}>📗</span>
                <div className={styles.fileMeta}>
                  <p className={styles.fileName}>{fileInfo.name}</p>
                  <p className={styles.fileSize}>{fileInfo.size}</p>
                </div>
                {detectingSheets && (
                  <div className={styles.detecting}>
                    <span className="spinner" style={{ width: 12, height: 12 }} />
                    <span>Leyendo hojas…</span>
                  </div>
                )}
                <button type="button" className="btn btn-ghost"
                  style={{ fontSize: 11, padding: '4px 8px' }}
                  onClick={() => { setFileObj(null); setFileInfo(null); setSheets(null); setSelectedSheet(null) }}>
                  ✕
                </button>
              </div>
            )}
          </>
        )}

        {/* ── CSV ── */}
        {tab === 'csv' && (
          !fileInfo ? (
            <div
              className={`${styles.dropzone} ${dragOver ? styles.dragOver : ''}`}
              onDragOver={e => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={() => setDragOver(false)}
              onDrop={e => { e.preventDefault(); setDragOver(false); handleCSVFile(e.dataTransfer.files[0]) }}
              onClick={() => fileRef.current?.click()}
            >
              <input ref={fileRef} type="file" accept=".csv" style={{ display: 'none' }}
                onChange={e => handleCSVFile(e.target.files[0])} />
              <div className={styles.dropIcon}>📄</div>
              <p className={styles.dropText}>Arrastra tu CSV aquí</p>
              <p className={styles.hint}>.csv · o click para buscar</p>
            </div>
          ) : (
            <div className={styles.fileCard}>
              <span style={{ fontSize: 20 }}>📄</span>
              <div className={styles.fileMeta}>
                <p className={styles.fileName}>{fileInfo.name}</p>
                <p className={styles.fileSize}>{fileInfo.size}</p>
              </div>
              <button type="button" className="btn btn-ghost"
                style={{ fontSize: 11, padding: '4px 8px' }}
                onClick={() => { setFileObj(null); setFileInfo(null) }}>
                ✕
              </button>
            </div>
          )
        )}

        {/* ── JSON ── */}
        {tab === 'json' && (
          <>
            <div className={styles.field}>
              <label className={styles.label}>URL del endpoint</label>
              <input className="input" placeholder="https://api.example.com/data"
                value={jsonUrl} onChange={e => setJsonUrl(e.target.value)} />
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Headers opcionales (JSON)</label>
              <input className={`input ${styles.mono}`}
                placeholder='{"Authorization": "Bearer tu-token"}'
                value={jsonHeaders} onChange={e => setJsonHeaders(e.target.value)} />
            </div>
          </>
        )}

        {/* ── Paste ── */}
        {tab === 'paste' && (
          <div className={styles.field}>
            <label className={styles.label}>Pega CSV o JSON</label>
            <textarea className={`input ${styles.textarea}`}
              placeholder={'nombre,ventas,categoria\nProducto A,12000,Electrónica\n\n— o pega un array JSON —'}
              value={pasteText} onChange={e => setPasteText(e.target.value)} />
          </div>
        )}

        {/* ── Power BI ── */}
        {tab === 'pbi' && (
          <PowerBIImporter
            onImport={({ dataset, prompt }) => onLoad({ type: 'pbi_model', dataset, prompt })}
            onDirectConvert={onDirectConvert}
            onReset={() => {}}
          />
        )}

        {/* ── Sheet picker — shown when multiple sheets detected ── */}
        {hasSheetChoice && (
          <SheetPicker
            sheets={sheets}
            selected={selectedSheet}
            onSelect={setSelectedSheet}
            isGoogle={tab === 'sheets'}
          />
        )}

        {/* ── Single sheet info ── */}
        {sheets && sheets.length === 1 && (
          <div className={styles.singleSheet}>
            <span>✓</span>
            <span>1 hoja detectada: <strong>{sheets[0].name}</strong></span>
          </div>
        )}

        {/* ── Error ── */}
        {localError && (
          <div className={styles.errorBox}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0, color: 'var(--danger)' }}>
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            {localError}
          </div>
        )}

        {/* ── Submit button ── */}
        {tab !== 'pbi' && (
          <button type="submit" className="btn btn-primary" disabled={!canSubmit}
            style={{ width: '100%', justifyContent: 'center', padding: '10px 16px' }}>
            {loading
              ? <><span className="spinner" />Cargando datos…</>
              : hasSheetChoice && selectedSheet
              ? `Cargar "${selectedSheet.name}" →`
              : 'Cargar datos →'}
          </button>
        )}
      </form>
    </div>
  )
}

// ── SheetPicker ─────────────────────────────────────────────────────────────
function SheetPicker({ sheets, selected, onSelect, isGoogle }) {
  const getId  = s => isGoogle ? s.gid   : s.index
  const selId  = selected ? getId(selected) : null

  return (
    <div className={styles.picker}>
      <div className={styles.pickerHeader}>
        <span>{isGoogle ? '📊' : '📗'}</span>
        <div>
          <p className={styles.pickerTitle}>{sheets.length} hojas encontradas — ¿cuál quieres usar?</p>
          <p className={styles.pickerSub}>Selecciona una hoja antes de cargar los datos</p>
        </div>
      </div>
      <div className={styles.pickerList}>
        {sheets.map((sheet, i) => {
          const id       = getId(sheet)
          const isActive = String(id) === String(selId)
          return (
            <button key={i} type="button"
              className={`${styles.pickerItem} ${isActive ? styles.pickerItemActive : ''}`}
              onClick={() => onSelect(sheet)}>
              <span className={styles.pickerCheck}>{isActive ? '✓' : ''}</span>
              <span className={styles.pickerName}>{sheet.name}</span>
              {isActive && <span className={styles.pickerBadge}>seleccionada</span>}
            </button>
          )
        })}
      </div>
    </div>
  )
}
