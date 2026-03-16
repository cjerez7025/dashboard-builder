'use client'
import { useState, useRef, useEffect } from 'react'
import styles from './PromptChat.module.css'

const SUGGESTIONS = [
  'KPIs principales',
  'Barras por categoría',
  'Distribución en donut',
  'Tendencia temporal',
  'Tabla completa',
  'Top 10 ranking',
]

export default function PromptChat({ onGenerate, generating, disabled, history, suggestedPrompt, onClearSuggested }) {
  const [input, setInput] = useState('')
  const textareaRef = useRef()
  const bottomRef   = useRef()

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [history, generating])

  function handleSubmit(e) {
    e.preventDefault()
    const val = input.trim()
    if (!val || generating || disabled) return
    onGenerate(val)
    setInput('')
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  function useSuggestion(s) {
    if (generating || disabled) return
    onGenerate(s)
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.header}>
        <h3 className={styles.title}>Describe tu dashboard</h3>
        {disabled && (
          <span className={styles.disabledHint}>Carga datos primero</span>
        )}
      </div>

      {/* Chat history */}
      {history.length > 0 && (
        <div className={styles.history}>
          {history.map((msg, i) => (
            <div key={i} className={`${styles.msg} ${styles[msg.role]}`}>
              {msg.role === 'user' ? (
                <div className={styles.userBubble}>{msg.content}</div>
              ) : (
                <div className={styles.aiBubble}>
                  {msg.status === 'ok' ? (
                    <>
                      <span className={styles.checkIcon}>✓</span>
                      <span>{msg.content}</span>
                    </>
                  ) : (
                    <>
                      <span className={styles.errorIcon}>✕</span>
                      <span style={{ color: 'var(--danger)' }}>{msg.content}</span>
                    </>
                  )}
                </div>
              )}
            </div>
          ))}

          {generating && (
            <div className={`${styles.msg} ${styles.assistant}`}>
              <div className={styles.aiBubble}>
                <span className="spinner" />
                <span style={{ color: 'var(--text-secondary)' }}>Generando dashboard…</span>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      )}

      {/* Suggestions */}
      {history.length === 0 && !disabled && !suggestedPrompt && (
        <div className={styles.suggestions}>
          {SUGGESTIONS.map(s => (
            <button
              key={s}
              className={styles.chip}
              onClick={() => useSuggestion(s)}
              disabled={generating}
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <form className={styles.inputRow} onSubmit={handleSubmit}>
        <textarea
          ref={textareaRef}
          className={`input ${styles.textarea}`}
          placeholder={
            disabled
              ? 'Carga datos primero…'
              : 'Describe el dashboard que quieres… ej: KPIs arriba, barras por categoría y un pie chart'
          }
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled || generating}
          rows={2}
        />
        <button
          type="submit"
          className={`btn btn-primary ${styles.sendBtn}`}
          disabled={!input.trim() || generating || disabled}
        >
          {generating ? (
            <span className="spinner" style={{ borderTopColor: '#fff' }} />
          ) : (
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="22" y1="2" x2="11" y2="13"/>
              <polygon points="22,2 15,22 11,13 2,9"/>
            </svg>
          )}
        </button>
      </form>

      <p className={styles.hint}>Enter para enviar · Shift+Enter para nueva línea</p>
    </div>
  )
}
