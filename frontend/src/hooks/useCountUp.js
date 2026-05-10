import { useState, useEffect } from 'react'

export default function useCountUp(target, duration = 1000) {
  const [count, setCount] = useState(0)

  useEffect(() => {
    if (!target || target === 0) { setCount(0); return }
    let current = 0
    const increment = target / 60
    const timer = setInterval(() => {
      current += increment
      if (current >= target) {
        setCount(target)
        clearInterval(timer)
      } else {
        setCount(Math.floor(current))
      }
    }, duration / 60)
    return () => clearInterval(timer)
  }, [target, duration])

  return count
}
