'use client'
import { useEffect, useRef, useState } from 'react'

/**
 * DrilldownChart — Highcharts con drill down multinivel
 *
 * Config esperada:
 * {
 *   groupBy:    "columna nivel 1"   (ej: "Categoria")
 *   drillBy:    "columna nivel 2"   (ej: "Subcategoria")
 *   drillBy3:   "columna nivel 3"   (opcional)
 *   metric:     "columna numérica"
 *   aggregation:"sum|count|avg"
 *   chartType:  "bar|column|pie"    (forma del gráfico)
 *   limit:      10
 * }
 */
export default function DrilldownChart({ config, rows, title, envatoTheme }) {
  const containerRef = useRef()
  const chartRef     = useRef()
  const [breadcrumb, setBreadcrumb] = useState([])
  const [error, setError] = useState(null)

  const hc     = envatoTheme?.highcharts || {}
  const colors = hc.colors || ['#6366F1','#10B981','#F59E0B','#EF4444','#8B5CF6','#06B6D4','#F97316','#EC4899']

  useEffect(() => {
    if (!containerRef.current || !rows?.length) return

    async function init() {
      try {
        const mod = await import('highcharts')
        const Highcharts = mod.default || mod

        // Load drilldown module
        const ddMod = await import('highcharts/modules/drilldown')
        const ddFn  = ddMod.default || ddMod
        if (typeof ddFn === 'function') ddFn(Highcharts)

        const {
          groupBy,
          drillBy,
          drillBy3,
          metric,
          aggregation = 'sum',
          chartType   = 'column',
          limit       = 10,
        } = config

        // ── Build level-1 data ──────────────────────────────────────
        function aggregate(rowSet, groupCol) {
          const groups = {}
          rowSet.forEach(row => {
            const key = String(row[groupCol] ?? 'N/A').trim()
            if (!key) return
            const val = parseFloat(String(row[metric] || '0').replace(/[$,%\s]/g,'')) || 0
            const uid = String(row[metric] || '')
            if (!groups[key]) groups[key] = { sum:0, count:0, values:[], rows:[], distinct:new Set() }
            groups[key].sum   += val
            groups[key].count += 1
            groups[key].values.push(val)
            groups[key].rows.push(row)
            groups[key].distinct.add(uid)
          })
          return Object.entries(groups).map(([name, g]) => ({
            name,
            y: aggregation==='count'         ? g.count
               : aggregation==='distinctcount'? g.distinct.size
               : aggregation==='avg'          ? Math.round((g.sum/g.count)*100)/100
               : aggregation==='max'          ? Math.max(...g.values)
               : aggregation==='min'          ? Math.min(...g.values)
               : Math.round(g.sum*100)/100,
            rows: g.rows,
          })).sort((a,b) => b.y - a.y).slice(0, limit)
        }

        const level1 = aggregate(rows, groupBy)

        // ── Build drilldown series (level 2 and optionally 3) ──────
        const drilldownSeries = []

        if (drillBy) {
          level1.forEach((item, i) => {
            const level2 = aggregate(item.rows, drillBy)
            const drillId2 = `dd_${item.name}`

            // Level 2 series
            drilldownSeries.push({
              id:   drillId2,
              name: item.name,
              type: chartType === 'pie' ? 'pie' : chartType,
              data: level2.map((sub, j) => {
                const drillId3 = drillBy3 ? `dd_${item.name}_${sub.name}` : undefined
                return {
                  name:      sub.name,
                  y:         sub.y,
                  color:     colors[j % colors.length],
                  drilldown: drillId3,
                  _rows:     sub.rows,
                }
              }),
            })

            // Level 3 series (optional)
            if (drillBy3) {
              level2.forEach(sub => {
                const drillId3 = `dd_${item.name}_${sub.name}`
                const level3 = aggregate(sub.rows, drillBy3)
                drilldownSeries.push({
                  id:   drillId3,
                  name: `${item.name} › ${sub.name}`,
                  type: chartType === 'pie' ? 'pie' : chartType,
                  data: level3.map((leaf, k) => ({
                    name:  leaf.name,
                    y:     leaf.y,
                    color: colors[k % colors.length],
                  })),
                })
              })
            }
          })
        }

        // ── Chart options ───────────────────────────────────────────
        const isPie   = chartType === 'pie'
        const isBar   = chartType === 'bar'

        const options = {
          chart: {
            type:            isPie ? 'pie' : chartType,
            backgroundColor: hc.bgColor || 'transparent',
            style:           { fontFamily: 'inherit' },
            animation:       { duration: 400 },
            events: {
              drilldown(e) {
                setBreadcrumb(bc => [...bc, e.seriesOptions?.name || e.point?.name || ''])
              },
              drillup() {
                setBreadcrumb(bc => bc.slice(0,-1))
              },
            },
          },
          title:    { text: null },
          colors,
          credits:  { enabled: false },

          xAxis: isPie ? undefined : {
            type:           'category',
            labels:         { style: { color: hc.labelColor }, overflow: 'justify' },
            gridLineColor:  hc.gridColor,
          },
          yAxis: isPie ? undefined : {
            title:         { text: null },
            labels:        { style: { color: hc.labelColor } },
            gridLineColor: hc.gridColor,
          },

          legend:  { enabled: isPie },
          tooltip: {
            backgroundColor: hc.tooltipBg,
            borderColor:     hc.tooltipBorder,
            style:           { color: hc.tooltipColor },
            formatter() {
              const pct = this.percentage ? ` (${this.percentage.toFixed(1)}%)` : ''
              const arrow = drillBy && !this.point?.drilldown===false ? ' · click para detallar ↓' : ''
              return `<b>${this.point.name}</b><br/>${metric}: <b>${this.y.toLocaleString()}</b>${pct}${arrow}`
            },
          },

          plotOptions: {
            series: {
              animation:    { duration: 400 },
              borderWidth:  0,
              dataLabels: {
                enabled: true,
                style:   { color: hc.labelColor, textOutline: 'none', fontSize: '10px' },
                formatter() {
                  return this.y > 0 ? this.y.toLocaleString() : ''
                },
              },
              cursor: drillBy ? 'pointer' : 'default',
            },
            pie: {
              allowPointSelect: true,
              dataLabels: {
                enabled: true,
                style:   { color: hc.tooltipColor, textOutline: 'none', fontSize: '11px' },
              },
            },
          },

          drilldown: {
            activeAxisLabelStyle: { color: hc.labelColor, textDecoration: 'none' },
            activeDataLabelStyle: { color: hc.tooltipColor, textDecoration: 'none' },
            breadcrumbs: {
              buttonTheme: {
                style:  { color: hc.labelColor },
                states: { hover: { fill: hc.tooltipBg, style: { color: hc.tooltipColor } } },
              },
              separator: { text: '›', style: { color: hc.labelColor } },
            },
            animation: { duration: 300 },
            series:    drilldownSeries,
          },

          series: [{
            name:          title,
            type:          isPie ? 'pie' : chartType,
            colorByPoint:  true,
            data: level1.map((item, i) => ({
              name:      item.name,
              y:         item.y,
              color:     colors[i % colors.length],
              drilldown: drillBy ? `dd_${item.name}` : undefined,
            })),
          }],
        }

        if (chartRef.current) chartRef.current.destroy()
        chartRef.current = Highcharts.chart(containerRef.current, options)

      } catch (err) {
        console.error('[DrilldownChart]', err)
        setError(err.message)
      }
    }

    init()
    return () => { if (chartRef.current) { chartRef.current.destroy(); chartRef.current = null } }
  }, [config, rows, envatoTheme])

  if (error) return (
    <div style={{ padding:16, fontSize:12, color:'#EF4444' }}>Error drilldown: {error}</div>
  )

  const levels = [config.groupBy, config.drillBy, config.drillBy3].filter(Boolean)

  return (
    <div style={{ position:'relative', width:'100%', height:'100%' }}>
      {/* Nivel indicator */}
      {levels.length > 1 && (
        <div style={{
          position:'absolute', top:4, right:8, zIndex:10,
          display:'flex', alignItems:'center', gap:4,
          fontSize:9, opacity:.6,
          color: envatoTheme?.vars?.['--t-text-2'] || '#888',
          fontFamily:'inherit',
        }}>
          {levels.map((l,i) => (
            <span key={i} style={{ display:'flex', alignItems:'center', gap:3 }}>
              {i>0 && <span>›</span>}
              <span style={{ opacity: breadcrumb.length===i ? 1 : 0.5,
                fontWeight: breadcrumb.length===i ? 600 : 400 }}>{l}</span>
            </span>
          ))}
          <span style={{ marginLeft:4 }}>· click para bajar nivel</span>
        </div>
      )}
      <div ref={containerRef} style={{ width:'100%', height:'100%', minHeight:260 }} />
    </div>
  )
}
