'use client'
import { useState, useEffect, useCallback, useRef } from 'react'
import dynamic from 'next/dynamic'
import { loadData } from '@/lib/DataAdapter'
import { getEnvatoTheme, ENVATO_THEMES } from '@/lib/envatoThemes'

const DashboardRenderer = dynamic(
  () => import('@/components/DashboardRenderer'),
  { ssr: false }
)

export default function EmbedDashboard() {
  const [config,    setConfig]    = useState(null)
  const [rows,      setRows]      = useState(null)
  const [theme,     setTheme]     = useState(null)
  const [status,    setStatus]    = useState('loading') // loading | ready | error
  const [error,     setError]     = useState(null)
  const [lastLoad,  setLastLoad]  = useState(null)
  const [countdown, setCountdown] = useState(0)
  const timerRef = useRef()
  const paramsRef = useRef(null)

  // ── Parse URL params ────────────────────────────────────────────────────
  useEffect(() => {
    const sp      = new URLSearchParams(window.location.search)
    const src     = sp.get('src')     || 'json'
    const url     = sp.get('url')     || ''
    const cfgB64  = sp.get('config')  || ''
    const refresh  = parseInt(sp.get('refresh') || '0')
    const themeId  = sp.get('theme')  || ENVATO_THEMES[0].id
    const showTitle = sp.get('title') !== '0'

    paramsRef.current = { src, url, cfgB64, refresh, themeId, showTitle }

    // Parse config
    if (cfgB64) {
      try {
        const json = JSON.parse(atob(cfgB64))
        setConfig(json)
      } catch {
        setError('Config JSON inválido en el parámetro ?config=')
        setStatus('error')
        return
      }
    }

    // Set theme
    setTheme(getEnvatoTheme(themeId) || ENVATO_THEMES[0])

    // Load data
    loadDashboardData(src, url)

    // Auto-refresh
    if (refresh > 0) {
      setCountdown(refresh)
      scheduleRefresh(refresh, src, url)
    }

    return () => clearTimeout(timerRef.current)
  }, [])

  const loadDashboardData = useCallback(async (src, url) => {
    if (!url) { setStatus('ready'); return }
    setStatus('loading')
    setError(null)
    try {
      // Decode URL in case it was percent-encoded
      const decodedUrl = decodeURIComponent(url)
      let source
      if (src === 'sheets') {
        // Use the original Google Sheets URL — DataAdapter handles the proxy
        source = { type: 'sheets', url: decodedUrl }
      } else if (src === 'csv_url') {
        const res  = await fetch(decodedUrl)
        const text = await res.text()
        source = { type: 'paste', text }
      } else {
        const res  = await fetch(decodedUrl)
        const json = await res.json()
        source = { type: 'paste', text: JSON.stringify(Array.isArray(json) ? json : json.data || json.rows || []) }
      }
      const dataset = await loadData(source)
      setRows(dataset.rows)
      setLastLoad(new Date())
      setStatus('ready')
    } catch (e) {
      setError(`Error cargando datos: ${e.message}`)
      setStatus('error')
    }
  }, [])

  function scheduleRefresh(secs, src, url) {
    timerRef.current = setTimeout(() => {
      loadDashboardData(src, url)
      setCountdown(secs)
      scheduleRefresh(secs, src, url)
    }, secs * 1000)
  }

  // Countdown display
  useEffect(() => {
    if (countdown <= 0) return
    const t = setInterval(() => setCountdown(c => Math.max(0, c-1)), 1000)
    return () => clearInterval(t)
  }, [countdown])

  const p = paramsRef.current

  // ── Render ───────────────────────────────────────────────────────────────
  if (status === 'loading') return (
    <div style={centeredStyle}>
      <div style={{ width:32, height:32, border:'3px solid rgba(255,255,255,0.1)',
        borderTopColor: theme?.highcharts?.colors?.[0] || '#6366F1',
        borderRadius:'50%', animation:'spin 0.8s linear infinite' }}/>
      <p style={{ color:'rgba(255,255,255,0.5)', fontSize:13, marginTop:12 }}>Cargando datos…</p>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )

  if (status === 'error') return (
    <div style={centeredStyle}>
      <p style={{ color:'#FCA5A5', fontSize:13 }}>⚠️ {error}</p>
    </div>
  )

  return (
    <div style={{ width:'100vw', minHeight:'100vh', background: theme?.vars?.['--t-bg'] || '#05091A',
      fontFamily:'inherit', position:'relative' }}>

      {/* Refresh badge */}
      {p?.refresh > 0 && (
        <div style={{
          position:'fixed', top:10, right:12, zIndex:100,
          background:'rgba(0,0,0,0.5)', backdropFilter:'blur(8px)',
          border:'1px solid rgba(255,255,255,0.1)',
          borderRadius:99, padding:'4px 10px',
          fontSize:10, color:'rgba(255,255,255,0.5)',
          display:'flex', alignItems:'center', gap:5,
        }}>
          <span style={{ width:6, height:6, borderRadius:'50%',
            background: countdown < 5 ? '#F59E0B' : '#10B981',
            animation:'pulse 1s ease infinite' }}/>
          {countdown > 0 ? `Actualiza en ${countdown}s` : 'Actualizando…'}
          {lastLoad && ` · ${lastLoad.toLocaleTimeString('es-CL', { hour:'2-digit', minute:'2-digit' })}`}
          <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}`}</style>
        </div>
      )}

      <DashboardRenderer
        config={p?.showTitle === false ? { ...config, title:'' } : config}
        rows={rows}
        id="embed-dashboard"
        envatoTheme={theme}
      />
    </div>
  )
}

const centeredStyle = {
  width:'100vw', height:'100vh',
  display:'flex', flexDirection:'column',
  alignItems:'center', justifyContent:'center',
  background:'#07091A',
}
