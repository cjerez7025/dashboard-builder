'use client'
import { useEffect, useRef, useState } from 'react'

/**
 * High3DChart — Highcharts 3D para bar_v, bar_h, pie, donut, scatter
 * type: 'bar3d' | 'column3d' | 'pie3d' | 'donut3d' | 'scatter3d'
 */
export default function High3DChart({ type, config, rows, title, envatoTheme }) {
  const containerRef = useRef()
  const chartRef     = useRef()
  const [error, setError]   = useState(null)

  const hc = envatoTheme?.highcharts || {}
  const colors = hc.colors || ['#6366F1','#10B981','#F59E0B','#EF4444','#8B5CF6','#06B6D4','#F97316']

  useEffect(() => {
    if (!containerRef.current || !rows?.length) return

    let Highcharts
    async function init() {
      try {
        const mod = await import('highcharts')
        Highcharts = mod.default || mod

        // Load 3D module
        const mod3d = await import('highcharts/highcharts-3d')
        const fn3d  = mod3d.default || mod3d
        if (typeof fn3d === 'function') fn3d(Highcharts)

        // Load cylinder module for nicer bars
        try {
          const cylMod = await import('highcharts/modules/cylinder')
          const cylFn  = cylMod.default || cylMod
          if (typeof cylFn === 'function') cylFn(Highcharts)
        } catch {}

        // ── Aggregate data ────────────────────────────────────────────
        const { groupBy, metric, aggregation = 'sum', limit = 10,
                sortBy = 'value', sortDir = 'desc',
                xAxis, yAxis, zAxis } = config

        let seriesData = []
        let chartOptions = {}

        if (type === 'scatter3d') {
          // Scatter 3D — needs xAxis, yAxis, zAxis columns
          const xCol = xAxis || config.xAxis
          const yCol = yAxis || config.yAxis
          const zCol = zAxis || config.zAxis || metric
          seriesData = rows
            .filter(r => r[xCol] != null && r[yCol] != null)
            .slice(0, 200)
            .map(r => ({
              x: parseFloat(r[xCol]) || 0,
              y: parseFloat(r[yCol]) || 0,
              z: parseFloat(r[zCol]) || 1,
              name: r[groupBy] || '',
            }))

          chartOptions = {
            chart: {
              type: 'scatter',
              options3d: { enabled: true, alpha: 10, beta: 30, depth: 250, viewDistance: 5,
                fitToPlot: false,
                frame: {
                  bottom:{ size:1, color: hc.gridColor || 'rgba(255,255,255,0.05)' },
                  back:  { size:1, color: hc.gridColor || 'rgba(255,255,255,0.05)' },
                  side:  { size:1, color: hc.gridColor || 'rgba(255,255,255,0.05)' },
                },
              },
            },
            series: [{ type:'scatter3d', name: title, data: seriesData, colorByPoint:true, colors }],
            xAxis: { title:{ text: xCol, style:{ color: hc.labelColor } }, gridLineColor: hc.gridColor, labels:{ style:{ color: hc.labelColor } } },
            yAxis: { title:{ text: yCol, style:{ color: hc.labelColor } }, gridLineColor: hc.gridColor, labels:{ style:{ color: hc.labelColor } } },
            zAxis: { title:{ text: zCol, style:{ color: hc.labelColor } }, labels:{ style:{ color: hc.labelColor } } },
          }

        } else {
          // Grouped aggregation for bar3d, column3d, pie3d, donut3d
          const groups = {}
          rows.forEach(row => {
            const key = row[groupBy]
            if (!key) return
            const val = parseFloat(String(row[metric] || '0').replace(/[$,%]/g,'')) || 0
            if (!groups[key]) groups[key] = { sum:0, count:0, values:[] }
            groups[key].sum   += val
            groups[key].count += 1
            groups[key].values.push(val)
          })

          let entries = Object.entries(groups).map(([name, g]) => {
            let y = aggregation==='count' ? g.count
                  : aggregation==='avg'   ? g.sum/g.count
                  : aggregation==='max'   ? Math.max(...g.values)
                  : aggregation==='min'   ? Math.min(...g.values)
                  : g.sum
            return { name, y: Math.round(y*100)/100 }
          })

          if (sortBy==='value') entries.sort((a,b) => sortDir==='desc' ? b.y-a.y : a.y-b.y)
          else entries.sort((a,b) => sortDir==='desc' ? b.name.localeCompare(a.name) : a.name.localeCompare(b.name))
          entries = entries.slice(0, limit)

          if (type === 'pie3d' || type === 'donut3d') {
            chartOptions = {
              chart: {
                type: 'pie',
                options3d: { enabled:true, alpha:45, beta:0 },
              },
              series: [{
                type: 'pie',
                name: metric,
                data: entries.map((e,i) => ({ name:e.name, y:e.y, color:colors[i%colors.length] })),
                innerSize: type==='donut3d' ? '40%' : '0%',
                depth: 35,
                dataLabels: { color: hc.labelColor, style:{ textOutline:'none' } },
              }],
            }
          } else {
            // bar3d (horizontal) or column3d (vertical)
            const isHorizontal = type === 'bar3d'
            chartOptions = {
              chart: {
                type: isHorizontal ? 'bar' : 'column',
                options3d: { enabled:true, alpha:isHorizontal?0:5, beta:isHorizontal?5:0, depth:40, viewDistance:25 },
              },
              xAxis: {
                categories: entries.map(e => e.name),
                labels: { style:{ color: hc.labelColor }, overflow:'justify' },
                gridLineColor: hc.gridColor,
              },
              yAxis: {
                title: { text: null },
                labels: { style:{ color: hc.labelColor } },
                gridLineColor: hc.gridColor,
              },
              series: [{
                type: isHorizontal ? 'bar' : 'column',
                name: metric,
                data: entries.map((e,i) => ({ y:e.y, color:colors[i%colors.length] })),
                colorByPoint: true,
                depth: 25,
                edgeColor: 'rgba(0,0,0,0.2)',
                edgeWidth: 1,
                dataLabels: {
                  enabled: entries.length <= 10,
                  style:{ color: hc.labelColor, textOutline:'none', fontSize:'10px' },
                },
              }],
            }
          }
        }

        // ── Common options ────────────────────────────────────────────
        const options = {
          ...chartOptions,
          chart: {
            ...chartOptions.chart,
            backgroundColor: hc.bgColor || 'transparent',
            style: { fontFamily: 'inherit' },
            animation: { duration: 600 },
            // 3D rotation via mouse drag
            events: {
              load() {
                addDragRotation(this)
              },
            },
          },
          title: { text: null },
          colors,
          legend: { enabled: false },
          tooltip: {
            backgroundColor: hc.tooltipBg,
            borderColor: hc.tooltipBorder,
            style: { color: hc.tooltipColor },
          },
          credits: { enabled: false },
          plotOptions: {
            series: { animation: { duration:600 } },
            pie:    { allowPointSelect:true, cursor:'pointer' },
          },
        }

        if (chartRef.current) chartRef.current.destroy()
        chartRef.current = Highcharts.chart(containerRef.current, options)

      } catch (err) {
        console.error('[3DChart]', err)
        setError(err.message)
      }
    }

    init()
    return () => { if (chartRef.current) { chartRef.current.destroy(); chartRef.current = null } }
  }, [type, config, rows, envatoTheme])

  if (error) return (
    <div style={{ padding:16, fontSize:12, color:'#EF4444' }}>
      Error 3D: {error}
    </div>
  )

  return (
    <div style={{ position:'relative', width:'100%', height:'100%' }}>
      <div ref={containerRef} style={{ width:'100%', height:'100%', minHeight:260 }} />
      <div style={{
        position:'absolute', bottom:6, right:8,
        fontSize:9, opacity:.4, color: envatoTheme?.vars?.['--t-text-2'] || '#888',
        fontFamily:'inherit',
      }}>
        ↻ arrastra para rotar
      </div>
    </div>
  )
}

// ── Mouse drag to rotate 3D chart ────────────────────────────────────────
function addDragRotation(chart) {
  if (!chart?.options?.chart?.options3d?.enabled) return
  const container = chart.container
  let startX, startY, startAlpha, startBeta

  function onMouseDown(e) {
    startX     = e.clientX
    startY     = e.clientY
    startAlpha = chart.options.chart.options3d.alpha
    startBeta  = chart.options.chart.options3d.beta
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup',   onMouseUp)
  }

  function onMouseMove(e) {
    const deltaX = e.clientX - startX
    const deltaY = e.clientY - startY
    chart.update({
      chart: {
        options3d: {
          alpha: Math.min(80, Math.max(-80, startAlpha - deltaY / 2)),
          beta:  Math.min(80, Math.max(-80, startBeta  + deltaX / 2)),
        },
      },
    }, true, false, false)
  }

  function onMouseUp() {
    window.removeEventListener('mousemove', onMouseMove)
    window.removeEventListener('mouseup',   onMouseUp)
  }

  container.addEventListener('mousedown', onMouseDown)
}
