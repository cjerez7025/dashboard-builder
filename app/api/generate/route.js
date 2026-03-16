/**
 * POST /api/generate
 * Powered by Groq — multi-model fallback + robust JSON extraction
 */

import { validateConfig, normalizeConfig } from '@/lib/schemas'

export const runtime = 'nodejs'

const SYSTEM_PROMPT = `You are a data visualization API. You output ONLY valid JSON, nothing else.

CRITICAL: Your entire response must be a single JSON object. No text before or after. No markdown. No backticks. No explanation. No comments. Start your response with { and end with }.

Return this exact structure:
{"title":"string","layout":"grid","columns":12,"visuals":[{"id":"string","type":"kpi|bar_h|bar_v|pie|donut|line|table|bar3d|column3d|pie3d|donut3d|scatter3d|drilldown","title":"string","colSpan":3,"rowSpan":1,"config":{}}]}

CONFIG BY TYPE:
kpi: {"metric":"col","aggregation":"sum|avg|count|max|min|distinctcount","format":"number|currency|percent","accent":"#hex"}
bar_h/bar_v: {"groupBy":"col","metric":"col","aggregation":"sum|avg|count","limit":10,"sortBy":"value","sortDir":"desc"}
bar3d/column3d: {"groupBy":"col","metric":"col","aggregation":"sum|avg|count","limit":10,"sortBy":"value","sortDir":"desc"}
pie3d/donut3d: {"groupBy":"col","metric":"col","aggregation":"count|sum","limit":8}
scatter3d: {"xAxis":"num_col","yAxis":"num_col","zAxis":"num_col","groupBy":"cat_col"}
pie/donut: {"groupBy":"col","metric":"col","aggregation":"count|sum","limit":8}
line: {"xAxis":"date_col","yAxis":"num_col","aggregation":"sum|avg|count"}
table: {"columns":["col1","col2"],"pageSize":10,"sortBy":"col1"}

LAYOUT: KPI=colSpan 3, charts=colSpan 6, table=colSpan 12. Each row sums to 12.
3D CHARTS: Use bar3d/column3d instead of bar when user says "3D", "tridimensional", "en 3D". Use pie3d/donut3d for 3D pie. Use scatter3d for bubble/scatter 3D.
DRILLDOWN: Use type "drilldown" when user says "drill down", "detalle", "desglose", "profundizar", "multinivel", "click para ver", or wants hierarchical detail.
Config schema:
{"groupBy":"col_nivel1","drillBy":"col_nivel2","drillBy3":"col_nivel3_OPTIONAL","metric":"col","aggregation":"sum|count|avg|distinctcount","chartType":"column|bar|pie","limit":10}
- groupBy  = first/top level column (e.g. "Clinica")
- drillBy  = second level column (e.g. "Supervisor") — always include when user gives 2+ levels
- drillBy3 = third level column (e.g. "Ejecutivo") — include when user gives 3 levels
- 3-level example: "ventas por clinica, supervisor y ejecutivo" → groupBy:"Clinica", drillBy:"Supervisor", drillBy3:"Ejecutivo"
- Use colSpan:12 rowSpan:2 for drilldown charts
COLORS: #6366F1 #10B981 #F59E0B #EF4444 #8B5CF6 #06B6D4 #F97316
Generate 4-6 visuals. Use exact column names from the schema provided.`

/**
 * Robust JSON extractor — handles models that add text around the JSON
 */
function extractJSON(text) {
  if (!text) return null

  // Step 1: strip markdown fences
  let s = text
    .replace(/^```json\s*/im, '')
    .replace(/^```\s*/im, '')
    .replace(/\s*```$/m, '')
    .trim()

  // Step 2: try direct parse
  try { return JSON.parse(s) } catch {}

  // Step 3: find first { ... last } (handles text before/after)
  const first = s.indexOf('{')
  const last  = s.lastIndexOf('}')
  if (first !== -1 && last !== -1 && last > first) {
    try { return JSON.parse(s.slice(first, last + 1)) } catch {}
  }

  // Step 4: try to find JSON with regex — greedy match of outermost object
  const match = s.match(/\{[\s\S]*\}/)
  if (match) {
    try { return JSON.parse(match[0]) } catch {}
  }

  // Step 5: try fixing common model mistakes
  const fixed = s
    .replace(/,\s*}/g, '}')      // trailing commas in objects
    .replace(/,\s*]/g, ']')      // trailing commas in arrays
    .replace(/(['"])?([a-zA-Z_][a-zA-Z0-9_]*)(['"])?\s*:/g, '"$2":')  // unquoted keys
    .replace(/:\s*'([^']*)'/g, ': "$1"')   // single-quoted strings
    .trim()
  const firstF = fixed.indexOf('{')
  const lastF  = fixed.lastIndexOf('}')
  if (firstF !== -1 && lastF !== -1) {
    try { return JSON.parse(fixed.slice(firstF, lastF + 1)) } catch {}
  }

  return null
}

export async function POST(request) {
  try {
    const body = await request.json()
    const { prompt, dataSummary, history = [] } = body

    if (!prompt)      return Response.json({ error: 'Falta el prompt' }, { status: 400 })
    if (!dataSummary) return Response.json({ error: 'Carga datos primero' }, { status: 400 })

    const apiKey = process.env.GROQ_API_KEY
    if (!apiKey) return Response.json({ error: 'GROQ_API_KEY no configurada en .env.local' }, { status: 500 })

    const userMessage =
`SCHEMA:
- Rows: ${dataSummary.rowCount}
- Numeric columns: ${dataSummary.numericColumns?.join(', ') || 'none'}
- Categorical columns: ${dataSummary.categoricalColumns?.join(', ') || 'none'}
- Date columns: ${dataSummary.dateColumns?.join(', ') || 'none'}
- All columns: ${JSON.stringify((dataSummary.columns || []).slice(0, 20).map(c => ({ name: c.name, type: c.type })))}

REQUEST: ${prompt}

Respond with JSON only. Start with { and end with }.`

    const messages = [{ role: 'system', content: SYSTEM_PROMPT }]
    history.forEach(msg => {
      if (msg.role === 'user') messages.push({ role: 'user', content: msg.content })
      else if (msg.role === 'assistant' && msg.config) messages.push({ role: 'assistant', content: JSON.stringify(msg.config) })
    })
    messages.push({ role: 'user', content: userMessage })

    // Models list — active as of March 2026
    const MODELS = [
      'llama-3.3-70b-versatile',
      'qwen/qwen3-32b',
      'llama3-70b-8192',
      'llama-3.1-8b-instant',
      'llama3-8b-8192',
    ]

    let config    = null
    let lastError = null

    for (const model of MODELS) {
      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type':  'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages,
          temperature:  0.1,
          max_tokens:   4096,
          // Force JSON output on models that support it
          response_format: { type: 'json_object' },
        }),
      })

      // Handle rate limit — try next model
      if (res.status === 429) {
        const e = await res.json().catch(() => ({}))
        lastError = e?.error?.message || `Rate limit en ${model}`
        console.log(`[generate] 429 on ${model}, trying next...`)
        continue
      }

      // Handle unsupported response_format — retry without it
      if (res.status === 400) {
        const e = await res.json().catch(() => ({}))
        // If it's about response_format not supported, retry without it
        if (e?.error?.message?.includes('response_format')) {
          const res2 = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Content-Type':  'application/json',
              'Authorization': `Bearer ${apiKey}`,
            },
            body: JSON.stringify({ model, messages, temperature: 0.1, max_tokens: 4096 }),
          })
          if (!res2.ok) { lastError = `HTTP ${res2.status} on ${model}`; continue }
          const d2 = await res2.json()
          const raw2 = d2.choices?.[0]?.message?.content
          const parsed2 = extractJSON(raw2)
          if (parsed2) { config = parsed2; break }
          lastError = `JSON inválido en ${model}`
          continue
        }
        lastError = e?.error?.message || `HTTP 400 en ${model}`
        continue
      }

      if (!res.ok) {
        const e = await res.json().catch(() => ({}))
        lastError = e?.error?.message || `HTTP ${res.status} en ${model}`
        continue
      }

      const data = await res.json()
      const raw  = data.choices?.[0]?.message?.content
      const parsed = extractJSON(raw)

      if (parsed) {
        console.log(`[generate] Success with ${model}`)
        config = parsed
        break
      }

      lastError = `Respuesta no válida del modelo ${model}`
      console.warn(`[generate] Could not extract JSON from ${model}:`, raw?.slice(0, 200))
    }

    if (!config) {
      const isRateLimit = lastError?.toLowerCase().includes('rate limit') ||
                          lastError?.toLowerCase().includes('tpd') ||
                          lastError?.toLowerCase().includes('limit')
      return Response.json({
        error: isRateLimit
          ? 'Límite diario de Groq alcanzado. Espera unos minutos e intenta de nuevo.'
          : `No se pudo generar el dashboard: ${lastError || 'respuesta inválida'}`,
      }, { status: isRateLimit ? 429 : 422 })
    }

    const { valid, errors } = validateConfig(config)
    if (!valid) {
      // Try to normalize anyway — validateConfig is strict but normalizeConfig is lenient
      const normalized = normalizeConfig(config)
      if (normalized.visuals?.length > 0) {
        return Response.json({ config: normalized })
      }
      return Response.json({
        error: `Config inválida: ${errors.join(', ')}`,
      }, { status: 422 })
    }

    return Response.json({ config: normalizeConfig(config) })

  } catch (err) {
    console.error('[generate] Unexpected error:', err)
    return Response.json({ error: err.message || 'Error interno del servidor' }, { status: 500 })
  }
}
