'use client'
import { useEffect, useRef } from 'react'
import { groupBy } from '@/lib/DataAdapter'

export default function HighPieChart({ type, config, rows, title, themeId = 'midnight', envatoTheme = null }) {
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
        config.metric || config.groupBy,
        config.aggregation || 'count',
        config.limit || 8,
      )
      if (!data.length || cancelled) return

      chartRef.current?.destroy()

      chartRef.current = Highcharts.chart(containerRef.current, {
        chart: {
          type: 'pie',
          backgroundColor: hc.bgColor,
          style: { fontFamily: 'DM Sans, system-ui, sans-serif' },
          animation: { duration: 700 },
          spacing: [8, 8, 8, 8],
        },
        title: { text: null },
        colors: hc.colors,
        series: [{
          name: title,
          data: data.map(d => ({ name: d.name, y: d.value })),
          innerSize: type === 'donut' ? '58%' : '0%',
          borderWidth: 2,
          borderColor: theme.vars['--t-surface'],
          dataLabels: {
            enabled: true,
            style: { color: hc.labelColor, fontSize: '11px', fontWeight: '400', textOutline: 'none' },
            format: '<b>{point.name}</b><br>{point.percentage:.1f}%',
            distance: 18,
          },
          showInLegend: true,
        }],
        legend: {
          enabled: true,
          itemStyle: { color: hc.labelColor, fontSize: '11px', fontWeight: '400' },
          itemHoverStyle: { color: hc.titleColor },
          align: 'center',
          verticalAlign: 'bottom',
          layout: 'horizontal',
          symbolRadius: 4,
        },
        tooltip: {
          backgroundColor: hc.tooltipBg,
          borderColor: hc.tooltipBorder,
          borderRadius: 8,
          style: { color: hc.tooltipColor, fontSize: '12px' },
          pointFormat: '<b>{point.percentage:.1f}%</b> ({point.y})',
        },
        plotOptions: {
          pie: {
            animation: { duration: 700 },
            allowPointSelect: true,
            cursor: 'pointer',
          },
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
  }, [type, config, rows, title, themeId])

  return <div style={{ width: '100%', height: '100%', minHeight: 260 }} ref={containerRef} />
}
