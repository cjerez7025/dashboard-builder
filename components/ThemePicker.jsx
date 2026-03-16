'use client'
import { ENVATO_THEMES } from '@/lib/envatoThemes'
import styles from './ThemePicker.module.css'

export default function ThemePicker({ selected, onChange, onOpenGallery }) {
  const current = ENVATO_THEMES.find(t => t.id === selected)

  return (
    <div className={styles.wrap}>
      {/* Botón principal que abre la galería */}
      <button className={styles.galleryBtn} onClick={onOpenGallery}>
        <div className={styles.galleryBtnLeft}>
          <div className={styles.envatoLogo}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="#82B541"/>
              <path d="M2 17L12 22L22 17" stroke="#82B541" strokeWidth="1.5" fill="none"/>
              <path d="M2 12L12 17L22 12" stroke="#82B541" strokeWidth="1.5" fill="none"/>
            </svg>
          </div>
          <div>
            <p className={styles.galleryLabel}>Template Visual</p>
            <p className={styles.gallerySub}>
              {current ? current.name : 'Seleccionar template'}
            </p>
          </div>
        </div>
        <div className={styles.galleryRight}>
          {current && (
            <div className={styles.swatches}>
              {current.preview.slice(0,4).map((color, i) => (
                <span key={i} className={styles.swatch} style={{ background: color }} />
              ))}
            </div>
          )}
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="6,9 12,15 18,9"/>
          </svg>
        </div>
      </button>

      {/* Template activo mini-preview */}
      {current && (
        <div className={styles.activePreview} onClick={onOpenGallery}>
          <MiniPreview theme={current} />
          <div className={styles.activeOverlay}>
            <span>Cambiar template →</span>
          </div>
        </div>
      )}
    </div>
  )
}

function MiniPreview({ theme }) {
  const c  = theme.highcharts.colors
  const bg = theme.vars['--t-bg']
  const sf = theme.vars['--t-surface']
  const bd = theme.vars['--t-border']
  const r  = Math.min(parseInt(theme.vars['--t-radius']) || 6, 5)
  const d  = theme.previewData

  const maxH = Math.max(...d.bars)
  const bars = d.bars.map(h => Math.round((h / maxH) * 30))
  const circ = 88
  let off = 0
  const total = d.donut.reduce((a,b)=>a+b,0)
  const segs = d.donut.map((v,i) => {
    const len = (v/total)*circ
    const s = { len, off, color: c[i%c.length] }
    off += len
    return s
  })

  return (
    <svg width="100%" viewBox="0 0 200 80" xmlns="http://www.w3.org/2000/svg" style={{ display:'block' }}>
      <rect width="200" height="80" fill={bg}/>
      {d.kpis.map((val,i) => {
        const x = 4 + i*48
        return (
          <g key={i}>
            <rect x={x} y="4" width="43" height="18" rx={r} fill={sf} stroke={bd} strokeWidth="0.5"/>
            <rect x={x} y="4" width="43" height="2.5" rx="1" fill={c[i%c.length]}/>
            <text x={x+21.5} y="16" textAnchor="middle" fontSize="7" fill={c[i%c.length]} fontWeight="bold">{val}</text>
          </g>
        )
      })}
      <rect x="4" y="28" width="118" height="46" rx={r} fill={sf} stroke={bd} strokeWidth="0.5"/>
      {bars.map((h,i) => (
        <rect key={i} x={8+i*18} y={74-h} width="13" height={h} rx="1.5" fill={c[i%c.length]} opacity="0.9"/>
      ))}
      <rect x="128" y="28" width="68" height="46" rx={r} fill={sf} stroke={bd} strokeWidth="0.5"/>
      {segs.map((s,i) => (
        <circle key={i} cx="162" cy="51" r="17" fill="none"
          stroke={s.color} strokeWidth="6"
          strokeDasharray={`${s.len} ${circ-s.len}`}
          strokeDashoffset={-s.off}
          style={{ transform:'rotate(-90deg)', transformOrigin:'162px 51px' }}/>
      ))}
      <circle cx="162" cy="51" r="10" fill={bg}/>
    </svg>
  )
}
