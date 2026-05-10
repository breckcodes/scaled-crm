import { motion, AnimatePresence } from 'framer-motion'

const colors = {
  success: '#22C55E',
  error: '#EF4444',
  info: '#4F8EF7',
  warning: '#F97316'
}

export default function ToastContainer({ toasts, onRemove }) {
  return (
    <div style={{
      position: 'fixed', top: '16px', left: '50%',
      transform: 'translateX(-50%)', zIndex: 9999,
      width: '90%', maxWidth: '400px',
      display: 'flex', flexDirection: 'column', gap: '8px',
      pointerEvents: 'none'
    }}>
      <AnimatePresence>
        {toasts.map(toast => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            onClick={() => onRemove(toast.id)}
            style={{
              background: colors[toast.type] || colors.success,
              color: 'white', padding: '12px 16px',
              borderRadius: '12px', fontSize: '14px',
              fontWeight: '500', cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
              pointerEvents: 'auto'
            }}
          >
            {toast.message}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
