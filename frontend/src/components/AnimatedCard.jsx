import { motion } from 'framer-motion'

export default function AnimatedCard({ children, delay = 0, onClick, style, className }) {
  return (
    <motion.div
      className={className}
      style={style}
      onClick={onClick}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      whileTap={onClick ? { scale: 0.98 } : {}}
      transition={{ duration: 0.25, delay, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  )
}
