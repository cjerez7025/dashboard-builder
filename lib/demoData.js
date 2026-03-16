/**
 * Demo dataset — ventas de e-commerce
 * Permite probar la app sin conectar ninguna fuente externa
 */

function rnd(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

const CATEGORIES  = ['Electronics', 'Clothing', 'Home & Garden', 'Sports', 'Books', 'Toys', 'Beauty', 'Food']
const REGIONS     = ['North', 'South', 'East', 'West', 'Central']
const CHANNELS    = ['Online', 'Store', 'Mobile App', 'Partner']
const MONTHS      = ['2024-01','2024-02','2024-03','2024-04','2024-05','2024-06',
                     '2024-07','2024-08','2024-09','2024-10','2024-11','2024-12']

// Seed so it's deterministic-ish
const rows = Array.from({ length: 200 }, (_, i) => ({
  order_id:    `ORD-${String(i + 1001).padStart(5, '0')}`,
  date:        MONTHS[i % 12] + '-' + String(rnd(1, 28)).padStart(2, '0'),
  category:    CATEGORIES[i % CATEGORIES.length],
  region:      REGIONS[i % REGIONS.length],
  channel:     CHANNELS[i % CHANNELS.length],
  revenue:     rnd(20, 1200),
  units:       rnd(1, 15),
  customer_id: `CUST-${rnd(100, 500)}`,
  rating:      +(rnd(30, 50) / 10).toFixed(1),
}))

export const DEMO_DATASET = {
  columns: [
    { name: 'order_id',    type: 'string', sample: ['ORD-01001', 'ORD-01002'] },
    { name: 'date',        type: 'date',   sample: ['2024-01-15', '2024-02-08'] },
    { name: 'category',    type: 'string', sample: ['Electronics', 'Clothing'] },
    { name: 'region',      type: 'string', sample: ['North', 'South'] },
    { name: 'channel',     type: 'string', sample: ['Online', 'Store'] },
    { name: 'revenue',     type: 'number', sample: [450, 230] },
    { name: 'units',       type: 'number', sample: [3, 7] },
    { name: 'customer_id', type: 'string', sample: ['CUST-123', 'CUST-456'] },
    { name: 'rating',      type: 'number', sample: [4.2, 3.8] },
  ],
  rows,
  summary: {
    rowCount:            rows.length,
    columnCount:         9,
    numericColumns:      ['revenue', 'units', 'rating'],
    categoricalColumns:  ['order_id', 'category', 'region', 'channel', 'customer_id'],
    dateColumns:         ['date'],
  },
}

export const DEMO_CONFIG = {
  title: 'E-Commerce Sales Overview',
  layout: 'grid',
  columns: 12,
  visuals: [
    {
      id: 'kpi_revenue', type: 'kpi', title: 'Total Revenue',
      colSpan: 3, rowSpan: 1,
      config: { metric: 'revenue', aggregation: 'sum', format: 'currency', accent: '#6366F1' },
    },
    {
      id: 'kpi_orders', type: 'kpi', title: 'Total Orders',
      colSpan: 3, rowSpan: 1,
      config: { metric: 'order_id', aggregation: 'count', format: 'number', accent: '#10B981' },
    },
    {
      id: 'kpi_avg', type: 'kpi', title: 'Avg Order Value',
      colSpan: 3, rowSpan: 1,
      config: { metric: 'revenue', aggregation: 'avg', format: 'currency', accent: '#F59E0B' },
    },
    {
      id: 'kpi_customers', type: 'kpi', title: 'Unique Customers',
      colSpan: 3, rowSpan: 1,
      config: { metric: 'customer_id', aggregation: 'distinctcount', format: 'number', accent: '#8B5CF6' },
    },
    {
      id: 'bar_category', type: 'bar_v', title: 'Revenue by Category',
      colSpan: 6, rowSpan: 2,
      config: { groupBy: 'category', metric: 'revenue', aggregation: 'sum', limit: 8, sortBy: 'value', sortDir: 'desc' },
    },
    {
      id: 'donut_region', type: 'donut', title: 'Sales by Region',
      colSpan: 6, rowSpan: 2,
      config: { groupBy: 'region', metric: 'revenue', aggregation: 'sum', limit: 5 },
    },
    {
      id: 'line_trend', type: 'line', title: 'Revenue Trend',
      colSpan: 8, rowSpan: 2,
      config: { xAxis: 'date', yAxis: 'revenue', aggregation: 'sum' },
    },
    {
      id: 'bar_channel', type: 'bar_h', title: 'Orders by Channel',
      colSpan: 4, rowSpan: 2,
      config: { groupBy: 'channel', metric: 'order_id', aggregation: 'count', limit: 4, sortBy: 'value', sortDir: 'desc' },
    },
    {
      id: 'table_orders', type: 'table', title: 'Recent Orders',
      colSpan: 12, rowSpan: 2,
      config: {
        columns: ['order_id', 'date', 'category', 'region', 'channel', 'revenue', 'units', 'rating'],
        pageSize: 8,
        sortBy: 'revenue',
      },
    },
  ],
}
