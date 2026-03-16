'use client'
import { useState, useCallback } from 'react'
import dynamic from 'next/dynamic'
import Header            from '@/components/Header'
import SourceSelector    from '@/components/SourceSelector'
import DataPreview       from '@/components/DataPreview'
import PromptChat        from '@/components/PromptChat'
import ThemePicker       from '@/components/ThemePicker'
import DashboardRenderer from '@/components/DashboardRenderer'
import SkeletonDashboard from '@/components/SkeletonDashboard'
import ExportMenu        from '@/components/ExportMenu'
import { loadData }      from '@/lib/DataAdapter'
import { generateDashboard } from '@/lib/AIEngine'
import { DEMO_DATASET, DEMO_CONFIG } from '@/lib/demoData'
import { getEnvatoTheme, ENVATO_THEMES } from '@/lib/envatoThemes'
const EnvatoGallery  = dynamic(() => import('@/components/EnvatoGallery'),  { ssr: false })
const SessionPanel   = dynamic(() => import('@/components/SessionPanel'),   { ssr: false })
const PowerBIExport  = dynamic(() => import('@/components/PowerBIExport'),  { ssr: false })
import styles from './page.module.css'

// Default to first Envato theme
const DEFAULT_THEME_ID = ENVATO_THEMES[0].id

export default function Home() {
  const [dataStatus,  setDataStatus]  = useState('idle')
  const [dataset,     setDataset]     = useState(null)
  const [dataError,   setDataError]   = useState(null)
  const [genStatus,   setGenStatus]   = useState('idle')
  const [dashConfig,  setDashConfig]  = useState(null)
  const [chatHistory, setChatHistory] = useState([])
  const [themeId,     setThemeId]     = useState(DEFAULT_THEME_ID)
  const [pbiPrompt,   setPbiPrompt]   = useState(null)
  const [galleryOpen,  setGalleryOpen]  = useState(false)
  const [sessionOpen,  setSessionOpen]  = useState(false)
  const [pbiExportOpen, setPbiExportOpen] = useState(false)
  const [sidebarOpen,  setSidebarOpen]  = useState(true)
  const [editMode,     setEditMode]     = useState(false)

  // Active theme is always from Envato
  const activeTheme = getEnvatoTheme(themeId) || ENVATO_THEMES[0]

  // ── Load data ──────────────────────────────────────────────────────────
  const handleLoad = useCallback(async (source) => {
    setDataStatus('loading')
    setDataError(null)
    try {
      const data = await loadData(source)
      setDataset(data)
      setDataStatus('ready')
      if (source.type === 'pbi_model' && source.prompt) {
        setPbiPrompt(source.prompt)
      }
    } catch (err) {
      setDataError(err.message)
      setDataStatus('error')
    }
  }, [])

  // ── Demo data ──────────────────────────────────────────────────────────
  const handleDemo = useCallback(() => {
    setDataset(DEMO_DATASET)
    setDataStatus('ready')
    setDashConfig(DEMO_CONFIG)
    setGenStatus('done')
    setChatHistory([
      { role:'user',      content:'Dashboard completo de ventas con KPIs, categorías, región y tendencia temporal' },
      { role:'assistant', content:`Dashboard generado con ${DEMO_CONFIG.visuals.length} visuals`, status:'ok', config:DEMO_CONFIG },
    ])
  }, [])

  // ── Generate via AI ────────────────────────────────────────────────────
  const handleGenerate = useCallback(async (prompt) => {
    if (!dataset) return
    setGenStatus('loading')
    setChatHistory(h => [...h, { role:'user', content:prompt }])

    const historyForApi = chatHistory.map(m => ({ role:m.role, content:m.content, config:m.config||null }))

    try {
      const { config } = await generateDashboard(
        prompt,
        { ...dataset.summary, columns: dataset.columns },
        historyForApi,
      )
      setDashConfig(config)
      setGenStatus('done')
      setChatHistory(h => [...h, { role:'assistant', content:`Dashboard generado con ${config.visuals.length} visuals`, status:'ok', config }])
    } catch (err) {
      setGenStatus('error')
      setChatHistory(h => [...h, { role:'assistant', content:err.message, status:'error' }])
    }
  }, [dataset, chatHistory])

  // ── Reset ──────────────────────────────────────────────────────────────
  const handleNewSession = useCallback(() => {
    setDataset(null); setDataStatus('idle'); setDataError(null)
    setDashConfig(null); setChatHistory([]); setGenStatus('idle')
  }, [])

  // ── Load session from file ──────────────────────────────────────────────
  const handleSessionLoad = useCallback((session) => {
    if (session.config)      setDashConfig(session.config)
    if (session.chatHistory) setChatHistory(session.chatHistory)
    if (session.themeId)     setThemeId(session.themeId)
    if (session.rowsSample?.length) {
      setDataset({ rows: session.rowsSample, columns: [], summary: { rowCount: session.rowsTotal, columnCount: 0, numericColumns:[], categoricalColumns:[], dateColumns:[] } })
      setDataStatus('ready')
    }
    setGenStatus('done')
  }, [])

  const hasData   = dataStatus === 'ready'
  const hasConfig = !!dashConfig
  const isLoading = genStatus === 'loading'

  return (
    <div className={styles.app}>
      <Header onNewSession={handleNewSession} hasData={hasData} hasConfig={hasConfig} editMode={editMode} onToggleEdit={() => setEditMode(e => !e)} onSessions={() => setSessionOpen(true)} />

      <div className={styles.layout}>
        {/* ── Sidebar ── */}
        {/* Toggle button */}
        <button
          className={`${styles.toggleBtn} ${sidebarOpen ? styles.toggleBtnExpanded : ''}`}
          onClick={() => setSidebarOpen(o => !o)}
          title={sidebarOpen ? 'Ocultar panel' : 'Mostrar panel'}
        >
          {sidebarOpen ? '‹' : '›'}
        </button>

        <aside className={`${styles.sidebar} ${!sidebarOpen ? styles.sidebarCollapsed : ''}`}>
          <div className={styles.sidebarInner}>

            {/* Template picker */}
            <section className={styles.section}>
              <ThemePicker selected={themeId} onChange={setThemeId} onOpenGallery={() => setGalleryOpen(true)} />
            </section>

            <div className={styles.dividerLine} />

            {/* Data source */}
            <section className={styles.section}>
              {!hasData ? (
                <>
                  <SourceSelector onLoad={handleLoad} loading={dataStatus==='loading'} />
                  {dataStatus==='error' && (
                    <div className={styles.errorBox}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{flexShrink:0,color:'var(--danger)'}}>
                        <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                      </svg>
                      <span>{dataError}</span>
                    </div>
                  )}
                  <div className={styles.divider}><span>or</span></div>
                  <button className={`btn btn-ghost ${styles.demoBtn}`}
                    style={{ borderColor:'rgba(99,102,241,0.3)', color:'var(--accent-hover)' }}
                    onClick={() => setSessionOpen(true)}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
                    </svg>
                    Abrir sesión guardada
                  </button>
                  <button className={`btn btn-ghost ${styles.demoBtn}`} onClick={handleDemo}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polygon points="5,3 19,12 5,21"/>
                    </svg>
                    Try with demo data
                  </button>
                </>
              ) : (
                <DataPreview dataset={dataset} onReset={handleNewSession} />
              )}
            </section>

            {/* Chat */}
            {hasData && (
              <section className={styles.section}>
                <PromptChat
                  onGenerate={handleGenerate}
                  generating={isLoading}
                  disabled={false}
                  history={chatHistory}
                  suggestedPrompt={pbiPrompt}
                  onClearSuggested={() => setPbiPrompt(null)}
                />
              </section>
            )}
          </div>

          {hasConfig && (
            <div className={styles.sidebarFooter}>
              <ExportMenu config={dashConfig} rows={dataset?.rows} onPowerBI={() => setPbiExportOpen(true)} />
            </div>
          )}
        </aside>

        {/* ── Canvas ── */}
        <main className={styles.main}>
          <div className={styles.canvas}>
            {isLoading && !hasConfig ? (
              <SkeletonDashboard />
            ) : isLoading && hasConfig ? (
              <>
                <div className={styles.regenBanner}>
                  <span className="spinner" />
                  <span>Refinando dashboard…</span>
                </div>
                <DashboardRenderer config={dashConfig} rows={dataset?.rows} id="dashboard-render" envatoTheme={activeTheme} editMode={editMode} onConfigUpdate={setDashConfig} />
              </>
            ) : (
              <DashboardRenderer config={dashConfig} rows={dataset?.rows} id="dashboard-render" envatoTheme={activeTheme} editMode={editMode} onConfigUpdate={setDashConfig} />
            )}
          </div>
        </main>
      </div>
      {pbiExportOpen && (
        <PowerBIExport
          config={dashConfig}
          dataSource={dataset?.source}
          onClose={() => setPbiExportOpen(false)}
        />
      )}

      {sessionOpen && (
        <SessionPanel
          config={dashConfig}
          rows={dataset?.rows}
          chatHistory={chatHistory}
          themeId={themeId}
          onSessionLoad={handleSessionLoad}
          onClose={() => setSessionOpen(false)}
        />
      )}

      {galleryOpen && (
        <EnvatoGallery
          selectedId={themeId}
          onSelect={id => { setThemeId(id); setGalleryOpen(false) }}
          onClose={() => setGalleryOpen(false)}
        />
      )}
    </div>
  )
}
