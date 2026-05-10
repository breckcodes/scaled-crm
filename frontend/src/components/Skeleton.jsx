const shimmer = {
  background: 'linear-gradient(90deg, #1a1a1a 25%, #242424 50%, #1a1a1a 75%)',
  backgroundSize: '200% 100%',
  animation: 'shimmer 1.5s infinite',
  borderRadius: '6px'
}

export function SkeletonLine({ width = '100%', height = 14 }) {
  return <div style={{ ...shimmer, width, height, marginBottom: '8px' }} />
}

export function SkeletonCard() {
  return (
    <div style={{
      background: '#111', borderRadius: '16px',
      padding: '16px', border: '1px solid rgba(255,255,255,0.06)'
    }}>
      <SkeletonLine width="60%" height={16} />
      <SkeletonLine width="100%" height={12} />
      <SkeletonLine width="40%" height={12} />
    </div>
  )
}

export function SkeletonList({ count = 4 }) {
  return (
    <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {Array(count).fill(0).map((_, i) => <SkeletonCard key={i} />)}
    </div>
  )
}
