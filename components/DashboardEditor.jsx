'use client'
import { useState, useRef, useCallback } from 'react'
import styles from './DashboardEditor.module.css'

const CHART_TYPES = [
  { id: 'kpi',       label: 'KPI',         icon: '🎯' },
  { id: 'bar_v',     label: 'Columnas',    icon: '📊' },
  { id: 'bar_h',     label: 'Barras',      icon: '📉' },
  { id: 'line',      label: 'Línea',       icon: '📈' },
  { id: 'pie',       label: 'Pie',         icon: '🥧' },
  { id: 'donut',     label: 'Donut',       icon: '⭕' },
  { id: 'column3d',  label: 'Col 3D',      icon: '🗼' },
  { id: 'bar3d',     label: 'Bar 3D',      icon: '🧱' },
  { id: 'pie3d',     label: 'Pie 3D',      icon: '🎪' },
  { id: 'drilldown', label: 'Drilldown',   icon: '🔍' },
  { id: 'table',     label: 'Tabla',       icon: '📋' },
]

const COL_SIZES = [3, 4, 6, 8, 12]

export default function DashboardEditor({ config, onUpdate }) {
  const [editingId,   setEditingId]   = useState(null)   // which card is focused
  const [titleEdit,   setTitleEdit]   = useState('')      // inline title edit
  const [dragIdx,     setDragIdx]     = useState(null)    // drag source index
  const [dragOverIdx, setDragOverIdx] = useState(null)    // drag target index
  const titleRef = useRef()

  if (!config?.visuals) return null
  const visuals = config.visuals

  // ── Update helpers ────────────────────────────────────────────────────
  function updateVisual(idx, patch) {
    const next = visuals.map((v, i) => i === idx ? { ...v, ...patch } : v)
    onUpdate({ ...config, visuals: next })
  }

  function deleteVisual(idx) {
    const next = visuals.filter((_, i) => i !== idx)
    onUpdate({ ...config, visuals: next })
    if (editingId === visuals[idx]?.id) setEditingId(null)
  }

  function moveVisual(idx, dir) {
    const next = [...visuals]
    const target = idx + dir
    if (target < 0 || target >= next.length) return
    ;[next[idx], next[target]] = [next[target], next[idx]]
    onUpdate({ ...config, visuals: next })
  }

  function changeColSpan(idx, delta) {
    const current = visuals[idx].colSpan || 6
    const sizes   = COL_SIZES
    const i       = sizes.indexOf(current)
    const ni      = Math.max(0, Math.min(sizes.length-1, i + delta))
    updateVisual(idx, { colSpan: sizes[ni] })
  }

  function commitTitle(idx) {
    if (titleEdit.trim()) updateVisual(idx, { title: titleEdit.trim() })
    setEditingId(null)
  }

  // ── Drag & Drop ───────────────────────────────────────────────────────
  function onDragStart(idx) { setDragIdx(idx) }
  function onDragOver(e, idx) { e.preventDefault(); setDragOverIdx(idx) }
  function onDrop(idx) {
    if (dragIdx === null || dragIdx === idx) { setDragIdx(null); setDragOverIdx(null); return }
    const next = [...visuals]
    const [item] = next.splice(dragIdx, 1)
    next.splice(idx, 0, item)
    onUpdate({ ...config, visuals: next })
    setDragIdx(null)
    setDragOverIdx(null)
  }
  function onDragEnd() { setDragIdx(null); setDragOverIdx(null) }

  return (
    <div className={styles.overlay}>
      {visuals.map((visual, idx) => {
        const col     = Math.max(1, Math.min(12, Number(visual.colSpan) || 6))
        const isFirst = idx === 0
        const isLast  = idx === visuals.length - 1
        const isDragging  = dragIdx === idx
        const isDragOver  = dragOverIdx === idx && dragIdx !== idx

        return (
          <div
            key={visual.id || idx}
            className={`${styles.cardOverlay} ${isDragging ? styles.dragging : ''} ${isDragOver ? styles.dragOver : ''}`}
            style={{ gridColumn: `span ${col}`, gridRow: `span ${visual.rowSpan || 1}` }}
            draggable
            onDragStart={() => onDragStart(idx)}
            onDragOver={e => onDragOver(e, idx)}
            onDrop={() => onDrop(idx)}
            onDragEnd={onDragEnd}
          >
            {/* Top toolbar */}
            <div className={styles.toolbar}>
              {/* Move arrows */}
              <div className={styles.toolGroup}>
                <button className={styles.toolBtn} onClick={() => moveVisual(idx, -1)} disabled={isFirst} title="Mover arriba">↑</button>
                <button className={styles.toolBtn} onClick={() => moveVisual(idx,  1)} disabled={isLast}  title="Mover abajo">↓</button>
              </div>

              {/* Drag handle */}
              <div className={styles.dragHandle} title="Arrastrar para mover">⠿</div>

              {/* Title editor */}
              <div className={styles.titleWrap}>
                {editingId === visual.id ? (
                  <input
                    ref={titleRef}
                    className={styles.titleInput}
                    value={titleEdit}
                    onChange={e => setTitleEdit(e.target.value)}
                    onBlur={() => commitTitle(idx)}
                    onKeyDown={e => { if (e.key==='Enter') commitTitle(idx); if (e.key==='Escape') setEditingId(null) }}
                    autoFocus
                  />
                ) : (
                  <span
                    className={styles.titleDisplay}
                    onClick={() => { setEditingId(visual.id); setTitleEdit(visual.title) }}
                    title="Click para editar título"
                  >
                    ✏️ {visual.title}
                  </span>
                )}
              </div>

              {/* ColSpan size */}
              <div className={styles.toolGroup}>
                <button className={styles.toolBtn}
                  onClick={() => changeColSpan(idx, -1)}
                  disabled={COL_SIZES.indexOf(col) === 0}
                  title="Achicar">◀</button>
                <span className={styles.colLabel}>{col}/12</span>
                <button className={styles.toolBtn}
                  onClick={() => changeColSpan(idx, 1)}
                  disabled={COL_SIZES.indexOf(col) === COL_SIZES.length-1}
                  title="Agrandar">▶</button>
              </div>

              {/* Delete */}
              <button
                className={`${styles.toolBtn} ${styles.deleteBtn}`}
                onClick={() => deleteVisual(idx)}
                title="Eliminar visual"
              >✕</button>
            </div>

            {/* Chart type selector */}
            <div className={styles.typeBar}>
              {CHART_TYPES.map(ct => (
                <button
                  key={ct.id}
                  className={`${styles.typeBtn} ${visual.type === ct.id ? styles.typeBtnActive : ''}`}
                  onClick={() => updateVisual(idx, { type: ct.id })}
                  title={ct.label}
                >
                  <span>{ct.icon}</span>
                  <span>{ct.label}</span>
                </button>
              ))}
            </div>

            {/* Drag hint */}
            <div className={styles.dragHint}>⠿ arrastra para reposicionar</div>
          </div>
        )
      })}
    </div>
  )
}
