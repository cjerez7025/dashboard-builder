'use client'
import { useState, useEffect, useCallback, useRef } from 'react'
import dynamic from 'next/dynamic'
import { getEnvatoTheme, ENVATO_THEMES } from '@/lib/envatoThemes'

const DashboardRenderer = dynamic(
  () => import('@/components/DashboardRenderer'),
  { ssr: false }
)

export default function EmbedDashboard() {
  const [config,    setConfig]    = useState(null)
  const [rows,      setRows]      = useState(null)
  const [theme,     setTheme]     = useState(null)
  const [status,    setStatus]    = useState('loading')
  const [error,     setError]     = useState(null)
  const [lastLoad,  setLastLoad]  = useState(null)
  const [countdown, setCountdown] = useState(0)
  const timerRef  = useRef()
  const paramsRef = useRef(null)

  useEffect(() => {
    // URLSearchParams.get() already decodes — no extra decoding needed
    const sp       = new URLSearchParams(window.location.search)
    const src      = sp.get('src')    || 'sheets'
    const url      = sp.get('url')    || ''   // already decoded by URLSearchParams
    const cfgB64   = sp.get('config') || ''
    const refresh  = parseInt(sp.get('refresh') || '0')
    const themeId  = sp.get('theme')  || ENVATO_THEMES[0].id
    const showTitle = sp.get('title') !== '0'

    paramsRef.current = { src, url, cfgB64, refresh, themeId, showTitle }

    // Parse config — handle all base64 variants
    if (cfgB64) {
      try {
        // Normalize base64: URL-safe chars + fix padding
        let b64 = cfgB64
          .replace(/-/g, '+')
          .replace(/_/g, '/')
        // Add padding if needed
        while (b64.length % 4 !== 0) b64 += '='
        const decoded = atob(b64)
        // Handle UTF-8 characters
        const json = JSON.parse(decodeURIComponent(
          decoded.split('').map(c =>
            '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
          ).join('')
        ))
        setConfig(json)
      } catch(e) {
        // Try direct JSON parse as fallback
        try {
          const json = JSON.parse(cfgB64)
          setConfig(json)
        } catch {
          setError('Config JSON inválido — regenera la URL desde Export → Power BI')
          setStatus('error')
          return
        }
      }
    } else {
      setStatus('ready')
      return
    }

    setTheme(getEnvatoTheme(themeId) || ENVATO_THEMES[0])

    if (url) {
      loadSheetData(src, url)
      if (refresh > 0) {
        setCountdown(refresh)
        scheduleRefresh(refresh, src, url)
      }
    } else {
      setStatus('ready')
    }

    return () => clearTimeout(timerRef.current)
  }, [])

  async function loadSheetData(src, sheetsUrl) {
    setStatus('loading')
    setError(null)
    try {
      let apiUrl

      if (src === 'sheets') {
        // Pass the URL to our proxy — URLSearchParams encodes it correctly
        const params = new URLSearchParams({ url: sheetsUrl })
        apiUrl = `/api/data?${params.toString()}`
      } else if (src === 'csv_url') {
        const res  = await fetch(sheetsUrl)
        const text = await res.text()
        const { loadData } = await import('@/lib/DataAdapter')
        const ds = await loadData({ type: 'paste', text })
        setRows(ds.rows)
        setLastLoad(new Date())
        setStatus('ready')
        return
      } else {
        const res  = await fetch(sheetsUrl)
        const json = await res.json()
        const arr  = Array.isArray(json) ? json : json.data || json.rows || []
        const { loadData } = await import('@/lib/DataAdapter')
        const ds = await loadData({ type: 'paste', text: JSON.stringify(arr) })
        setRows(ds.rows)
        setLastLoad(new Date())
        setStatus('ready')
        return
      }

      const res = await fetch(apiUrl)
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || `HTTP ${res.status}`)
      }
      const data = await res.json()
      setRows(data.rows || [])
      setLastLoad(new Date())
      setStatus('ready')

    } catch(e) {
      console.error('[Embed] load error:', e)
      setError('Error cargando datos: ' + e.message)
      setStatus('error')
    }
  }

  function scheduleRefresh(secs, src, url) {
    timerRef.current = setTimeout(() => {
      loadSheetData(src, url)
      setCountdown(secs)
      scheduleRefresh(secs, src, url)
    }, secs * 1000)
  }

  // Countdown
  useEffect(() => {
    if (countdown <= 0) return
    const t = setInterval(() => setCountdown(c => Math.max(0, c - 1)), 1000)
    return () => clearInterval(t)
  }, [countdown])

  const p = paramsRef.current

  if (status === 'loading') return (
    <div style={centeredStyle}>
      <div style={{
        width:32, height:32,
        border:'3px solid rgba(255,255,255,0.1)',
        borderTopColor:'#6366F1',
        borderRadius:'50%',
        animation:'spin 0.8s linear infinite'
      }}/>
      <p style={{ color:'rgba(255,255,255,0.5)', fontSize:13, marginTop:12 }}>
        Cargando datos desde Google Sheets…
      </p>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )

  if (status === 'error') return (
    <div style={centeredStyle}>
      <p style={{ color:'#FCA5A5', fontSize:13, textAlign:'center', maxWidth:400, lineHeight:1.5 }}>
        ⚠️ {error}
      </p>
    </div>
  )

  return (
    <div style={{
      width:'100vw', minHeight:'100vh',
      background: theme?.vars?.['--t-bg'] || '#07091A',
      fontFamily:'inherit', position:'relative',
    }}>
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
          <span style={{
            width:6, height:6, borderRadius:'50%',
            background: countdown < 5 ? '#F59E0B' : '#10B981',
          }}/>
          {countdown > 0 ? `Actualiza en ${countdown}s` : 'Actualizando…'}
          {lastLoad && ` · ${lastLoad.toLocaleTimeString('es-CL',{hour:'2-digit',minute:'2-digit'})}`}
        </div>
      )}

      <DashboardRenderer
        config={config}
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
