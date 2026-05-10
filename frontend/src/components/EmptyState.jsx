import { motion } from 'framer-motion'

export default function EmptyState({ icon, title, subtitle, actionLabel, onAction }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', padding: '64px 24px',
        textAlign: 'center', gap: '12px'
      }}
    >
      <div style={{ fontSize: '52px' }}>{icon}</div>
      <h3 style={{ color: '#F5F5F5', fontSize: '18px', fontWeight: '600', margin: 0 }}>
        {title}
      </h3>
      <p style={{ color: '#6B7280', fontSize: '14px', margin: 0, maxWidth: '220px', lineHeight: '1.6' }}>
        {subtitle}
      </p>
      {actionLabel && (
        <motion.button
          whileTap={{ scale: 0.96 }}
          onClick={onAction}
          style={{
            marginTop: '8px', background: '#4F8EF7', color: 'white',
            border: 'none', borderRadius: '12px', padding: '12px 28px',
            fontSize: '15px', fontWeight: '600', cursor: 'pointer'
          }}
        >
          {actionLabel}
        </motion.button>
      )}
    </motion.div>
  )
}
