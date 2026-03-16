'use client'
import { useState, useRef, useEffect } from 'react'
import styles from './SessionPanel.module.css'
import {
  buildSession, downloadSession,
  loadSessionFromFile, saveToRecentList,
  getRecentList, removeFromRecentList,
} from '@/lib/SessionManager'

export default function SessionPanel({
  config, rows, chatHistory, themeId,
  onSessionLoad, onClose,
}) {
  const [tab,      setTab]      = useState('save')   // 'save' | 'open' | 'recent'
  const [recent,   setRecent]   = useState([])
  const [saving,   setSaving]   = useState(false)
  const [saved,    setSaved]    = useState(null)
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState(null)
  const [dragOver, setDragOver] = useState(false)
  const [name,     setName]     = useState(config?.title || 'Mi Dashboard')
  const fileRef = useRef()

  useEffect(() => {
    setRecent(getRecentList())
  }, [tab])

  // ── Save session ────────────────────────────────────────────────────────
  async function handleSave() {
    if (!config) return
    setSaving(true)
    setError(null)
    try {
      const session  = buildSession({ config: { ...config, title: name }, rows, chatHistory, themeId })
      const filename = downloadSession(session)
      saveToRecentList(session)
      setRecent(getRecentList())
      setSaved(filename)
      setTimeout(() => setSaved(null), 3000)
    } catch (e) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  // ── Load from file ──────────────────────────────────────────────────────
  async function handleFile(file) {
    if (!file) return
    setLoading(true)
    setError(null)
    try {
      const session = await loadSessionFromFile(file)
      saveToRecentList(session)
      onSessionLoad(session)
      onClose()
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  function handleDrop(e) {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  function deleteRecent(id) {
    const updated = removeFromRecentList(id)
    setRecent(updated)
  }

  function formatDate(iso) {
    try {
      return new Date(iso).toLocaleDateString('es-CL', {
        day: '2-digit', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
      })
    } catch { return iso }
  }

  // ── Prompts from history ────────────────────────────────────────────────
  const userPrompts = (chatHistory || []).filter(m => m.role === 'user')

  return (
    <div className={styles.overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div className={styles.modal}>

        {/* Header */}
        <div className={styles.modalHeader}>
          <div className={styles.modalTitle}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
              <polyline points="17,21 17,13 7,13 7,21"/>
              <polyline points="7,3 7,8 15,8"/>
            </svg>
            Sesiones de Dashboard
          </div>
          <button className="btn btn-ghost" style={{ fontSize:12 }} onClick={onClose}>✕</button>
        </div>

        {/* Tabs */}
        <div className={styles.tabs}>
          {[
            { id:'save',   label:'💾 Guardar', disabled: !config },
            { id:'open',   label:'📂 Abrir' },
            { id:'recent', label:`🕐 Recientes (${recent.length})` },
          ].map(t => (
            <button key={t.id}
              className={`${styles.tab} ${tab===t.id ? styles.tabActive : ''}`}
              onClick={() => { if (!t.disabled) { setTab(t.id); setError(null) } }}
              disabled={t.disabled}
            >{t.label}</button>
          ))}
        </div>

        <div className={styles.body}>

          {/* ── SAVE TAB ── */}
          {tab === 'save' && (
            <div className={styles.section}>
              <label className={styles.label}>Nombre de la sesión</label>
              <input
                className="input"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Mi Dashboard"
                style={{ fontSize: 13 }}
              />

              {/* Session summary */}
              <div className={styles.summary}>
                <div className={styles.summaryRow}>
                  <span>Visuals</span>
                  <span className={styles.summaryVal}>{config?.visuals?.length || 0}</span>
                </div>
                <div className={styles.summaryRow}>
                  <span>Filas de datos</span>
                  <span className={styles.summaryVal}>{rows?.length?.toLocaleString() || 0}</span>
                </div>
                <div className={styles.summaryRow}>
                  <span>Prompts guardados</span>
                  <span className={styles.summaryVal}>{userPrompts.length}</span>
                </div>
                <div className={styles.summaryRow}>
                  <span>Datos incluidos</span>
                  <span className={styles.summaryVal}>
                    {rows?.length > 500 ? `Muestra 500/${rows.length} filas` : 'Completo'}
                  </span>
                </div>
              </div>

              {/* Prompts preview */}
              {userPrompts.length > 0 && (
                <div className={styles.promptsWrap}>
                  <p className={styles.label}>Prompts incluidos</p>
                  <div className={styles.promptList}>
                    {userPrompts.map((m, i) => (
                      <div key={i} className={styles.promptItem}>
                        <span className={styles.promptNum}>{i+1}</span>
                        <span className={styles.promptText}>{m.content.slice(0, 120)}{m.content.length > 120 ? '…' : ''}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {error  && <div className={styles.error}>{error}</div>}
              {saved  && <div className={styles.success}>✓ Guardado: {saved}</div>}

              <button
                className="btn btn-primary"
                style={{ width:'100%', justifyContent:'center', padding:'10px' }}
                onClick={handleSave}
                disabled={saving || !config}
              >
                {saving ? <><span className="spinner"/>Guardando…</> : (
                  <>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                      <polyline points="7,10 12,15 17,10"/>
                      <line x1="12" y1="15" x2="12" y2="3"/>
                    </svg>
                    Descargar sesión (.dbsession.json)
                  </>
                )}
              </button>
              <p className={styles.hint}>El archivo incluye la configuración del dashboard, los prompts usados y una muestra de los datos.</p>
            </div>
          )}

          {/* ── OPEN TAB ── */}
          {tab === 'open' && (
            <div className={styles.section}>
              <div
                className={`${styles.dropzone} ${dragOver ? styles.dropzoneActive : ''}`}
                onDragOver={e => { e.preventDefault(); setDragOver(true) }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileRef.current?.click()}
              >
                <input ref={fileRef} type="file" accept=".json,.dbsession.json"
                  style={{ display:'none' }}
                  onChange={e => handleFile(e.target.files[0])} />
                {loading ? (
                  <><span className="spinner" style={{ width:24, height:24 }} /><p>Cargando sesión…</p></>
                ) : (
                  <>
                    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ opacity:.4 }}>
                      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
                    </svg>
                    <p className={styles.dropText}>Arrastra tu archivo .dbsession.json aquí</p>
                    <p className={styles.dropSub}>o click para buscar</p>
                  </>
                )}
              </div>
              {error && <div className={styles.error}>{error}</div>}
              <p className={styles.hint}>Solo archivos <code>.dbsession.json</code> generados por Dashboard Builder.</p>
            </div>
          )}

          {/* ── RECENT TAB ── */}
          {tab === 'recent' && (
            <div className={styles.section}>
              {recent.length === 0 ? (
                <div className={styles.empty}>
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ opacity:.3 }}>
                    <circle cx="12" cy="12" r="10"/><polyline points="12,6 12,12 16,14"/>
                  </svg>
                  <p>No hay sesiones recientes</p>
                  <p style={{ fontSize:11, opacity:.5 }}>Guarda tu primer dashboard para verlo aquí</p>
                </div>
              ) : (
                <div className={styles.recentList}>
                  {recent.map(s => (
                    <div key={s.id} className={styles.recentCard}>
                      <div className={styles.recentInfo}>
                        <p className={styles.recentName}>{s.name}</p>
                        <p className={styles.recentMeta}>
                          {formatDate(s.savedAt)} · {s.visuals} visuals · {s.prompts} prompts
                        </p>
                      </div>
                      <div className={styles.recentActions}>
                        <button className="btn btn-ghost" style={{ fontSize:10, padding:'3px 8px' }}
                          onClick={() => deleteRecent(s.id)} title="Eliminar de recientes">
                          ✕
                        </button>
                      </div>
                    </div>
                  ))}
                  <p className={styles.hint}>Para abrir una sesión usa la pestaña "Abrir" y carga el archivo descargado.</p>
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
