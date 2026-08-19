import React, { useEffect, useRef } from 'react'

/**
 * Modal — animated overlay modal
 * Props: isOpen, onClose, title, children, size ('sm'|'md'|'lg'|'xl')
 */
export default function Modal({ isOpen, onClose, title, children, size = 'md' }) {
  const overlayRef = useRef()

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  useEffect(() => {
    const handleKey = (e) => { if (e.key === 'Escape') onClose() }
    if (isOpen) window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [isOpen, onClose])

  if (!isOpen) return null

  const sizeClass = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-2xl',
  }[size] || 'max-w-md'

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4"
      style={{ paddingTop: 'calc(env(safe-area-inset-top) + 12px)', paddingBottom: 'calc(env(safe-area-inset-bottom) + 12px)' }}
      onClick={(e) => { if (e.target === overlayRef.current) onClose() }}
    >
      <div className="absolute inset-0 bg-black/45 backdrop-blur-sm animate-fadeIn" />

      <div className={`relative mx-auto w-full ${sizeClass} max-h-[85vh] flex max-w-[min(92vw,28rem)] flex-col overflow-hidden rounded-[22px] border border-white/10 bg-[#111014]/95 shadow-[0_30px_80px_rgba(0,0,0,0.58)] animate-slideUp`}>
        {title && (
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-3 sm:px-6 sm:py-4">
            <h2 className="text-base font-semibold text-white">{title}</h2>
            <button
              type="button"
              onClick={onClose}
              className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 transition hover:bg-white/5 hover:text-white"
            >
              ✕
            </button>
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {children}
        </div>
      </div>
    </div>
  )
}

export function ConfirmModal({ isOpen, title = 'Confirm', message, confirmText = 'Delete', cancelText = 'Cancel', onConfirm, onClose }) {
  if (!isOpen) return null

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
      <div className="space-y-5">
        <p className="text-sm leading-6 text-[#A9A3B3]">{message}</p>

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-xl border border-white/10 bg-[#0D0C10] px-3 py-2.5 text-sm font-medium text-white transition hover:bg-white/5"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="flex-1 rounded-xl bg-gradient-to-r from-[#7C3AED] to-[#D946EF] px-3 py-2.5 text-sm font-semibold text-white shadow-[0_12px_24px_rgba(124,58,237,0.38)] transition hover:brightness-110"
          >
            {confirmText}
          </button>
        </div>
      </div>
    </Modal>
  )
}
