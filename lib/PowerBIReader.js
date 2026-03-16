/**
 * PowerBIReader — parse .pbix / .pbit files in the browser
 *
 * WHAT WE EXTRACT:
 *   DataModelSchema  → tables, columns (with types), measures DAX, relationships
 *   Report/Layout    → pages, visual positions, field bindings, titles, filters
 *
 * KEY FEATURE: layoutToConfig()
 *   Converts Report/Layout directly into our Config JSON format,
 *   reproducing the original PBI report as faithfully as possible —
 *   no AI needed for this path.
 */

// ── Type mappings ──────────────────────────────────────────────────────────

const PBI_DATATYPE_MAP = {
  int64: 'number', double: 'number', decimal: 'number',
  currency: 'number', single: 'number', wholeNumber: 'number',
  dateTime: 'date', date: 'date', time: 'date',
  text: 'string', boolean: 'string', binary: 'string',
}

const PBI_VISUAL_MAP = {
  clusteredColumnChart: 'bar_v',
  stackedColumnChart:   'bar_v',
  hundredPercentStackedColumnChart: 'bar_v',
  clusteredBarChart:    'bar_h',
  stackedBarChart:      'bar_h',
  hundredPercentStackedBarChart: 'bar_h',
  lineChart:            'line',
  areaChart:            'line',
  lineStackedColumnCombo: 'line',
  pieChart:             'pie',
  donutChart:           'donut',
  funnel:               'bar_v',
  tableEx:              'table',
  pivotTable:           'table',
  card:                 'kpi',
  multiRowCard:         'kpi',
  kpi:                  'kpi',
  filledMap:            'chile_map',
  map:                  'chile_map',
  azureMap:             'chile_map',
  scatterChart:         'bar_v',
  ribbonChart:          'bar_v',
  waterfallChart:       'bar_v',
}

const DAX_AGG_MAP = {
  Sum:           'sum',
  Average:       'avg',
  Count:         'count',
  CountDistinct: 'distinctcount',
  Max:           'max',
  Min:           'min',
  CountRows:     'count',
}

const FORMAT_MAP = {
  '"$"#,0.00': 'currency', '$#,0.00': 'currency',
  '"$"#,0':    'currency', 'Currency': 'currency',
  '0.00%':     'percent',  '0%': 'percent',
  '#,0':       'number',   '#,0.00': 'number',
  '0':         'number',   'General': 'number',
}

// ── Main parser ─────────────────────────────────────────────────────────────

export async function parsePowerBIFile(file) {
  const { unzipSync } = await import('fflate')

  if (!file.name.endsWith('.pbix') && !file.name.endsWith('.pbit')) {
    throw new Error('Solo se admiten archivos .pbix y .pbit')
  }

  const buffer = await file.arrayBuffer()
  let entries
  try {
    entries = unzipSync(new Uint8Array(buffer))
  } catch {
    throw new Error('Archivo ZIP inválido. Verifica que sea un .pbix o .pbit sin corrupción.')
  }

  const result = {
    fileType:    file.name.endsWith('.pbit') ? 'pbit' : 'pbix',
    fileName:    file.name,
    tables:      [],
    measures:    [],
    relations:   [],
    reportPages: [],
    connections: [],
    rawFiles:    Object.keys(entries),
    canvasWidth:  1280,
    canvasHeight: 720,
  }

  // ── 1. DataModelSchema ─────────────────────────────────────────────────
  const schemaRaw = entries['DataModelSchema']
  if (schemaRaw) {
    parseDataModelSchema(schemaRaw, result)
  }

  // ── 2. Report/Layout ───────────────────────────────────────────────────
  const layoutRaw = entries['Report/Layout'] || entries['Report\\Layout']
  if (layoutRaw) {
    parseReportLayout(layoutRaw, result)
  }

  // ── 3. Connections ─────────────────────────────────────────────────────
  const connRaw = entries['Connections']
  if (connRaw) {
    try {
      const data = JSON.parse(decode(connRaw))
      result.connections = (data.Connections || []).map(c => ({
        connectionString: c.ConnectionString || '',
        provider: c.PbiServiceModelId ? 'Power BI Service' : 'Local / File',
      }))
    } catch {}
  }

  // ── 4. Infer tables from report if schema not available (.pbix) ────────
  if (result.tables.length === 0 && result.reportPages.length > 0) {
    result.tables  = inferTablesFromReport(result.reportPages)
    result.inferred = true
  }

  return result
}

// ── DataModelSchema parser ──────────────────────────────────────────────────

function parseDataModelSchema(raw, result) {
  try {
    const text  = decode(raw)
    const schema = JSON.parse(text)
    const model  = schema.model || schema

    // Tables + columns + measures
    ;(model.tables || []).forEach(table => {
      if (isSystemTable(table.name)) return

      const columns = (table.columns || [])
        .filter(c => c.type !== 'rowNumber' && !c.name?.startsWith('RowNumber'))
        .map(c => ({
          name:       c.name,
          dataType:   PBI_DATATYPE_MAP[c.dataType] || 'string',
          hidden:     !!c.isHidden,
          format:     c.formatString || null,
          expression: c.expression || null,  // calculated columns
          sortBy:     c.sortByColumn || null,
        }))

      const measures = (table.measures || []).map(m => ({
        name:        m.name,
        expression:  cleanDAX(m.expression || ''),
        format:      m.formatString || null,
        table:       table.name,
        hidden:      !!m.isHidden,
        description: m.description || null,
        // Parse aggregation type from DAX expression
        aggregation: inferAggFromDAX(m.expression || ''),
        formatType:  inferFormatType(m.formatString),
      }))

      result.tables.push({
        name:        table.name,
        hidden:      !!table.isHidden,
        description: table.description || null,
        columns,
        measures,
      })
      result.measures.push(...measures)
    })

    // Relationships
    result.relations = (model.relationships || []).map(r => ({
      fromTable:   r.fromTable,
      fromColumn:  r.fromColumn,
      toTable:     r.toTable,
      toColumn:    r.toColumn,
      from:        `${r.fromTable}[${r.fromColumn}]`,
      to:          `${r.toTable}[${r.toColumn}]`,
      active:      r.isActive !== false,
      cardinality: r.fromCardinality && r.toCardinality
        ? `${r.fromCardinality}:${r.toCardinality}`
        : 'many:one',
      crossFilter: r.crossFilteringBehavior || 'oneDirection',
    }))

  } catch (e) {
    console.warn('DataModelSchema parse error:', e.message)
  }
}

// ── Report/Layout parser ────────────────────────────────────────────────────

function parseReportLayout(raw, result) {
  try {
    const text   = decode(raw)
    const layout = JSON.parse(text)

    // Canvas size
    if (layout.config) {
      try {
        const cfg = JSON.parse(layout.config)
        result.canvasWidth  = cfg.defaultDrillFilterOtherVisuals ? 1280 : (layout.resourcePackages?.[0]?.resourcePackage?.items?.[0]?.width || 1280)
      } catch {}
    }

    result.reportPages = (layout.sections || []).map(section => {
      // Page canvas size
      const pageW = section.width  || result.canvasWidth  || 1280
      const pageH = section.height || result.canvasHeight || 720

      const rawVisuals = (section.visualContainers || []).map(vc => {
        let vcConfig = {}, vcFilters = []
        try { vcConfig  = JSON.parse(vc.config  || '{}') } catch {}
        try { vcFilters = JSON.parse(vc.filters || '[]') } catch {}

        const sv      = vcConfig.singleVisual || {}
        const vType   = sv.visualType || 'unknown'
        const prj     = sv.projections || {}
        const objects = sv.objects || {}

        // Extract all field bindings with roles
        const fieldBindings = extractFieldBindings(prj, sv.prototypeQuery)

        // Extract visual-level filters
        const visualFilters = vcFilters.map(f => ({
          table:  f.expression?.Column?.Expression?.SourceRef?.Entity || '',
          column: f.expression?.Column?.Property || f.expression?.Measure?.Property || '',
          type:   f.filterType === 1 ? 'basic' : 'advanced',
        })).filter(f => f.column)

        return {
          pbiType:       vType,
          type:          PBI_VISUAL_MAP[vType] || null,
          x:             vc.x     || 0,
          y:             vc.y     || 0,
          width:         vc.width  || 200,
          height:        vc.height || 150,
          zIndex:        vc.z || 0,
          title:         extractTitle(objects),
          showTitle:     extractShowTitle(objects),
          fieldBindings,
          filters:       visualFilters,
          config:        vcConfig,
        }
      })
      .filter(v => v.type !== null && v.pbiType !== 'textbox' && v.pbiType !== 'image' && v.pbiType !== 'shape')
      .sort((a, b) => a.y - b.y || a.x - b.x)

      // Page-level filters
      let pageFilters = []
      try { pageFilters = JSON.parse(section.filters || '[]') } catch {}

      return {
        name:        section.displayName || section.name || 'Página 1',
        ordinal:     section.ordinal || 0,
        width:       pageW,
        height:      pageH,
        visuals:     rawVisuals,
        filters:     pageFilters,
        hidden:      section.visibility === 1,
      }
    })
    .filter(p => !p.hidden)
    .sort((a, b) => a.ordinal - b.ordinal)

  } catch (e) {
    console.warn('Report/Layout parse error:', e.message)
  }
}

// ── Layout → Config JSON converter ─────────────────────────────────────────
// This is the KEY function: converts PBI report layout directly to our Config JSON
// WITHOUT needing AI — faithful reproduction of the original report structure.

export function layoutToConfig(model, pageIndex = 0) {
  const page = model.reportPages[pageIndex]
  if (!page) throw new Error('No hay páginas en el reporte')

  const GRID_COLS  = 12
  const pageW      = page.width  || 1280
  const pageH      = page.height || 720
  const colUnit    = pageW / GRID_COLS

  // Map measures by name for quick lookup
  const measureMap = {}
  model.measures.forEach(m => { measureMap[m.name] = m })

  // Map columns by "Table.Column" for quick lookup
  const columnMap = {}
  model.tables.forEach(t => {
    t.columns.forEach(c => { columnMap[`${t.name}.${c.name}`] = { ...c, tableName: t.name } })
  })

  const visuals = page.visuals.map((v, idx) => {
    // Convert pixel position → grid colSpan
    const colSpan = Math.max(1, Math.min(12, Math.round(v.width / colUnit)))
    const rowSpan = Math.max(1, Math.round(v.height / (pageH / 6)))

    const id    = `visual_${idx}_${v.pbiType}`
    const title = v.title || guessTitleFromFields(v.fieldBindings)

    const config = buildVisualConfig(v, measureMap, columnMap, model)

    return {
      id,
      type:    v.type,
      pbiType: v.pbiType,
      title,
      colSpan,
      rowSpan: Math.max(1, rowSpan),
      // Original PBI position (for reference)
      pbiPosition: { x: v.x, y: v.y, width: v.width, height: v.height },
      config,
    }
  })

  return {
    title:    page.name,
    layout:   'grid',
    columns:  12,
    visuals,
    // PBI metadata
    pbiSource: {
      file:      model.fileName,
      fileType:  model.fileType,
      page:      page.name,
      relations: model.relations,
    },
  }
}

function buildVisualConfig(visual, measureMap, columnMap, model) {
  const fb     = visual.fieldBindings
  const type   = visual.type

  // Helper to get best numeric field
  const getMetric = () => {
    const val = fb.values?.[0] || fb.y?.[0] || fb.tooltips?.[0]
    if (!val) return null
    // Prefer measures
    if (measureMap[val.field]) return { field: val.field, isMeasure: true, measure: measureMap[val.field] }
    return { field: val.field, isMeasure: false }
  }

  // Helper to get best categorical field
  const getCategory = () => {
    const cat = fb.category?.[0] || fb.axis?.[0] || fb.rows?.[0] || fb.legend?.[0]
    return cat?.field || null
  }

  const metric   = getMetric()
  const category = getCategory()

  switch (type) {
    case 'kpi': {
      const m = metric?.measure
      return {
        metric:      metric?.field || null,
        aggregation: m?.aggregation || 'sum',
        format:      m?.formatType  || 'number',
        accent:      KPI_COLORS[Object.keys(measureMap).indexOf(metric?.field) % KPI_COLORS.length] || '#6366F1',
      }
    }

    case 'bar_v':
    case 'bar_h': {
      const m = metric?.measure
      return {
        groupBy:     category,
        metric:      metric?.field || null,
        aggregation: m?.aggregation || 'sum',
        limit:       10,
        sortBy:      'value',
        sortDir:     'desc',
      }
    }

    case 'pie':
    case 'donut': {
      const m = metric?.measure
      return {
        groupBy:     category || (fb.details?.[0]?.field),
        metric:      metric?.field || null,
        aggregation: m?.aggregation || 'count',
        limit:       8,
      }
    }

    case 'line': {
      const xField = fb.category?.[0]?.field || fb.axis?.[0]?.field
      const m      = metric?.measure
      return {
        xAxis:       xField || null,
        yAxis:       metric?.field || null,
        aggregation: m?.aggregation || 'sum',
      }
    }

    case 'table': {
      const cols = [
        ...(fb.values   || []),
        ...(fb.rows     || []),
        ...(fb.columns  || []),
      ].map(f => f.field).filter(Boolean)
      return {
        columns:  cols.length > 0 ? cols : null,
        pageSize: 10,
        sortBy:   cols[0] || null,
      }
    }

    case 'chile_map': {
      const locationField = fb.location?.[0]?.field || fb.category?.[0]?.field
      const m = metric?.measure
      return {
        regionColumn: locationField || null,
        metric:       metric?.field || null,
        aggregation:  m?.aggregation || 'sum',
        format:       m?.formatType  || 'number',
        extraMetrics: (fb.tooltips || []).slice(1).map(t => ({
          column:      t.field,
          label:       t.field,
          aggregation: measureMap[t.field]?.aggregation || 'sum',
          format:      measureMap[t.field]?.formatType  || 'number',
        })),
      }
    }

    default:
      return {}
  }
}

// ── pbiModelToDataset ───────────────────────────────────────────────────────

export function pbiModelToDataset(model) {
  // Collect ALL visible columns from ALL tables
  const allColumns = []
  model.tables
    .filter(t => !t.hidden)
    .forEach(table => {
      table.columns
        .filter(c => !c.hidden)
        .forEach(c => {
          allColumns.push({
            name:      c.name,
            fullName:  `${table.name}.${c.name}`,
            tableName: table.name,
            type:      c.dataType,
            sample:    [],
          })
        })
    })

  if (allColumns.length === 0 && model.inferred) {
    // Use inferred columns
    model.tables.forEach(t => {
      t.columns.forEach(c => {
        allColumns.push({ name: c.name, fullName: `${t.name}.${c.name}`, tableName: t.name, type: 'string', sample: [] })
      })
    })
  }

  // Last resort: infer from report pages directly
  if (allColumns.length === 0 && model.reportPages.length > 0) {
    const inferred = inferTablesFromReport(model.reportPages)
    inferred.forEach(table => {
      table.columns.forEach(c => {
        allColumns.push({
          name:      c.name,
          fullName:  `${table.name}.${c.name}`,
          tableName: table.name,
          type:      c.dataType || 'string',
          sample:    [],
        })
      })
    })
    model.inferred = true
  }

  // Absolute fallback — generic schema so app never crashes
  if (allColumns.length === 0) {
    console.warn('Could not extract columns from .pbix — using generic schema')
    ;['Categoría', 'Región', 'Canal'].forEach(n =>
      allColumns.push({ name: n, fullName: `Data.${n}`, tableName: 'Data', type: 'string', sample: [] }))
    ;['Ventas', 'Unidades'].forEach(n =>
      allColumns.push({ name: n, fullName: `Data.${n}`, tableName: 'Data', type: 'number', sample: [] }))
    allColumns.push({ name: 'Fecha', fullName: 'Data.Fecha', tableName: 'Data', type: 'date', sample: [] })
    model.inferred     = true
    model.genericSchema = true
  }

  const numericColumns     = allColumns.filter(c => c.type === 'number').map(c => c.name)
  const categoricalColumns = allColumns.filter(c => c.type === 'string').map(c => c.name)
  const dateColumns        = allColumns.filter(c => c.type === 'date').map(c => c.name)

  return {
    columns: allColumns,
    rows:    [],
    summary: {
      rowCount:            0,
      columnCount:         allColumns.length,
      numericColumns,
      categoricalColumns,
      dateColumns,
      // PBI extras
      measures:            model.measures.map(m => ({ name: m.name, expression: m.expression, aggregation: m.aggregation, format: m.formatType })),
      measureNames:        model.measures.map(m => m.name),
      allTables:           model.tables.map(t => t.name),
      relations:           model.relations,
      reportPages:         model.reportPages.map(p => ({ name: p.name, visualCount: p.visuals.length })),
      sourceFile:          model.fileName,
      fileType:            model.fileType,
      inferred:            model.inferred || false,
    },
  }
}

// ── Prompt builder ──────────────────────────────────────────────────────────

export function buildPBIPromptSuggestion(model) {
  const measures   = model.measures.filter(m => !m.hidden).slice(0, 4)
  const firstPage  = model.reportPages[0]
  const firstTable = model.tables.find(t => !t.hidden) || model.tables[0]

  const parts = []

  // Lead with existing measures if available
  if (measures.length > 0) {
    parts.push(`KPIs con las medidas DAX del modelo: ${measures.map(m => m.name).join(', ')}`)
  }

  // Use visual types from first report page
  if (firstPage?.visuals.length > 0) {
    const types = [...new Set(firstPage.visuals.map(v => v.type).filter(Boolean))]
    const typeLabels = {
      bar_v: 'gráficos de columnas', bar_h: 'barras horizontales',
      line: 'línea de tendencia', pie: 'pie chart', donut: 'donut chart',
      table: 'tabla de datos', kpi: 'KPI cards', chile_map: 'mapa de Chile',
    }
    const chartDesc = types.map(t => typeLabels[t]).filter(Boolean).join(', ')
    if (chartDesc) parts.push(`incluyendo ${chartDesc} (como en la página "${firstPage.name}")`)
  }

  // Categorical columns for groupBy
  if (firstTable) {
    const catCols = firstTable.columns.filter(c => c.dataType === 'string' && !c.hidden).slice(0, 2)
    if (catCols.length > 0) parts.push(`agrupado por ${catCols.map(c => c.name).join(' y ')}`)

    const dateCols = firstTable.columns.filter(c => c.dataType === 'date' && !c.hidden).slice(0, 1)
    if (dateCols.length > 0) parts.push(`con tendencia temporal en ${dateCols[0].name}`)
  }

  // Relations context
  if (model.relations.length > 0) {
    parts.push(`respetando las ${model.relations.length} relaciones entre tablas del modelo`)
  }

  return parts.length > 0
    ? `Genera un dashboard fiel al modelo Power BI con: ${parts.join(', ')}.`
    : `Genera un dashboard completo basado en el modelo Power BI (${model.fileName})`
}

// ── Helpers ─────────────────────────────────────────────────────────────────

const KPI_COLORS = ['#6366F1','#10B981','#F59E0B','#EF4444','#8B5CF6','#06B6D4','#F97316']

function decode(uint8) {
  // BOM detection: UTF-16 LE = FF FE, UTF-8 BOM = EF BB BF
  if (uint8[0] === 0xFF && uint8[1] === 0xFE) {
    const buf = uint8.buffer.slice(uint8.byteOffset + 2, uint8.byteOffset + uint8.byteLength)
    return new TextDecoder('utf-16le').decode(buf)
  }
  if (uint8[0] === 0xEF && uint8[1] === 0xBB && uint8[2] === 0xBF) {
    return new TextDecoder('utf-8').decode(uint8.slice(3))
  }
  try { return new TextDecoder('utf-8').decode(uint8) }
  catch { return new TextDecoder('latin1').decode(uint8) }
}

function isSystemTable(name) {
  return !name ||
    name.startsWith('DateTableTemplate') ||
    name.startsWith('LocalDateTable') ||
    name === '__DS_Store'
}

function cleanDAX(expr) {
  return expr.replace(/\r\n/g, '\n').replace(/^\s+/gm, '').trim()
}

function inferAggFromDAX(expression) {
  if (!expression) return 'sum'
  const upper = expression.toUpperCase()
  if (upper.includes('DISTINCTCOUNT')) return 'distinctcount'
  if (upper.includes('COUNTROWS') || upper.includes('COUNT(') || upper.includes('COUNTA(')) return 'count'
  if (upper.includes('AVERAGE(') || upper.includes('AVERAGEX(')) return 'avg'
  if (upper.includes('MAX(') || upper.includes('MAXX(')) return 'max'
  if (upper.includes('MIN(') || upper.includes('MINX(')) return 'min'
  if (upper.includes('SUM(') || upper.includes('SUMX(')) return 'sum'
  return 'sum'
}

function inferFormatType(formatString) {
  if (!formatString) return 'number'
  const fmt = formatString.toLowerCase()
  if (fmt.includes('$') || fmt === 'currency') return 'currency'
  if (fmt.includes('%')) return 'percent'
  return 'number'
}

function extractFieldBindings(projections, prototypeQuery) {
  const bindings = {}

  // From projections
  Object.entries(projections).forEach(([role, projArr]) => {
    if (!Array.isArray(projArr)) return
    bindings[role] = projArr.map(p => {
      const qr = p?.queryRef || p?.activeProjection?.queryRef || ''
      // queryRef format: "TableName.ColumnName" or "MeasureName"
      const field = qr.includes('.') ? qr.split('.').slice(1).join('.') : qr
      return { field, queryRef: qr, role }
    }).filter(b => b.field)
  })

  // Also try prototypeQuery selects for additional fields
  if (prototypeQuery?.Select) {
    prototypeQuery.Select.forEach(sel => {
      const role = sel.Role || 'values'
      const name = sel.Name || ''
      const field = name.includes('.') ? name.split('.').slice(1).join('.') : name
      if (field && !Object.values(bindings).flat().some(b => b.field === field)) {
        if (!bindings[role]) bindings[role] = []
        bindings[role].push({ field, queryRef: name, role })
      }
    })
  }

  return bindings
}

function extractTitle(objects) {
  try {
    // Power BI stores titles in objects.title[0].properties.text
    const titleProp = objects?.title?.[0]?.properties?.text
    if (titleProp?.expr?.Literal?.Value) {
      return String(titleProp.expr.Literal.Value).replace(/^'|'$/g, '').replace(/^"|"$/g, '')
    }
    // Alternative location
    const altTitle = objects?.general?.[0]?.properties?.title?.expr?.Literal?.Value
    if (altTitle) return String(altTitle).replace(/^'|'$/g, '')
  } catch {}
  return ''
}

function extractShowTitle(objects) {
  try {
    const show = objects?.title?.[0]?.properties?.show?.expr?.Literal?.Value
    return show !== false && show !== 'false'
  } catch {}
  return true
}

function guessTitleFromFields(fieldBindings) {
  const allFields = Object.values(fieldBindings).flat().map(f => f.field).filter(Boolean)
  return allFields.slice(0, 2).join(' × ') || 'Visual'
}

function inferTablesFromReport(reportPages) {
  const tableMap = {}

  function addField(tableName, colName, dataType = 'string') {
    const tName = tableName || 'Data'
    const cName = colName || ''
    if (!cName) return
    if (!tableMap[tName]) tableMap[tName] = new Map()
    if (!tableMap[tName].has(cName)) {
      tableMap[tName].set(cName, { name: cName, dataType, hidden: false, format: null })
    }
  }

  reportPages.forEach(page => {
    page.visuals.forEach(v => {

      // Path 1 — from fieldBindings (queryRef)
      Object.values(v.fieldBindings).flat().forEach(b => {
        const qr     = b.queryRef || b.field || ''
        const dotIdx = qr.indexOf('.')
        if (dotIdx > 0) {
          addField(qr.slice(0, dotIdx), qr.slice(dotIdx + 1))
        } else if (qr) {
          addField('Data', qr)
        }
      })

      // Path 2 — deep scan the raw visual config JSON string for Entity/Property patterns
      try {
        const rawStr = JSON.stringify(v.config || {})

        // Pattern: "Entity":"TableName" ... "Property":"ColumnName"
        const entityMatches = [...rawStr.matchAll(/"Entity"\s*:\s*"([^"]+)"/g)]
        const propMatches   = [...rawStr.matchAll(/"Property"\s*:\s*"([^"]+)"/g)]

        // Pair them up by proximity in the string
        entityMatches.forEach((em, i) => {
          const tableName = em[1]
          const prop      = propMatches[i]
          if (prop) addField(tableName, prop[1])
        })

        // Also catch standalone Name patterns in Select clauses: "Name":"Table.Column"
        const nameMatches = [...rawStr.matchAll(/"Name"\s*:\s*"([^"]+\.[^"]+)"/g)]
        nameMatches.forEach(nm => {
          const parts = nm[1].split('.')
          if (parts.length === 2) addField(parts[0], parts[1])
        })

        // Catch queryRef patterns: "queryRef":"Table.Column"
        const qrMatches = [...rawStr.matchAll(/"queryRef"\s*:\s*"([^"]+)"/g)]
        qrMatches.forEach(qm => {
          const dotIdx = qm[1].indexOf('.')
          if (dotIdx > 0) addField(qm[1].slice(0, dotIdx), qm[1].slice(dotIdx + 1))
        })

      } catch {}
    })
  })

  // If still empty, create a minimal Data table with generic columns
  if (Object.keys(tableMap).length === 0) {
    tableMap['Data'] = new Map([
      ['Nombre',    { name: 'Nombre',    dataType: 'string', hidden: false, format: null }],
      ['Categoría', { name: 'Categoría', dataType: 'string', hidden: false, format: null }],
      ['Valor',     { name: 'Valor',     dataType: 'number', hidden: false, format: null }],
      ['Fecha',     { name: 'Fecha',     dataType: 'date',   hidden: false, format: null }],
    ])
  }

  return Object.entries(tableMap).map(([name, colMap]) => ({
    name,
    hidden:   false,
    columns:  [...colMap.values()],
    measures: [],
  }))
}
