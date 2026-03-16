'use client'
import { useState } from 'react'
import { formatValue } from '@/lib/DataAdapter'
import styles from './DataTable.module.css'

export default function DataTable({ config, rows }) {
  const [page, setPage]       = useState(0)
  const [sortCol, setSortCol] = useState(config.sortBy || null)
  const [sortDir, setSortDir] = useState('desc')

  const cols    = config.columns?.length ? config.columns : Object.keys(rows[0] || {}).slice(0, 8)
  const pgSize  = config.pageSize || 10

  const sorted = [...(rows || [])].sort((a, b) => {
    if (!sortCol) return 0
    const av = a[sortCol], bv = b[sortCol]
    if (av === bv) return 0
    const n = (v) => typeof v === 'number' ? v : (parseFloat(v) || 0)
    if (typeof av === 'number' || typeof bv === 'number') {
      return sortDir === 'asc' ? n(av) - n(bv) : n(bv) - n(av)
    }
    return sortDir === 'asc'
      ? String(av).localeCompare(String(bv))
      : String(bv).localeCompare(String(av))
  })

  const totalPages = Math.ceil(sorted.length / pgSize)
  const visible    = sorted.slice(page * pgSize, (page + 1) * pgSize)

  function toggleSort(col) {
    if (sortCol === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortCol(col); setSortDir('desc') }
    setPage(0)
  }

  function isNum(col) {
    const sample = rows.find(r => r[col] !== null && r[col] !== undefined)
    return sample ? typeof sample[col] === 'number' : false
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              {cols.map(col => (
                <th
                  key={col}
                  className={`${styles.th} ${sortCol === col ? styles.sorted : ''}`}
                  onClick={() => toggleSort(col)}
                >
                  <span>{col}</span>
                  <span className={styles.sortIcon}>
                    {sortCol === col ? (sortDir === 'asc' ? '↑' : '↓') : '⇅'}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visible.map((row, i) => (
              <tr key={i} className={styles.tr}>
                {cols.map(col => (
                  <td key={col} className={`${styles.td} ${isNum(col) ? styles.num : ''}`}>
                    {row[col] !== null && row[col] !== undefined
                      ? isNum(col) ? formatValue(row[col], 'number') : String(row[col]).slice(0, 60)
                      : <span style={{ color: 'var(--text-tertiary)' }}>—</span>
                    }
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className={styles.pagination}>
          <button
            className="btn btn-ghost"
            style={{ fontSize: 11, padding: '4px 10px' }}
            onClick={() => setPage(p => Math.max(0, p - 1))}
            disabled={page === 0}
          >← Prev</button>
          <span className={styles.pageInfo}>
            Página {page + 1} de {totalPages} · {rows.length.toLocaleString()} filas
          </span>
          <button
            className="btn btn-ghost"
            style={{ fontSize: 11, padding: '4px 10px' }}
            onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
            disabled={page === totalPages - 1}
          >Next →</button>
        </div>
      )}
    </div>
  )
}
