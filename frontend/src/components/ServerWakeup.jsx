import { useState, useEffect } from 'react'

export default function ServerWakeup() {
  const [show, setShow] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setShow(true), 4000)
    const hide = setTimeout(() => setShow(false), 35000)
    return () => { clearTimeout(timer); clearTimeout(hide) }
  }, [])

  if (!show) return null
  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0,
      background: '#F97316', color: 'white',
      textAlign: 'center', padding: '8px',
      fontSize: '13px', fontWeight: '500', zIndex: 9998
    }}>
      ⏳ Server waking up — takes ~30s on first load
    </div>
  )
}
