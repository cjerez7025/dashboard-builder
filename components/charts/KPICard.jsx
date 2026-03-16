'use client'
import { useEffect, useState, useRef } from 'react'
import { aggregate, formatValue } from '@/lib/DataAdapter'
import styles from './KPICard.module.css'

function useCountUp(target, duration = 900) {
  const [display, setDisplay] = useState(0)
  const rafRef = useRef()
  useEffect(() => {
    if (target === null || isNaN(target)) { setDisplay(target); return }
    const start = Date.now()
    const tick = () => {
      const progress = Math.min((Date.now() - start) / duration, 1)
      const ease = 1 - Math.pow(1 - progress, 3)
      setDisplay(target * ease)
      if (progress < 1) rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafRef.current)
  }, [target])
  return display
}

export default function KPICard({ config, rows, title, themeId = 'midnight', envatoTheme = null }) {
  const { metric, aggregation = 'count', format = 'number', accent } = config
  const theme = envatoTheme || { vars: {}, highcharts: { colors: ['#6366F1','#10B981','#F59E0B','#EF4444'] } }
  const cardAccent = accent || theme.highcharts.colors[0]

  const rawValue = metric && rows?.length ? aggregate(rows, metric, aggregation) : (rows?.length ?? 0)
  const animated = useCountUp(typeof rawValue === 'number' ? rawValue : 0)
  const display  = typeof rawValue === 'number' ? formatValue(animated, format) : '—'

  const aggLabels = {
    count: 'Total registros', sum: `Suma · ${metric || ''}`,
    avg: `Promedio · ${metric || ''}`, max: `Máximo · ${metric || ''}`,
    min: `Mínimo · ${metric || ''}`, distinctcount: `Únicos · ${metric || ''}`,
  }

  return (
    <div
      className={styles.card}
      style={{
        background:   theme.vars['--t-surface'],
        borderColor:  theme.vars['--t-border'],
        borderRadius: theme.vars['--t-radius'],
      }}
    >
      <div className={styles.accent} style={{ background: cardAccent }} />
      <div className={styles.body}>
        <p className={styles.label} style={{ color: theme.vars['--t-text-2'] }}>{title}</p>
        <p className={styles.value} style={{ color: cardAccent }}>{display}</p>
        <p className={styles.sub}   style={{ color: theme.vars['--t-text-3'] }}>{aggLabels[aggregation] || aggregation}</p>
      </div>
      <div className={styles.glow} style={{ background: cardAccent }} />
    </div>
  )
}
