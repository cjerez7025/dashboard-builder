'use client'
import { useState } from 'react'
import { ENVATO_THEMES } from '@/lib/envatoThemes'
import styles from './EnvatoGallery.module.css'

// Mini dashboard preview SVG
function ThemePreview({ theme }) {
  const c  = theme.highcharts.colors
  const bg = theme.vars['--t-bg']
  const sf = theme.vars['--t-surface']
  const bd = theme.vars['--t-border']
  const r  = Math.min(parseInt(theme.vars['--t-radius']) || 6, 6)
  const d  = theme.previewData

  const maxH = Math.max(...d.bars)
  const bars = d.bars.map(h => Math.round((h / maxH) * 38))

  const circ = 88
  let offset = 0
  const total = d.donut.reduce((a,b)=>a+b,0)
  const segs  = d.donut.map((v,i) => {
    const len = (v/total)*circ
    const s   = { len, offset, color: c[i%c.length] }
    offset += len
    return s
  })

  return (
    <svg width="100%" viewBox="0 0 200 120" xmlns="http://www.w3.org/2000/svg"
      style={{ display:'block' }}>
      <rect width="200" height="120" fill={bg}/>

      {/* KPI cards */}
      {d.kpis.map((val,i) => {
        const x = 6 + i*48
        return (
          <g key={i}>
            <rect x={x} y="8" width="43" height="24" rx={r} fill={sf} stroke={bd} strokeWidth="0.5"/>
            <rect x={x} y="8" width="43" height="3" rx="1" fill={c[i%c.length]}/>
            <text x={x+21.5} y="22" textAnchor="middle" fontSize="8" fill={c[i%c.length]} fontWeight="bold">{val}</text>
          </g>
        )
      })}

      {/* Bars */}
      <rect x="6" y="40" width="108" height="72" rx={r} fill={sf} stroke={bd} strokeWidth="0.5"/>
      {bars.map((h,i) => (
        <rect key={i} x={12+i*16} y={112-h} width="11" height={h} rx="1.5"
          fill={c[i%c.length]} opacity="0.9"/>
      ))}
      <text x="60" y="50" textAnchor="middle" fontSize="7" fill={theme.vars['--t-text-3']}>ventas por estado</text>

      {/* Donut */}
      <rect x="120" y="40" width="74" height="72" rx={r} fill={sf} stroke={bd} strokeWidth="0.5"/>
      {segs.map((s,i) => (
        <circle key={i} cx="157" cy="76" r="22" fill="none"
          stroke={s.color} strokeWidth="7"
          strokeDasharray={`${s.len} ${circ-s.len}`}
          strokeDashoffset={-s.offset}
          style={{ transform:'rotate(-90deg)', transformOrigin:'157px 76px' }}/>
      ))}
      <circle cx="157" cy="76" r="14" fill={bg}/>
      <text x="157" y="79" textAnchor="middle" fontSize="7" fill={theme.vars['--t-text-2']} fontWeight="bold">
        {d.kpis[1]}
      </text>
    </svg>
  )
}

export default function EnvatoGallery({ selectedId, onSelect, onClose }) {
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')

  const categories = ['all', ...new Set(ENVATO_THEMES.map(t => t.category))]

  const filtered = ENVATO_THEMES.filter(t => {
    const matchCat    = filter === 'all' || t.category === filter
    const matchSearch = !search || t.name.toLowerCase().includes(search.toLowerCase()) ||
                        t.description.toLowerCase().includes(search.toLowerCase())
    return matchCat && matchSearch
  })

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>

        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <div className={styles.envatoLogo}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="#82B541"/>
                <path d="M2 17L12 22L22 17" stroke="#82B541" strokeWidth="2" fill="none"/>
                <path d="M2 12L12 17L22 12" stroke="#82B541" strokeWidth="2" fill="none"/>
              </svg>
            </div>
            <div>
              <h2 className={styles.title}>Templates inspirados en Envato</h2>
              <p className={styles.subtitle}>Estilos basados en los más vendidos de ThemeForest</p>
            </div>
          </div>
          <button className="btn btn-ghost" onClick={onClose} style={{ fontSize:13 }}>✕ Cerrar</button>
        </div>

        {/* Filters */}
        <div className={styles.filters}>
          <input
            className={`input ${styles.search}`}
            placeholder="Buscar template..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <div className={styles.cats}>
            {categories.map(cat => (
              <button key={cat}
                className={`${styles.cat} ${filter===cat ? styles.catActive : ''}`}
                onClick={() => setFilter(cat)}>
                {cat === 'all' ? 'Todos' : cat}
              </button>
            ))}
          </div>
        </div>

        {/* Grid */}
        <div className={styles.grid}>
          {filtered.map(theme => (
            <div
              key={theme.id}
              className={`${styles.card} ${selectedId===theme.id ? styles.selected : ''}`}
              onClick={() => onSelect(theme.id)}
            >
              {/* Preview */}
              <div className={styles.preview} style={{ background: theme.vars['--t-bg'] }}>
                <ThemePreview theme={theme} />
                {selectedId === theme.id && (
                  <div className={styles.selectedCheck}>✓ Activo</div>
                )}
              </div>

              {/* Info */}
              <div className={styles.info}>
                <div className={styles.infoTop}>
                  <div>
                    <span className={styles.name}>{theme.name}</span>
                    <span className={styles.author}>by {theme.author}</span>
                  </div>
                  <span className={styles.tag} style={{ background: theme.tagColor+'22', color: theme.tagColor }}>
                    {theme.tag}
                  </span>
                </div>
                <p className={styles.desc}>{theme.description}</p>
                <div className={styles.meta}>
                  <span className={styles.sales}>
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="22,12 18,12 15,21 9,3 6,12 2,12"/>
                    </svg>
                    {theme.sales}
                  </span>
                  <span className={styles.category}>{theme.category}</span>
                  <a href={theme.url} target="_blank" rel="noopener noreferrer"
                    className={styles.link}
                    onClick={e => e.stopPropagation()}>
                    Ver original →
                  </a>
                </div>
                {/* Color swatches */}
                <div className={styles.swatches}>
                  {theme.preview.map((color,i) => (
                    <span key={i} className={styles.swatch} style={{ background: color }} title={color}/>
                  ))}
                </div>
              </div>

              {/* Apply button */}
              <button
                className={`btn ${selectedId===theme.id ? 'btn-secondary' : 'btn-primary'} ${styles.applyBtn}`}
                onClick={e => { e.stopPropagation(); onSelect(theme.id); onClose() }}
              >
                {selectedId===theme.id ? '✓ Aplicado' : 'Aplicar template'}
              </button>
            </div>
          ))}
        </div>

        <p className={styles.disclaimer}>
          Los estilos son inspirados en los templates originales. Para acceder a los templates completos visita ThemeForest.net
        </p>
      </div>
    </div>
  )
}
