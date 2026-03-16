'use client'
import { useEffect, useRef } from 'react'
import dynamic from 'next/dynamic'
import styles from './DashboardRenderer.module.css'
import KPICard   from './charts/KPICard'
import High3DChart    from '@/components/charts/High3DChart'
import DrilldownChart from '@/components/charts/DrilldownChart'
import DataTable from './charts/DataTable'

const HighBarChart  = dynamic(() => import('./charts/HighBarChart'),  { ssr: false })
const HighPieChart  = dynamic(() => import('./charts/HighPieChart'),  { ssr: false })
const HighLineChart = dynamic(() => import('./charts/HighLineChart'), { ssr: false })
const ChileMap      = dynamic(() => import('./charts/ChileMap'),      { ssr: false })

function ChartCard({ visual, rows, idx, themeId, theme, envatoTheme }) {
  const { type, title, colSpan, rowSpan = 1, config } = visual
  const col = Math.max(1, Math.min(12, Number(colSpan) || 4))

  function renderChart() {
    switch (type) {
      case 'kpi':                  return <KPICard      config={config} rows={rows} title={title} themeId={themeId} />
      case 'bar_h': case 'bar_v': return <HighBarChart  type={type} config={config} rows={rows} title={title} themeId={themeId} envatoTheme={envatoTheme} />
      case 'pie':   case 'donut': return <HighPieChart  type={type} config={config} rows={rows} title={title} themeId={themeId} envatoTheme={envatoTheme} />
      case 'line':                return <HighLineChart config={config} rows={rows} title={title} themeId={themeId} envatoTheme={envatoTheme} />
      case 'chile_map':            return <ChileMap    config={config} rows={rows} title={title} themeId={themeId} envatoTheme={envatoTheme} />
      case 'bar3d':
      case 'column3d':
      case 'pie3d':
      case 'donut3d':
      case 'scatter3d':              return <High3DChart type={type} config={config} rows={rows} title={title} envatoTheme={envatoTheme} />
      case 'drilldown':              return <DrilldownChart config={config} rows={rows} title={title} envatoTheme={envatoTheme} />
      case 'table':               return <DataTable     config={config} rows={rows} themeId={themeId} />
      default:                    return <p style={{ color: theme.vars['--t-text-3'], padding: 16, fontSize: 12 }}>Unknown: {type}</p>
    }
  }

  const isKpi = type === 'kpi'

  return (
    <div
      className={`${styles.chartCard} fade-up`}
      style={{
        gridColumn:       `span ${col}`,
        gridRow:          `span ${rowSpan}`,
        animationDelay:   `${idx * 55}ms`,
        background:       theme.vars['--t-surface'],
        borderColor:      theme.vars['--t-border'],
        borderRadius:     theme.vars['--t-radius'],
      }}
    >
      {!isKpi && (
        <div className={styles.cardHeader}>
          <span className={styles.cardTitle} style={{ color: theme.vars['--t-text-2'] }}>{title}</span>
          <span className={styles.cardType}  style={{ color: theme.vars['--t-text-3'], background: theme.vars['--t-elevated'] }}>{type}</span>
        </div>
      )}
      <div className={isKpi ? styles.kpiBody : styles.cardBody}>
        {renderChart()}
      </div>
    </div>
  )
}

export default function DashboardRenderer({ config, rows, id, themeId = 'midnight', envatoTheme = null }) {
  const wrapRef = useRef()
  // Use envatoTheme directly — it's always provided
  const theme = envatoTheme || { vars: {}, highcharts: { colors: ['#6366F1','#10B981','#F59E0B','#EF4444'], bgColor:'transparent', plotBgColor:'transparent', gridColor:'rgba(255,255,255,0.05)', labelColor:'#888', tooltipBg:'#1E2540', tooltipBorder:'rgba(255,255,255,0.08)', tooltipColor:'#fff', titleColor:'#fff' } }

  // Apply theme CSS variables to the dashboard wrapper
  useEffect(() => {
    if (!wrapRef.current) return
    Object.entries(theme.vars).forEach(([k, v]) => {
      wrapRef.current.style.setProperty(k, v)
    })
  }, [themeId])

  if (!config) return <EmptyState />

  return (
    <div
      ref={wrapRef}
      className={styles.wrap}
      id={id || 'dashboard-render'}
      style={{ background: theme.vars['--t-bg'], borderRadius: theme.vars['--t-radius'], padding: 24, fontFamily: theme.vars['--t-font'] || 'inherit' }}
    >
      <div className={styles.dashHeader}>
        <h1 className={styles.dashTitle} style={{ color: theme.vars['--t-text-1'] }}>{config.title}</h1>
        <div className={styles.dashMeta}>
          <span className={styles.metaBadge} style={{ color: theme.vars['--t-text-3'], background: theme.vars['--t-elevated'], borderColor: theme.vars['--t-border'] }}>
            {config.visuals.length} visuals
          </span>
          {rows?.length && (
            <span className={styles.metaBadge} style={{ color: theme.vars['--t-text-3'], background: theme.vars['--t-elevated'], borderColor: theme.vars['--t-border'] }}>
              {rows.length.toLocaleString()} rows
            </span>
          )}
          <span className={styles.metaBadge} style={{ color: theme.vars['--t-accent'], background: theme.vars['--t-elevated'], borderColor: theme.vars['--t-border'] }}>
            {theme.name}
          </span>
        </div>
      </div>

      <div className={styles.grid}>
        {config.visuals.map((visual, i) => (
          <ChartCard
            key={visual.id || i}
            visual={visual}
            rows={rows}
            idx={i}
            themeId={themeId}
            theme={theme}
            envatoTheme={envatoTheme}
          />
        ))}
      </div>
    </div>
  )
}

function EmptyState() {
  return (
    <div className={styles.empty}>
      <div className={styles.emptyBg} aria-hidden>
        {Array.from({ length: 9 }).map((_, i) => (
          <div key={i} className={styles.emptyBgCard} style={{ animationDelay: `${i * 120}ms` }} />
        ))}
      </div>
      <div className={styles.emptyContent}>
        <div className={styles.emptyLogo}>
          <svg width="32" height="32" viewBox="0 0 22 22" fill="none">
            <rect x="1"  y="1"  width="8" height="8" rx="2" fill="var(--accent)" opacity="0.9"/>
            <rect x="13" y="1"  width="8" height="8" rx="2" fill="var(--accent)" opacity="0.5"/>
            <rect x="1"  y="13" width="8" height="8" rx="2" fill="var(--accent)" opacity="0.5"/>
            <rect x="13" y="13" width="8" height="8" rx="2" fill="var(--accent)" opacity="0.9"/>
          </svg>
        </div>
        <h2 className={styles.emptyTitle}>Tu dashboard aparecerá aquí</h2>
        <p className={styles.emptySub}>Elige un template, conecta datos y describe lo que quieres visualizar</p>
        <div className={styles.steps}>
          <StepItem n="1" color="#6366F1" title="Elige un template"         desc="Selecciona el estilo visual en el panel izquierdo" />
          <StepItem n="2" color="#10B981" title="Conecta datos"             desc="Google Sheets, CSV, JSON o pega directamente" />
          <StepItem n="3" color="#F59E0B" title="Describe el dashboard"     desc="La IA genera los gráficos automáticamente" />
        </div>
        <p className={styles.demoHint}>
          ¿Quieres probarlo ahora? Usa <strong>Try with demo data</strong> en el panel izquierdo.
        </p>
      </div>
    </div>
  )
}

function StepItem({ n, color, title, desc }) {
  return (
    <div className={styles.stepItem}>
      <div className={styles.stepNum} style={{ background: `${color}22`, color, borderColor: `${color}44` }}>{n}</div>
      <div>
        <p className={styles.stepTitle}>{title}</p>
        <p className={styles.stepDesc}>{desc}</p>
      </div>
    </div>
  )
}
