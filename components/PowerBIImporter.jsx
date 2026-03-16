'use client'
import { useState, useRef } from 'react'
import styles from './PowerBIImporter.module.css'
import { parsePowerBIFile, pbiModelToDataset, buildPBIPromptSuggestion, layoutToConfig } from '@/lib/PowerBIReader'

export default function PowerBIImporter({ onImport, onDirectConvert, onReset }) {
  const [status,   setStatus]   = useState('idle')
  const [model,    setModel]    = useState(null)
  const [error,    setError]    = useState(null)
  const [dragOver, setDragOver] = useState(false)
  const fileRef = useRef()

  async function handleFile(file) {
    if (!file) return
    if (!file.name.endsWith('.pbix') && !file.name.endsWith('.pbit')) {
      setError('Solo se admiten archivos .pbix y .pbit')
      return
    }
    setStatus('loading')
    setError(null)
    try {
      const parsed  = await parsePowerBIFile(file)
      const dataset = pbiModelToDataset(parsed)
      const prompt  = buildPBIPromptSuggestion(parsed)
      setModel(parsed)
      setStatus('ready')
      onImport({ parsed, dataset, prompt })
    } catch (err) {
      setError(err.message)
      setStatus('error')
    }
  }

  function handleDirectConvert(pageIdx = 0) {
    if (!model) return
    try {
      const config = layoutToConfig(model, pageIdx)
      onDirectConvert?.(config)
    } catch (err) {
      setError(`Error al convertir: ${err.message}`)
    }
  }

  if (status === 'ready' && model) {
    return (
      <ModelSummary
        model={model}
        onDirectConvert={handleDirectConvert}
        onReset={() => { setModel(null); setStatus('idle'); onReset?.() }}
        error={error}
      />
    )
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.header}>
        <div className={styles.pbiLogo}>
          <PBIIcon />
        </div>
        <div>
          <h3 className={styles.title}>Importar Power BI</h3>
          <p className={styles.sub}>Sube tu modelo .pbix o .pbit</p>
        </div>
      </div>

      <div
        className={`${styles.dropzone} ${dragOver ? styles.dragOver : ''} ${status === 'loading' ? styles.loading : ''}`}
        onDragOver={e => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={e => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files[0]) }}
        onClick={() => status !== 'loading' && fileRef.current?.click()}
      >
        <input ref={fileRef} type="file" accept=".pbix,.pbit" style={{ display:'none' }}
          onChange={e => handleFile(e.target.files[0])} />

        {status === 'loading' ? (
          <>
            <span className="spinner" style={{ width:22, height:22, borderWidth:3 }} />
            <p className={styles.dropText}>Leyendo modelo Power BI…</p>
            <p className={styles.dropHint}>Extrayendo tablas, medidas y layout</p>
          </>
        ) : (
          <>
            <div className={styles.dropIcon}><PBIIcon size={28} /></div>
            <p className={styles.dropText}>Arrastra tu .pbix o .pbit aquí</p>
            <p className={styles.dropHint}>o click para buscar</p>
          </>
        )}
      </div>

      {error && <div className={styles.errorBox}>⚠️ {error}</div>}

      <div className={styles.info}>
        <Row icon="✅" label=".pbit" desc="Tablas, columnas, medidas DAX, relaciones, layout" />
        <Row icon="✅" label=".pbix" desc="Layout del reporte, campos, títulos de visuals" />
        <Row icon="ℹ️" label="Datos" desc="Requieren Power BI Desktop (formato binario)" />
      </div>
    </div>
  )
}

function ModelSummary({ model, onDirectConvert, onReset, error }) {
  const [activeTab, setActiveTab] = useState('overview')
  const visibleTables = model.tables.filter(t => !t.hidden)
  const totalMeasures = model.measures.filter(m => !m.hidden).length
  const hasLayout     = model.reportPages.length > 0 && model.reportPages[0].visuals.length > 0

  return (
    <div className={styles.summary}>
      {/* File header */}
      <div className={styles.summaryHeader}>
        <div className={styles.pbiLogo}><PBIIcon size={16} /></div>
        <div style={{ flex:1, minWidth:0 }}>
          <p className={styles.summaryFile}>{model.fileName}</p>
          <p className={styles.summaryType}>{model.fileType.toUpperCase()} · {model.fileType === 'pbit' ? 'Template' : 'Report'}</p>
        </div>
        <button className="btn btn-ghost" style={{ fontSize:11, padding:'4px 8px' }} onClick={onReset}>
          Cambiar
        </button>
      </div>

      {/* Stats */}
      <div className={styles.stats}>
        <Stat n={visibleTables.length}          label="Tablas"    />
        <Stat n={model.tables.reduce((s,t)=>s+t.columns.filter(c=>!c.hidden).length,0)} label="Columnas" />
        <Stat n={totalMeasures}                 label="Medidas"   color="var(--warning)" />
        <Stat n={model.relations.length}        label="Relaciones" color="var(--success)" />
      </div>

      {/* Tabs */}
      <div className={styles.tabs}>
        {['overview','measures','relations','pages'].map(t => (
          <button key={t} className={`${styles.tab} ${activeTab===t?styles.tabActive:''}`}
            onClick={() => setActiveTab(t)}>
            {{ overview:'Modelo', measures:'Medidas DAX', relations:'Relaciones', pages:'Páginas' }[t]}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className={styles.tabContent}>
        {activeTab === 'overview' && (
          <div className={styles.tableList}>
            {visibleTables.map(t => (
              <div key={t.name} className={styles.tableRow}>
                <div>
                  <span className={styles.tableName}>📋 {t.name}</span>
                  <span className={styles.tableMeta}>
                    {t.columns.filter(c=>!c.hidden).length} cols · {t.measures.length} measures
                  </span>
                </div>
                <div className={styles.colPills}>
                  {t.columns.filter(c=>!c.hidden).slice(0,4).map(c => (
                    <span key={c.name} className={`badge ${c.dataType==='number'?'badge-number':c.dataType==='date'?'badge-date':'badge-text'}`}
                      style={{ fontSize:9 }}>{c.name}</span>
                  ))}
                  {t.columns.filter(c=>!c.hidden).length > 4 && (
                    <span className="badge badge-default" style={{ fontSize:9 }}>
                      +{t.columns.filter(c=>!c.hidden).length - 4}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'measures' && (
          <div className={styles.measureList}>
            {model.measures.filter(m=>!m.hidden).length === 0 ? (
              <p className={styles.emptyNote}>No hay medidas en este archivo. Las medidas solo están disponibles en .pbit.</p>
            ) : (
              model.measures.filter(m=>!m.hidden).map(m => (
                <div key={`${m.table}.${m.name}`} className={styles.measureRow}>
                  <div className={styles.measureHeader}>
                    <span className={styles.measureName}>ƒ {m.name}</span>
                    <span className={styles.measureTable}>{m.table}</span>
                    {m.formatType && <span className={`badge badge-${m.formatType==='currency'?'number':m.formatType==='percent'?'text':'default'}`} style={{ fontSize:9 }}>{m.formatType}</span>}
                  </div>
                  <code className={styles.measureDax}>{m.expression.slice(0,120)}{m.expression.length > 120 ? '…' : ''}</code>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'relations' && (
          <div className={styles.relationList}>
            {model.relations.length === 0 ? (
              <p className={styles.emptyNote}>No hay relaciones definidas en este modelo.</p>
            ) : (
              model.relations.map((r, i) => (
                <div key={i} className={styles.relationRow}>
                  <span className={styles.relFrom}>{r.from}</span>
                  <span className={styles.relArrow}>{r.active ? '→' : '⇢'}</span>
                  <span className={styles.relTo}>{r.to}</span>
                  <span className={styles.relCard}>{r.cardinality}</span>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'pages' && (
          <div className={styles.pageList}>
            {model.reportPages.map((p, i) => (
              <div key={p.name} className={styles.pageRow}>
                <div>
                  <span className={styles.pageName}>📄 {p.name}</span>
                  <span className={styles.pageMeta}>{p.visuals.length} visuals · {p.width}×{p.height}px</span>
                </div>
                {p.visuals.length > 0 && (
                  <button
                    className="btn btn-secondary"
                    style={{ fontSize:10, padding:'3px 10px' }}
                    onClick={() => onDirectConvert(i)}
                    title="Convertir esta página directamente (sin AI)"
                  >
                    Convertir →
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div className={styles.actions}>
        {hasLayout && (
          <button
            className="btn btn-primary"
            style={{ flex:1, justifyContent:'center', fontSize:12 }}
            onClick={() => onDirectConvert(0)}
            title="Convierte el layout PBI a dashboard sin usar AI"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="13,2 13,9 22,9"/><path d="M20,20H4a2,2,0,0,1-2-2V6a2,2,0,0,1,2-2h9l7,7Z"/>
            </svg>
            Convertir layout directo
          </button>
        )}
        <div className={styles.actionNote}>
          {hasLayout
            ? '↑ Sin AI — reproduce el diseño original | O describe abajo para generar con AI'
            : 'Describe el dashboard que quieres generar en el chat de abajo'}
        </div>
      </div>

      {error && <div className={styles.errorBox}>⚠️ {error}</div>}
      {model.inferred && !model.genericSchema && (
        <div className={styles.inferredNote}>
          ℹ️ Columnas inferidas desde el layout del reporte .pbix. Para medidas DAX y tipos exactos, usa un .pbit.
        </div>
      )}
      {model.genericSchema && (
        <div className={styles.warnNote}>
          ⚠️ No se encontraron campos en el reporte. El archivo puede estar encriptado o usar un formato no estándar. Intenta con un .pbit exportado desde Power BI Desktop.
        </div>
      )}
    </div>
  )
}

// ── Small components ─────────────────────────────────────────────────────────

function PBIIcon({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <rect x="2"  y="12" width="4" height="10" rx="1" fill="#F2C811"/>
      <rect x="9"  y="7"  width="4" height="15" rx="1" fill="#F2C811" opacity="0.85"/>
      <rect x="16" y="2"  width="4" height="20" rx="1" fill="#F2C811" opacity="0.65"/>
      <rect x="2"  y="2"  width="4" height="6"  rx="1" fill="#F2C811" opacity="0.35"/>
    </svg>
  )
}
function Row({ icon, label, desc }) {
  return (
    <div className={styles.infoRow}>
      <span>{icon}</span>
      <span><strong>{label}</strong> — {desc}</span>
    </div>
  )
}
function Stat({ n, label, color }) {
  return (
    <div className={styles.stat}>
      <p className={styles.statN} style={{ color: color||'var(--accent-hover)' }}>{n}</p>
      <p className={styles.statLabel}>{label}</p>
    </div>
  )
}
