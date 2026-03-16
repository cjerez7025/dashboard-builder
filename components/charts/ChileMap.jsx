'use client'
import { useEffect, useRef, useState } from 'react'
import { CHILE_GEOJSON, CHILE_REGIONS, normalizeRegionCode } from '@/lib/chileGeoJSON'
import { aggregate, formatValue } from '@/lib/DataAdapter'
import styles from './ChileMap.module.css'

export default function ChileMap({ config, rows, title, themeId = 'midnight' }) {
  const containerRef = useRef()
  const chartRef     = useRef()
  const [regionStats, setRegionStats] = useState(null)

  const {
    regionColumn,
    metric,
    aggregation   = 'sum',
    format        = 'number',
    extraMetrics  = [],
  } = config

  function buildMapData() {
    if (!regionColumn || !rows?.length) return []
    const groups = {}
    rows.forEach(row => {
      const code = normalizeRegionCode(row[regionColumn])
      if (!code) return
      if (!groups[code]) groups[code] = []
      groups[code].push(row)
    })
    return Object.entries(groups).map(([code, groupRows]) => ({
      code,
      'hc-key': code,
      name:  CHILE_REGIONS[code] || code,
      value: metric ? aggregate(groupRows, metric, aggregation) : groupRows.length,
      rows:  groupRows,
    }))
  }

  function buildStats(code) {
    if (!rows?.length || !regionColumn) return null
    const regionRows = rows.filter(r => normalizeRegionCode(r[regionColumn]) === code)
    if (!regionRows.length) return null

    const stats = []
    if (metric) {
      stats.push({
        label:   metric,
        value:   formatValue(aggregate(regionRows, metric, aggregation), format),
        primary: true,
      })
    }
    extraMetrics.forEach(m => {
      stats.push({
        label: m.label || m.column,
        value: formatValue(aggregate(regionRows, m.column, m.aggregation || 'sum'), m.format || 'number'),
      })
    })
    stats.push({ label: 'Registros', value: regionRows.length.toLocaleString() })
    return { code, name: CHILE_REGIONS[code] || code, stats }
  }

  useEffect(() => {
    let cancelled = false

    async function init() {
      if (!containerRef.current) return

      // Highcharts 12 — use highmaps bundle which includes map support
      const Highcharts = (await import('highcharts/highmaps')).default

      if (cancelled || !containerRef.current) return

      const theme = envatoTheme || { vars: {}, highcharts: { colors: ['#6366F1','#10B981','#F59E0B'] } }
      const hc    = theme.highcharts
      const data  = buildMapData()

      chartRef.current?.destroy()

      chartRef.current = Highcharts.mapChart(containerRef.current, {
        chart: {
          backgroundColor: hc.bgColor,
          style: { fontFamily: 'DM Sans, system-ui, sans-serif' },
          animation: { duration: 500 },
          spacing: [8, 8, 8, 8],
        },
        title:    { text: null },
        subtitle: { text: null },
        credits:  { enabled: false },

        colorAxis: data.length > 0 ? {
          min: 0,
          stops: [
            [0,   theme.vars['--t-elevated']],
            [0.5, hc.colors[0] + '88'],
            [1,   hc.colors[0]],
          ],
          labels: { style: { color: hc.labelColor, fontSize: '10px' } },
        } : undefined,

        legend: {
          enabled: data.length > 0,
          layout: 'vertical',
          align: 'right',
          verticalAlign: 'middle',
          itemStyle: { color: hc.labelColor, fontSize: '10px', fontWeight: '400' },
        },

        tooltip: {
          backgroundColor: hc.tooltipBg,
          borderColor:     hc.tooltipBorder,
          borderRadius:    8,
          style:           { color: hc.tooltipColor, fontSize: '12px' },
          formatter() {
            const v    = this.point.value
            const name = this.point.name
            if (v === undefined || v === null) return `<b>${name}</b><br>Sin datos`
            return `<b>${name}</b><br>${metric || 'valor'}: <b>${formatValue(v, format)}</b>`
          },
        },

        series: [{
          type:     'map',
          mapData:  CHILE_GEOJSON,
          data:     data.map(d => ({ 'hc-key': d.code, code: d.code, name: d.name, value: d.value })),
          joinBy:   ['id', 'hc-key'],
          name:     title,
          nullColor: theme.vars['--t-elevated'],
          borderColor: theme.vars['--t-border'],
          borderWidth: 1,
          states: {
            hover:  { borderColor: hc.colors[0], borderWidth: 2, brightness: 0.15 },
            select: { color: hc.colors[0] + 'BB', borderColor: hc.colors[0], borderWidth: 2 },
          },
          allowPointSelect: true,
          cursor: 'pointer',
          point: {
            events: {
              select() {
                setRegionStats(buildStats(this.options.code || this['hc-key'] || this.id))
              },
              unselect() {
                setRegionStats(null)
              },
            },
          },
        }],

        mapNavigation: {
          enabled: true,
          buttonOptions: { verticalAlign: 'bottom' },
        },
      })
    }

    init()
    return () => {
      cancelled = true
      chartRef.current?.destroy()
      chartRef.current = null
    }
  }, [config, rows, themeId])

  const theme = envatoTheme || { vars: {}, highcharts: { colors: ['#6366F1','#10B981','#F59E0B'] } }

  return (
    <div className={styles.wrap}>
      <div className={styles.mapArea} ref={containerRef} />

      {regionStats ? (
        <div
          className={styles.panel}
          style={{
            background:   theme.vars['--t-elevated'],
            borderColor:  theme.vars['--t-border'],
            borderRadius: theme.vars['--t-radius'],
          }}
        >
          <div className={styles.panelHeader} style={{ borderColor: theme.vars['--t-border'] }}>
            <div>
              <p className={styles.panelRegion} style={{ color: theme.vars['--t-text-1'] }}>{regionStats.name}</p>
              <p className={styles.panelCode}   style={{ color: theme.vars['--t-text-3'] }}>Región {regionStats.code}</p>
            </div>
            <button className={styles.closeBtn} style={{ color: theme.vars['--t-text-3'] }}
              onClick={() => setRegionStats(null)}>✕</button>
          </div>
          <div className={styles.statsList}>
            {regionStats.stats.map((s, i) => (
              <div key={i} className={`${styles.stat} ${s.primary ? styles.primary : ''}`}
                style={{ borderColor: theme.vars['--t-border'] }}>
                <p className={styles.statLabel} style={{ color: theme.vars['--t-text-3'] }}>{s.label}</p>
                <p className={styles.statValue}
                  style={{ color: s.primary ? theme.vars['--t-accent'] : theme.vars['--t-text-1'] }}>{s.value}</p>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className={styles.panelEmpty}
          style={{ color: theme.vars['--t-text-3'], borderColor: theme.vars['--t-border'] }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
            <circle cx="12" cy="9" r="2.5"/>
          </svg>
          <span>Pincha una región para ver estadísticas</span>
        </div>
      )}
    </div>
  )
}
