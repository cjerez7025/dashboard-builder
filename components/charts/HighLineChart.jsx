'use client'
import { useEffect, useRef } from 'react'
import { timeSeries } from '@/lib/DataAdapter'

export default function HighLineChart({ config, rows, title, themeId = 'midnight', envatoTheme = null }) {
  const containerRef = useRef()
  const chartRef     = useRef()

  useEffect(() => {
    let cancelled = false

    async function init() {
      if (!containerRef.current || !rows?.length) return
      const Highcharts = (await import('highcharts')).default
      const theme = envatoTheme
      const hc    = theme?.highcharts || {}
      const accent = hc.colors[0]

      const data = timeSeries(rows, config.xAxis, config.yAxis, config.aggregation || 'sum')
      if (!data.length || cancelled) return

      chartRef.current?.destroy()

      chartRef.current = Highcharts.chart(containerRef.current, {
        chart: {
          type: 'areaspline',
          backgroundColor: hc.bgColor,
          style: { fontFamily: 'DM Sans, system-ui, sans-serif' },
          animation: { duration: 700 },
          spacing: [16, 16, 16, 8],
        },
        title: { text: null },
        colors: hc.colors,
        xAxis: {
          categories: data.map(d => d.date),
          labels: {
            style: { color: hc.labelColor, fontSize: '11px' },
            rotation: data.length > 12 ? -35 : 0,
          },
          lineColor: hc.gridColor,
          tickColor: 'transparent',
        },
        yAxis: {
          title: { text: null },
          gridLineColor: hc.gridColor,
          labels: { style: { color: hc.labelColor, fontSize: '11px' } },
        },
        series: [{
          name: title,
          data: data.map(d => Math.round(d.value * 100) / 100),
          lineWidth: 2.5,
          color: accent,
          marker: {
            enabled: data.length <= 24,
            radius: 4,
            fillColor: accent,
            lineColor: theme.vars['--t-surface'],
            lineWidth: 2,
          },
          fillColor: {
            linearGradient: { x1: 0, y1: 0, x2: 0, y2: 1 },
            stops: [
              [0, accent + '40'],
              [1, accent + '00'],
            ],
          },
        }],
        legend: { enabled: false },
        tooltip: {
          backgroundColor: hc.tooltipBg,
          borderColor: hc.tooltipBorder,
          borderRadius: 8,
          style: { color: hc.tooltipColor, fontSize: '12px' },
          shared: true,
        },
        plotOptions: {
          areaspline: { animation: { duration: 800 } },
        },
        credits: { enabled: false },
      })
    }

    init()
    return () => {
      cancelled = true
      chartRef.current?.destroy()
      chartRef.current = null
    }
  }, [config, rows, title, themeId])

  return <div style={{ width: '100%', height: '100%', minHeight: 240 }} ref={containerRef} />
}
