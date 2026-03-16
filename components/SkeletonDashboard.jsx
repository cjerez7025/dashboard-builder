'use client'
import styles from './SkeletonDashboard.module.css'

function SkeletonCard({ col, height = 140 }) {
  return (
    <div className={styles.card} style={{ gridColumn: `span ${col}`, height }}>
      <div className={styles.header}>
        <span className={`skeleton ${styles.titleBar}`} />
        <span className={`skeleton ${styles.badge}`} />
      </div>
      <div className={`skeleton ${styles.body}`} />
    </div>
  )
}

export default function SkeletonDashboard() {
  return (
    <div className={styles.wrap}>
      <div className={styles.titleRow}>
        <span className={`skeleton ${styles.dashTitle}`} />
        <span className={`skeleton ${styles.dashSub}`} />
      </div>
      <div className={styles.grid}>
        {/* KPI row */}
        <SkeletonCard col={3} height={108} />
        <SkeletonCard col={3} height={108} />
        <SkeletonCard col={3} height={108} />
        <SkeletonCard col={3} height={108} />
        {/* Charts row */}
        <SkeletonCard col={6} height={260} />
        <SkeletonCard col={6} height={260} />
        {/* Wide chart */}
        <SkeletonCard col={12} height={220} />
      </div>
    </div>
  )
}
