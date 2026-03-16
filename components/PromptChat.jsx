'use client'
import { useState, useRef, useEffect, useCallback } from 'react'
import styles from './PromptChat.module.css'

const SUGGESTIONS = [
  'KPIs principales',
  'Barras por categoría',
  'Distribución en donut',
  'Tendencia temporal',
  'Tabla completa',
  'Top 10 ranking',
]

// Convert file to base64
function fileToBase64(file) {
  return new Promise((res, rej) => {
    const reader = new FileReader()
    reader.onload  = () => res(reader.result)
    reader.onerror = rej
    reader.readAsDataURL(file)
  })
}

export default function PromptChat({
  onGenerate, generating, disabled,
  history, suggestedPrompt, onClearSuggested,
}) {
  const [input,    setInput]    = useState('')
  const [images,   setImages]   = useState([])   // [{ name, base64, preview }]
  const [dragOver, setDragOver] = useState(false)
  const textareaRef = useRef()
  const fileRef     = useRef()
  const bottomRef   = useRef()

  // ── Auto-resize textarea ───────────────────────────────────────────────
  useEffect(() => {
    const ta = textareaRef.current
    if (!ta) return
    ta.style.height = 'auto'
    ta.style.height = Math.min(ta.scrollHeight, 220) + 'px'
  }, [input])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [history, generating])

  // ── Handle image files ─────────────────────────────────────────────────
  const addImages = useCallback(async (files) => {
    const valid = [...files].filter(f => f.type.startsWith('image/'))
    if (!valid.length) return
    const newImgs = await Promise.all(valid.map(async f => ({
      name:    f.name,
      base64:  await fileToBase64(f),
      preview: URL.createObjectURL(f),
    })))
    setImages(prev => [...prev, ...newImgs].slice(0, 4)) // max 4 images
  }, [])

  function removeImage(idx) {
    setImages(prev => prev.filter((_, i) => i !== idx))
  }

  // ── Paste image from clipboard ─────────────────────────────────────────
  function handlePaste(e) {
    const items = [...(e.clipboardData?.items || [])]
    const imgItems = items.filter(it => it.type.startsWith('image/'))
    if (imgItems.length) {
      e.preventDefault()
      addImages(imgItems.map(it => it.getAsFile()))
    }
  }

  // ── Drag & drop ────────────────────────────────────────────────────────
  function handleDrop(e) {
    e.preventDefault()
    setDragOver(false)
    addImages(e.dataTransfer.files)
  }

  // ── Submit ─────────────────────────────────────────────────────────────
  function handleSubmit(e) {
    e?.preventDefault()
    const val = input.trim()
    if ((!val && !images.length) || generating || disabled) return
    onGenerate(val, images.length ? images : undefined)
    setInput('')
    setImages([])
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  const hasContent = input.trim() || images.length > 0

  return (
    <div className={styles.wrap}>
      <div className={styles.header}>
        <h3 className={styles.title}>Describe tu dashboard</h3>
        {disabled && <span className={styles.disabledHint}>Carga datos primero</span>}
      </div>

      {/* Chat history */}
      {history.length > 0 && (
        <div className={styles.history}>
          {history.map((msg, i) => (
            <div key={i} className={`${styles.msg} ${styles[msg.role]}`}>
              {msg.role === 'user' ? (
                <div className={styles.userBubble}>
                  {msg.images?.length > 0 && (
                    <div className={styles.historyImages}>
                      {msg.images.map((img, j) => (
                        <img key={j} src={img.preview || img.base64} alt={img.name}
                          className={styles.historyThumb} />
                      ))}
                    </div>
                  )}
                  {msg.content}
                </div>
              ) : (
                <div className={styles.aiBubble}>
                  {msg.status === 'ok' ? (
                    <><span className={styles.checkIcon}>✓</span><span>{msg.content}</span></>
                  ) : (
                    <><span className={styles.errorIcon}>✕</span>
                    <span style={{ color:'var(--danger)' }}>{msg.content}</span></>
                  )}
                </div>
              )}
            </div>
          ))}
          {generating && (
            <div className={`${styles.msg} ${styles.assistant}`}>
              <div className={styles.aiBubble}>
                <span className="spinner" />
                <span style={{ color:'var(--text-secondary)' }}>Generando dashboard…</span>
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
            <button key={s} className={styles.chip}
              onClick={() => !generating && !disabled && onGenerate(s)}
              disabled={generating}>
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Input box */}
      <div
        className={`${styles.inputBox} ${dragOver ? styles.dragOver : ''} ${disabled ? styles.inputDisabled : ''}`}
        onDragOver={e => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
      >
        {/* Image previews */}
        {images.length > 0 && (
          <div className={styles.imagePreviews}>
            {images.map((img, i) => (
              <div key={i} className={styles.imagePreview}>
                <img src={img.preview} alt={img.name} className={styles.previewImg} />
                <button className={styles.removeImg} onClick={() => removeImage(i)} title="Eliminar">✕</button>
                <span className={styles.imgName}>{img.name.slice(0, 16)}</span>
              </div>
            ))}
            {images.length < 4 && (
              <button className={styles.addMoreImg} onClick={() => fileRef.current?.click()} title="Agregar más">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
              </button>
            )}
          </div>
        )}

        {/* Drag overlay */}
        {dragOver && (
          <div className={styles.dropOverlay}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/>
              <polyline points="21,15 16,10 5,21"/>
            </svg>
            <span>Suelta la imagen aquí</span>
          </div>
        )}

        {/* Textarea */}
        <textarea
          ref={textareaRef}
          className={styles.textarea}
          placeholder={
            disabled ? 'Carga datos primero…'
            : images.length ? 'Describe qué quieres ver con esta imagen…'
            : 'Describe el dashboard… ej: KPIs arriba, barras por categoría\n(Shift+Enter para nueva línea · arrastra imágenes aquí)'
          }
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          disabled={disabled || generating}
          rows={2}
        />

        {/* Bottom bar */}
        <div className={styles.inputBottom}>
          <div className={styles.inputActions}>
            {/* Image button */}
            <button
              type="button"
              className={styles.imgBtn}
              onClick={() => fileRef.current?.click()}
              disabled={disabled || generating || images.length >= 4}
              title="Adjuntar imagen"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="18" height="18" rx="2"/>
                <circle cx="8.5" cy="8.5" r="1.5"/>
                <polyline points="21,15 16,10 5,21"/>
              </svg>
              {images.length > 0 ? `${images.length}/4` : 'Imagen'}
            </button>
            <input ref={fileRef} type="file" accept="image/*" multiple style={{ display:'none' }}
              onChange={e => addImages(e.target.files)} />

            <span className={styles.hintText}>
              {images.length > 0 ? 'Ctrl+V para pegar imagen' : 'Arrastra · Pega · o adjunta imágenes'}
            </span>
          </div>

          {/* Send button */}
          <button
            className={`btn btn-primary ${styles.sendBtn}`}
            onClick={handleSubmit}
            disabled={!hasContent || generating || disabled}
          >
            {generating ? (
              <span className="spinner" style={{ borderTopColor:'#fff' }} />
            ) : (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="22" y1="2" x2="11" y2="13"/>
                <polygon points="22,2 15,22 11,13 2,9"/>
              </svg>
            )}
            <span>Enviar</span>
          </button>
        </div>
      </div>
    </div>
  )
}
