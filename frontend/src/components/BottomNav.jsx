import { useLocation, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { LayoutDashboard, Calendar, Users, Briefcase, MoreHorizontal } from 'lucide-react'

const tabs = [
  { path: '/dashboard', icon: LayoutDashboard, label: 'Home' },
  { path: '/schedule', icon: Calendar, label: 'Schedule' },
  { path: '/clients', icon: Users, label: 'Clients' },
  { path: '/jobs', icon: Briefcase, label: 'Jobs' },
  { path: '/more', icon: MoreHorizontal, label: 'More' }
]

export default function BottomNav() {
  const location = useLocation()
  const navigate = useNavigate()

  const isActive = (path) => {
    if (path === '/more') {
      return ['/earnings', '/expenses', '/estimates', '/settings'].includes(location.pathname)
    }
    return location.pathname === path
  }

  return (
    <nav style={{
      position: 'fixed', bottom: 0, left: '50%',
      transform: 'translateX(-50%)',
      width: '100%', maxWidth: '480px',
      background: '#111111',
      borderTop: '1px solid rgba(255,255,255,0.06)',
      display: 'flex',
      paddingBottom: 'env(safe-area-inset-bottom)',
      zIndex: 100
    }}>
      {tabs.map(tab => {
        const active = isActive(tab.path)
        return (
          <motion.button
            key={tab.path}
            whileTap={{ scale: 0.9 }}
            onClick={() => {
              if (tab.path === '/more') navigate('/earnings')
              else navigate(tab.path)
            }}
            style={{
              flex: 1, display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              padding: '10px 0', background: 'none',
              border: 'none', cursor: 'pointer',
              color: active ? '#4F8EF7' : '#4B5563', gap: '4px'
            }}
          >
            <tab.icon size={22} strokeWidth={active ? 2.5 : 2} />
            <span style={{ fontSize: '10px', fontWeight: active ? '600' : '400' }}>
              {tab.label}
            </span>
          </motion.button>
        )
      })}
    </nav>
  )
}
