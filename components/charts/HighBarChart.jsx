'use client'
import { useEffect, useRef } from 'react'
import { groupBy } from '@/lib/DataAdapter'

export default function HighBarChart({ type, config, rows, title, themeId = 'midnight', envatoTheme = null }) {
  const containerRef = useRef()
  const chartRef     = useRef()

  useEffect(() => {
    let cancelled = false

    async function init() {
      if (!containerRef.current || !rows?.length) return
      const Highcharts = (await import('highcharts')).default
      const theme = envatoTheme
      const hc    = theme?.highcharts || {}

      const data = groupBy(
        rows,
        config.groupBy,
        config.metric,
        config.aggregation || 'sum',
        config.limit || 15,
        config.sortBy  || 'value',
        config.sortDir || 'desc',
      )
      if (!data.length || cancelled) return

      chartRef.current?.destroy()

      const isHorizontal = type === 'bar_h'
      const categories   = data.map(d => d.name)
      const values       = data.map(d => Math.round(d.value * 100) / 100)

      chartRef.current = Highcharts.chart(containerRef.current, {
        chart: {
          type: isHorizontal ? 'bar' : 'column',
          backgroundColor: hc.bgColor,
          plotBackgroundColor: hc.plotBgColor,
          style: { fontFamily: 'DM Sans, system-ui, sans-serif' },
          animation: { duration: 600 },
          spacing: [16, 16, 16, 8],
        },
        title: { text: null },
        colors: hc.colors,
        xAxis: {
          categories,
          labels: {
            style: { color: hc.labelColor, fontSize: '11px' },
            ...(isHorizontal ? {} : { rotation: categories.length > 6 ? -35 : 0 }),
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
          data: values,
          colorByPoint: true,
          borderRadius: 4,
          borderWidth: 0,
          dataLabels: {
            enabled: data.length <= 10,
            style: { color: hc.labelColor, fontSize: '10px', fontWeight: '400', textOutline: 'none' },
          },
        }],
        legend: { enabled: false },
        tooltip: {
          backgroundColor: hc.tooltipBg,
          borderColor: hc.tooltipBorder,
          borderRadius: 8,
          style: { color: hc.tooltipColor, fontSize: '12px' },
        },
        credits: { enabled: false },
        plotOptions: {
          series: { animation: { duration: 700 } },
        },
      })
    }

    init()
    return () => {
      cancelled = true
      chartRef.current?.destroy()
      chartRef.current = null
    }
  }, [type, config, rows, title, themeId])

  return <div style={{ width: '100%', height: '100%', minHeight: 220 }} ref={containerRef} />
}
