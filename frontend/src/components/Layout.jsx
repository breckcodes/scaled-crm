import BottomNav from './BottomNav'
import OfflineBanner from './OfflineBanner'

export default function Layout({ children }) {
  return (
    <div style={{ minHeight: '100vh', paddingBottom: '80px', background: '#080808' }}>
      <OfflineBanner />
      {children}
      <BottomNav />
    </div>
  )
}
