'use client'
import styles from './Header.module.css'

export default function Header({ onNewSession, hasData, hasConfig, editMode, onToggleEdit, onSessions }) {
  return (
    <header className={styles.header}>
      {/* Brand */}
      <div className={styles.left}>
        <div className={styles.logoMark}>
          <svg width="20" height="20" viewBox="0 0 22 22" fill="none">
            <rect x="1"  y="1"  width="8" height="8" rx="2.5" fill="var(--accent)" opacity="1"/>
            <rect x="13" y="1"  width="8" height="8" rx="2.5" fill="var(--accent)" opacity="0.45"/>
            <rect x="1"  y="13" width="8" height="8" rx="2.5" fill="var(--accent)" opacity="0.45"/>
            <rect x="13" y="13" width="8" height="8" rx="2.5" fill="var(--accent)" opacity="1"/>
          </svg>
        </div>
        <span className={styles.brand}>Dashboard Builder</span>
        <span className={styles.pill}>AI</span>
      </div>

      {/* Center status */}
      <div className={styles.center}>
        {hasData && !hasConfig && (
          <span className={styles.statusHint}>Describe el dashboard que quieres en el panel izquierdo →</span>
        )}
        {hasConfig && onToggleEdit && (
          <button
            className={`btn ${editMode ? 'btn-primary' : 'btn-secondary'}`}
            style={{ fontSize:12, gap:5, background: editMode ? '#F59E0B' : undefined, borderColor: editMode ? '#F59E0B' : undefined }}
            onClick={onToggleEdit}
          >
            {editMode ? (
              <>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20,6 9,17 4,12"/></svg>
                Listo
              </>
            ) : (
              <>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                Editar
              </>
            )}
          </button>
        )}
        {hasConfig && (
          <div className={styles.statusReady}>
            <span className={styles.dot} />
            <span>Dashboard activo</span>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className={styles.right}>
        <a
          href="https://github.com"
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-ghost"
          style={{ fontSize: 12, padding: '6px 10px' }}
          title="View source"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 21.795 24 17.295 24 12c0-6.63-5.37-12-12-12"/>
          </svg>
        </a>
        <button
            className="btn btn-secondary"
            onClick={onSessions}
            style={{ fontSize:12 }}
            title="Guardar / Abrir sesión"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
              <polyline points="17,21 17,13 7,13 7,21"/>
              <polyline points="7,3 7,8 15,8"/>
            </svg>
            Sesiones
          </button>
        <button
          className="btn btn-ghost"
          onClick={onNewSession}
          style={{ fontSize: 12 }}
          title="Nueva sesión"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/>
            <path d="M21 3v5h-5"/>
          </svg>
          Nueva sesión
        </button>
      </div>
    </header>
  )
}
