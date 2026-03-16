'use client'
import { useEffect, useRef, useState } from 'react'
import Highcharts from 'highcharts'
import drilldownInit from 'highcharts/modules/drilldown'

// Init drilldown module once at module level
let drilldownReady = false
function ensureDrilldown() {
  if (!drilldownReady) {
    try { drilldownInit(Highcharts); drilldownReady = true } catch(e) {}
  }
}

export default function DrilldownChart({ config, rows, title, envatoTheme }) {
  const containerRef = useRef()
  const chartRef     = useRef()
  const [breadcrumb, setBreadcrumb] = useState([])
  const [error,      setError]      = useState(null)

  const hc     = envatoTheme?.highcharts || {}
  const colors = hc.colors || ['#6366F1','#10B981','#F59E0B','#EF4444','#8B5CF6','#06B6D4','#F97316','#EC4899']

  useEffect(() => {
    if (!containerRef.current || !rows?.length) return
    ensureDrilldown()

    const {
      groupBy, drillBy, drillBy3,
      metric, aggregation = 'sum',
      chartType = 'column', limit = 10,
    } = config || {}

    if (!groupBy || !metric) return

    try {
      // ── Aggregate helper ──────────────────────────────────────────
      function aggregate(rowSet, groupCol) {
        const groups = {}
        rowSet.forEach(row => {
          const key = String(row[groupCol] ?? 'N/A').trim()
          if (!key) return
          const raw = String(row[metric] || '0').replace(/[$,%\s]/g,'')
          const val = parseFloat(raw) || 0
          if (!groups[key]) groups[key] = { sum:0, count:0, values:[], rows:[], distinct:new Set() }
          groups[key].sum   += val
          groups[key].count += 1
          groups[key].values.push(val)
          groups[key].rows.push(row)
          groups[key].distinct.add(String(row[metric] || ''))
        })
        return Object.entries(groups)
          .map(([name, g]) => ({
            name,
            y: aggregation === 'count'         ? g.count
               : aggregation === 'distinctcount'? g.distinct.size
               : aggregation === 'avg'          ? Math.round((g.sum/g.count)*100)/100
               : aggregation === 'max'          ? Math.max(...g.values)
               : aggregation === 'min'          ? Math.min(...g.values)
               : Math.round(g.sum*100)/100,
            rows: g.rows,
          }))
          .sort((a,b) => b.y - a.y)
          .slice(0, limit)
      }

      // ── Build data levels ─────────────────────────────────────────
      const level1 = aggregate(rows, groupBy)
      const drilldownSeries = []

      if (drillBy) {
        level1.forEach(item => {
          const level2 = aggregate(item.rows, drillBy)
          drilldownSeries.push({
            id:   `dd_${item.name}`,
            name: item.name,
            type: chartType === 'pie' ? 'pie' : chartType,
            data: level2.map((sub, j) => ({
              name:      sub.name,
              y:         sub.y,
              color:     colors[j % colors.length],
              drilldown: drillBy3 ? `dd_${item.name}_${sub.name}` : undefined,
            })),
          })

          if (drillBy3) {
            level2.forEach(sub => {
              const level3 = aggregate(sub.rows, drillBy3)
              drilldownSeries.push({
                id:   `dd_${item.name}_${sub.name}`,
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

      // ── Chart options ─────────────────────────────────────────────
      const isPie = chartType === 'pie'

      const options = {
        chart: {
          type:            isPie ? 'pie' : chartType,
          backgroundColor: hc.bgColor || 'transparent',
          style:           { fontFamily: 'inherit' },
          animation:       { duration: 350 },
          events: {
            drilldown(e) { setBreadcrumb(bc => [...bc, e.point?.name || '']) },
            drillup()    { setBreadcrumb(bc => bc.slice(0,-1)) },
          },
        },
        title:   { text: null },
        colors,
        credits: { enabled: false },

        xAxis: isPie ? undefined : {
          type:          'category',
          labels:        { style: { color: hc.labelColor || '#888' }, overflow: 'justify' },
          gridLineColor: hc.gridColor || 'rgba(255,255,255,0.05)',
        },
        yAxis: isPie ? undefined : {
          title:         { text: null },
          labels:        { style: { color: hc.labelColor || '#888' } },
          gridLineColor: hc.gridColor || 'rgba(255,255,255,0.05)',
        },

        legend:  { enabled: isPie },

        tooltip: {
          backgroundColor: hc.tooltipBg    || '#1E2540',
          borderColor:     hc.tooltipBorder || 'rgba(255,255,255,0.08)',
          style:           { color: hc.tooltipColor || '#fff' },
          formatter() {
            const pct = this.percentage ? ` (${this.percentage.toFixed(1)}%)` : ''
            const hint = drillBy && this.point?.drilldown ? ' · click ↓' : ''
            return `<b>${this.point.name}</b><br/>${metric}: <b>${(this.y||0).toLocaleString()}</b>${pct}${hint}`
          },
        },

        plotOptions: {
          series: {
            animation:   { duration: 350 },
            borderWidth: 0,
            dataLabels: {
              enabled: true,
              style:   { color: hc.labelColor || '#888', textOutline: 'none', fontSize: '10px' },
              formatter() { return this.y > 0 ? (this.y||0).toLocaleString() : '' },
            },
            cursor: drillBy ? 'pointer' : 'default',
          },
          pie: {
            allowPointSelect: true,
            dataLabels: {
              enabled: true,
              style:   { color: hc.tooltipColor || '#fff', textOutline: 'none', fontSize: '11px' },
            },
          },
        },

        drilldown: {
          activeAxisLabelStyle: { color: hc.labelColor || '#888', textDecoration: 'none' },
          activeDataLabelStyle: { color: hc.tooltipColor || '#fff', textDecoration: 'none' },
          breadcrumbs: {
            buttonTheme: {
              style:  { color: hc.labelColor || '#888' },
              states: { hover: { fill: hc.tooltipBg || '#1E2540', style: { color: hc.tooltipColor || '#fff' } } },
            },
            separator: { text: '›', style: { color: hc.labelColor || '#888' } },
          },
          animation: { duration: 250 },
          series:    drilldownSeries,
        },

        series: [{
          name:         title,
          type:         isPie ? 'pie' : chartType,
          colorByPoint: true,
          data: level1.map((item, i) => ({
            name:      item.name,
            y:         item.y,
            color:     colors[i % colors.length],
            drilldown: drillBy ? `dd_${item.name}` : undefined,
          })),
        }],
      }

      // Destroy previous chart safely
      if (chartRef.current) {
        try { chartRef.current.destroy() } catch(e) {}
        chartRef.current = null
      }

      chartRef.current = Highcharts.chart(containerRef.current, options)

    } catch (err) {
      console.error('[DrilldownChart]', err)
      setError(err.message)
    }

    return () => {
      if (chartRef.current) {
        try { chartRef.current.destroy() } catch(e) {}
        chartRef.current = null
      }
    }
  }, [config, rows, envatoTheme])

  if (error) return (
    <div style={{ padding:16, fontSize:12, color:'#EF4444', lineHeight:1.5 }}>
      ⚠️ Error drilldown: {error}
    </div>
  )

  const levels = [config?.groupBy, config?.drillBy, config?.drillBy3].filter(Boolean)

  return (
    <div style={{ position:'relative', width:'100%', height:'100%' }}>
      {levels.length > 1 && (
        <div style={{
          position:'absolute', top:4, right:8, zIndex:10,
          display:'flex', alignItems:'center', gap:4,
          fontSize:9, opacity:.5,
          color: envatoTheme?.vars?.['--t-text-2'] || '#888',
          fontFamily:'inherit', pointerEvents:'none',
        }}>
          {levels.map((l,i) => (
            <span key={i} style={{ display:'flex', alignItems:'center', gap:3 }}>
              {i>0 && <span>›</span>}
              <span style={{
                opacity:     breadcrumb.length===i ? 1 : 0.5,
                fontWeight:  breadcrumb.length===i ? 600 : 400,
              }}>{l}</span>
            </span>
          ))}
          <span style={{ marginLeft:4, opacity:.6 }}>· click para bajar nivel</span>
        </div>
      )}
      <div ref={containerRef} style={{ width:'100%', height:'100%', minHeight:260 }} />
    </div>
  )
}
