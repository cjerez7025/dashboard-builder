/**
 * AIEngine — client-side module to call /api/generate
 */

/**
 * Generate a dashboard config from a natural language prompt
 * @param {string} prompt — user's natural language description
 * @param {object} dataSummary — normalized data summary from DataAdapter
 * @param {Array}  history — previous turns for refinement context
 * @returns {{ config }} on success, throws on error
 */
export async function generateDashboard(prompt, dataSummary, history = []) {
  const res = await fetch('/api/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt, dataSummary, history }),
  })

  const data = await res.json()

  if (!res.ok) {
    throw new Error(data.error || `HTTP ${res.status}`)
  }

  return data
}
