'use client'
import styles from './DataPreview.module.css'

const TYPE_BADGE = {
  number: 'badge-number',
  string: 'badge-text',
  date:   'badge-date',
}

const TYPE_LABEL = {
  number: '#',
  string: 'Aa',
  date:   '📅',
}

export default function DataPreview({ dataset, onReset }) {
  if (!dataset) return null
  const { columns, rows, summary } = dataset
  const previewRows = rows.slice(0, 5)

  return (
    <div className={styles.wrap}>
      <div className={styles.header}>
        <div>
          <h3 className={styles.title}>Data Preview</h3>
          <p className={styles.meta}>
            {summary.rowCount.toLocaleString()} rows · {summary.columnCount} columns
          </p>
        </div>
        <button className="btn btn-ghost" onClick={onReset} style={{ fontSize: 11 }}>
          Change source
        </button>
      </div>

      {/* Column type badges */}
      <div className={styles.badges}>
        {columns.slice(0, 8).map(col => (
          <span key={col.name} className={`badge ${TYPE_BADGE[col.type] || 'badge-default'}`}>
            <span style={{ opacity: 0.7 }}>{TYPE_LABEL[col.type] || '?'}</span>
            {col.name}
          </span>
        ))}
        {columns.length > 8 && (
          <span className="badge badge-default">+{columns.length - 8} more</span>
        )}
      </div>

      {/* Preview table */}
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              {columns.slice(0, 6).map(col => (
                <th key={col.name} className={styles.th}>
                  <span className={styles.colName}>{col.name}</span>
                  <span className={`badge ${TYPE_BADGE[col.type] || 'badge-default'}`} style={{ fontSize: 9, padding: '1px 4px' }}>
                    {col.type}
                  </span>
                </th>
              ))}
              {columns.length > 6 && <th className={styles.th}>…</th>}
            </tr>
          </thead>
          <tbody>
            {previewRows.map((row, i) => (
              <tr key={i} className={styles.tr}>
                {columns.slice(0, 6).map(col => (
                  <td key={col.name} className={styles.td}>
                    <span className={col.type === 'number' ? styles.num : ''}>
                      {row[col.name] !== null && row[col.name] !== undefined
                        ? String(row[col.name]).slice(0, 30)
                        : <span style={{ color: 'var(--text-tertiary)' }}>—</span>
                      }
                    </span>
                  </td>
                ))}
                {columns.length > 6 && <td className={styles.td} style={{ color: 'var(--text-tertiary)' }}>…</td>}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {rows.length > 5 && (
        <p className={styles.more}>Showing 5 of {rows.length.toLocaleString()} rows</p>
      )}
    </div>
  )
}
