/**
 * Dashboard Config JSON Schema
 * Defines the structure Claude returns and DashboardRenderer consumes
 */

export const VISUAL_TYPES = {
  KPI:     'kpi',
  BAR_H:   'bar_h',
  BAR_V:   'bar_v',
  PIE:     'pie',
  DONUT:   'donut',
  LINE:    'line',
  TABLE:   'table',
  CHILE_MAP: 'chile_map',
  BAR3D:   'bar3d',
  COL3D:   'column3d',
  PIE3D:   'pie3d',
  DONUT3D: 'donut3d',
  SCATTER3D:'scatter3d',
  DRILLDOWN:'drilldown',
  TABLE:   'table',
  CHILE_MAP: 'chile_map',
}

export const AGGREGATIONS = {
  COUNT:   'count',
  SUM:     'sum',
  AVG:     'avg',
  MAX:     'max',
  MIN:     'min',
  DISTINCT:'distinctcount',
}

export const FORMATS = {
  NUMBER:   'number',
  PERCENT:  'percent',
  CURRENCY: 'currency',
}

/** Validate a dashboard config object */
export function validateConfig(config) {
  const errors = []
  if (!config || typeof config !== 'object') return { valid: false, errors: ['Config must be an object'] }
  if (!config.title) errors.push('Missing title')
  if (!Array.isArray(config.visuals) || config.visuals.length === 0) errors.push('Missing or empty visuals array')

  config.visuals?.forEach((v, i) => {
    if (!v.id)      errors.push(`Visual[${i}] missing id`)
    if (!v.type)    errors.push(`Visual[${i}] missing type`)
    if (!v.title)   errors.push(`Visual[${i}] missing title`)
    if (!v.colSpan) errors.push(`Visual[${i}] missing colSpan`)
    if (!v.config)  errors.push(`Visual[${i}] missing config`)
    if (!Object.values(VISUAL_TYPES).includes(v.type)) {
      errors.push(`Visual[${i}] unknown type: ${v.type}`)
    }
  })

  return { valid: errors.length === 0, errors }
}

/** Normalize a config, filling defaults */
export function normalizeConfig(config) {
  return {
    title:   config.title   || 'Dashboard',
    layout:  config.layout  || 'grid',
    columns: config.columns || 12,
    visuals: (config.visuals || []).map((v, i) => ({
      id:      v.id      || `visual_${i}`,
      type:    v.type    || 'kpi',
      title:   v.title   || `Visual ${i + 1}`,
      colSpan: Number(v.colSpan) || 4,
      rowSpan: Number(v.rowSpan) || 1,
      config:  v.config  || {},
    })),
  }
}

/** Example config for demo purposes */
export const DEMO_CONFIG = {
  title: 'Sales Overview',
  layout: 'grid',
  columns: 12,
  visuals: [
    {
      id: 'kpi_1', type: 'kpi', title: 'Total Revenue',
      colSpan: 3, rowSpan: 1,
      config: { metric: 'revenue', aggregation: 'sum', format: 'currency', accent: '#6366F1' },
    },
    {
      id: 'kpi_2', type: 'kpi', title: 'Total Orders',
      colSpan: 3, rowSpan: 1,
      config: { metric: 'orders', aggregation: 'count', format: 'number', accent: '#10B981' },
    },
    {
      id: 'kpi_3', type: 'kpi', title: 'Avg Order Value',
      colSpan: 3, rowSpan: 1,
      config: { metric: 'revenue', aggregation: 'avg', format: 'currency', accent: '#F59E0B' },
    },
    {
      id: 'kpi_4', type: 'kpi', title: 'Unique Customers',
      colSpan: 3, rowSpan: 1,
      config: { metric: 'customer_id', aggregation: 'distinctcount', format: 'number', accent: '#8B5CF6' },
    },
    {
      id: 'bar_1', type: 'bar_v', title: 'Revenue by Category',
      colSpan: 6, rowSpan: 2,
      config: { groupBy: 'category', metric: 'revenue', aggregation: 'sum', limit: 8, sortBy: 'value', sortDir: 'desc' },
    },
    {
      id: 'pie_1', type: 'donut', title: 'Orders by Region',
      colSpan: 6, rowSpan: 2,
      config: { groupBy: 'region', metric: 'orders', aggregation: 'count', limit: 6 },
    },
  ],
}

// chile_map type added
// config: { regionColumn, metric, aggregation, format, extraMetrics: [{column, label, aggregation, format}] }
