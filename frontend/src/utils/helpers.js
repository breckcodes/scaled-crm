export const formatCurrency = (n) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n || 0)

export const formatDate = (dateStr) => {
  if (!dateStr) return ''
  const date = new Date(dateStr + 'T00:00:00')
  const today = new Date()
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  if (date.toDateString() === today.toDateString()) return 'Today'
  if (date.toDateString() === tomorrow.toDateString()) return 'Tomorrow'
  return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
}

export const formatTime = (timeStr) => {
  if (!timeStr) return ''
  const [h, m] = timeStr.split(':')
  const hour = parseInt(h)
  const ampm = hour >= 12 ? 'PM' : 'AM'
  const hour12 = hour % 12 || 12
  return `${hour12}:${m} ${ampm}`
}

export const formatPhone = (phone) => {
  const cleaned = (phone || '').replace(/\D/g, '')
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`
  }
  return phone || ''
}

export const getInitials = (name) => {
  if (!name) return '?'
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
}

export const getStatusColor = (status) => {
  const colors = {
    upcoming: '#4F8EF7',
    in_progress: '#F97316',
    completed: '#22C55E',
    cancelled: '#EF4444',
    pending: '#9CA3AF'
  }
  return colors[status] || '#9CA3AF'
}

export const getStatusLabel = (status) => {
  const labels = {
    upcoming: 'Upcoming',
    in_progress: 'In Progress',
    completed: 'Completed',
    cancelled: 'Cancelled',
    pending: 'Pending'
  }
  return labels[status] || status
}

export const nameToColor = (name) => {
  if (!name) return '#4F8EF7'
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  const colors = ['#4F8EF7', '#F97316', '#22C55E', '#A855F7', '#EC4899', '#14B8A6', '#F59E0B']
  return colors[Math.abs(hash) % colors.length]
}

export const todayStr = () => new Date().toISOString().split('T')[0]

export const computeJobTotal = (job) => {
  const price = Number(job.price) || 0
  const discount = Number(job.discount) || 0
  const discountType = job.discountType || '$'
  const discounted = discountType === '%' ? price * (discount / 100) : discount
  return Math.max(0, price - discounted)
}
