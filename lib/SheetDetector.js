/**
 * SheetDetector — detecta hojas en Excel y Google Sheets
 * Usa import estático de xlsx para evitar problemas con Turbopack
 */
import * as XLSX from 'xlsx'

/**
 * Detecta hojas en un archivo Excel
 * Retorna array de { index, name }
 */
export async function detectExcelSheets(file) {
  const ab = await file.arrayBuffer()
  const wb = XLSX.read(ab, { bookSheets: true })
  return wb.SheetNames.map((name, index) => ({ index, name }))
}

/**
 * Lee filas de una hoja específica de Excel por índice
 */
export async function readExcelSheet(file, sheetIndex = 0) {
  const ab        = await file.arrayBuffer()
  const wb        = XLSX.read(ab)
  const sheetName = wb.SheetNames[sheetIndex]
  if (!sheetName) throw new Error(`Hoja ${sheetIndex} no encontrada`)
  return XLSX.utils.sheet_to_json(wb.Sheets[sheetName])
}

/**
 * Detecta pestañas en Google Sheets via API proxy
 * Retorna array de { gid, name }
 */
export async function detectGoogleSheetTabs(url) {
  try {
    const res  = await fetch(`/api/data?url=${encodeURIComponent(url)}&action=list_sheets`)
    if (!res.ok) return null
    const data = await res.json()
    return data.tabs?.length ? data.tabs : null
  } catch {
    return null
  }
}
