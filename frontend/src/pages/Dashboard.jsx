import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Bell, Plus, ChevronRight, Clock } from 'lucide-react'
import { jobsAPI, clientsAPI, bookingsAPI } from '../utils/api'
import { useAuth } from '../context/AuthContext'
import { formatCurrency, formatDate, formatTime, getStatusColor, getStatusLabel, todayStr } from '../utils/helpers'
import useCountUp from '../hooks/useCountUp'
import { SkeletonList } from '../components/Skeleton'
import EmptyState from '../components/EmptyState'
import AnimatedCard from '../components/AnimatedCard'
import PageTransition from '../components/PageTransition'

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

function LiveCountdown({ date, time }) {
  const [diff, setDiff] = useState(null)

  useEffect(() => {
    if (!date || !time) return
    const update = () => {
      const jobTime = new Date(`${date}T${time}`)
      const now = new Date()
      const ms = jobTime - now
      if (ms <= 0) { setDiff(null); return }
      const h = Math.floor(ms / 3600000)
      const m = Math.floor((ms % 3600000) / 60000)
      setDiff({ h, m })
    }
    update()
    const t = setInterval(update, 60000)
    return () => clearInterval(t)
  }, [date, time])

  if (!diff) return null
  return (
    <span style={{ color: '#F97316', fontSize: '12px', fontWeight: '600' }}>
      <Clock size={11} style={{ verticalAlign: 'middle', marginRight: '3px' }} />
      {diff.h > 0 ? `${diff.h}h ${diff.m}m away` : `${diff.m}m away`}
    </span>
  )
}

export default function Dashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [jobs, setJobs] = useState([])
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [approvingId, setApprovingId] = useState(null)

  const load = useCallback(async () => {
    try {
      const [j, b] = await Promise.all([jobsAPI.getAll(), bookingsAPI.getAll()])
      setJobs(j || [])
      setBookings(b || [])
    } catch { /* ignore */ }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  const today = todayStr()
  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
  const weekAgo = new Date(now - 7 * 86400000).toISOString().split('T')[0]

  const completedJobs = jobs.filter(j => j.status === 'completed')
  const monthlyRevenue = completedJobs.filter(j => j.date >= monthStart).reduce((s, j) => s + (j.price || 0), 0)
  const weekRevenue = completedJobs.filter(j => j.date >= weekAgo).reduce((s, j) => s + (j.price || 0), 0)
  const todayJobs = jobs.filter(j => j.date === today && j.status !== 'cancelled').sort((a, b) => a.time.localeCompare(b.time))
  const upcomingJobs = jobs.filter(j => j.status === 'upcoming' && j.date >= today).sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time))
  const nextJob = upcomingJobs[0] || null

  const animRevenue = useCountUp(monthlyRevenue)

  const approveBooking = async (booking) => {
    setApprovingId(booking.id)
    try {
      await jobsAPI.create({
        service: booking.service,
        price: booking.price,
        status: 'upcoming',
        date: booking.preferredDate,
        time: booking.preferredTime,
        notes: `Booked by ${booking.clientName} — ${booking.clientPhone}`
      })
      await bookingsAPI.update(booking.id, { status: 'approved' })
      setBookings(prev => prev.filter(b => b.id !== booking.id))
    } catch { /* ignore */ }
    finally { setApprovingId(null) }
  }

  const declineBooking = async (id) => {
    try {
      await bookingsAPI.update(id, { status: 'declined' })
      setBookings(prev => prev.filter(b => b.id !== id))
    } catch { /* ignore */ }
  }

  if (loading) return <SkeletonList />

  return (
    <PageTransition>
      <div style={{ padding: '0 0 16px' }}>
        {/* Header */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '52px 20px 16px'
        }}>
          <div>
            <p style={{ color: '#6B7280', fontSize: '13px' }}>{getGreeting()}</p>
            <h1 style={{ fontFamily: 'Sora, sans-serif', fontSize: '22px', fontWeight: '700', color: '#F5F5F5' }}>
              {user?.name?.split(' ')[0]} 👋
            </h1>
          </div>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => navigate('/jobs')}
            style={{
              background: '#111', border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '12px', padding: '10px', cursor: 'pointer', color: '#9CA3AF'
            }}
          >
            <Bell size={20} />
          </motion.button>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', padding: '0 20px 20px' }}>
          {[
            { label: 'Monthly Revenue', value: `$${animRevenue.toLocaleString()}`, color: '#4F8EF7' },
            { label: "Today's Jobs", value: todayJobs.length, color: '#F97316' },
            { label: 'Week Revenue', value: formatCurrency(weekRevenue), color: '#22C55E' },
            { label: 'Avg Job Value', value: completedJobs.length ? formatCurrency(monthlyRevenue / completedJobs.filter(j => j.date >= monthStart).length || 0) : '$0', color: '#A855F7' }
          ].map((stat, i) => (
            <AnimatedCard key={stat.label} delay={i * 0.05} style={{
              background: '#111', borderRadius: '16px', padding: '16px',
              border: '1px solid rgba(255,255,255,0.06)'
            }}>
              <p style={{ color: '#6B7280', fontSize: '11px', fontWeight: '500', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                {stat.label}
              </p>
              <p style={{ color: stat.color, fontSize: '22px', fontWeight: '700', marginTop: '6px', fontFamily: 'Sora, sans-serif' }}>
                {stat.value}
              </p>
            </AnimatedCard>
          ))}
        </div>

        {/* Next Job */}
        {nextJob && (
          <div style={{ padding: '0 20px 20px' }}>
            <p style={{ color: '#6B7280', fontSize: '12px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '10px' }}>
              Next Job
            </p>
            <AnimatedCard
              onClick={() => navigate(`/jobs/${nextJob.id}`)}
              style={{
                background: 'linear-gradient(135deg, #0f1d3a 0%, #111 100%)',
                borderRadius: '18px', padding: '18px',
                border: '1px solid rgba(79,142,247,0.2)', cursor: 'pointer'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <p style={{ color: '#F5F5F5', fontSize: '16px', fontWeight: '600' }}>
                    {nextJob.service || 'Untitled Job'}
                  </p>
                  <p style={{ color: '#9CA3AF', fontSize: '13px', marginTop: '4px' }}>
                    {formatDate(nextJob.date)} · {formatTime(nextJob.time)}
                  </p>
                  <div style={{ marginTop: '8px' }}>
                    <LiveCountdown date={nextJob.date} time={nextJob.time} />
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ color: '#4F8EF7', fontSize: '20px', fontWeight: '700' }}>
                    {formatCurrency(nextJob.price)}
                  </p>
                  <ChevronRight size={16} color="#4B5563" style={{ marginTop: '8px' }} />
                </div>
              </div>
            </AnimatedCard>
          </div>
        )}

        {/* Today's Schedule */}
        <div style={{ padding: '0 20px 20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <p style={{ color: '#6B7280', fontSize: '12px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Today's Schedule
            </p>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/jobs')}
              style={{ background: '#4F8EF7', color: 'white', border: 'none', borderRadius: '10px', padding: '6px 14px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
            >
              <Plus size={14} /> Add Job
            </motion.button>
          </div>

          {todayJobs.length === 0 ? (
            <div style={{ background: '#111', borderRadius: '16px', padding: '24px', border: '1px solid rgba(255,255,255,0.06)', textAlign: 'center' }}>
              <p style={{ color: '#4B5563', fontSize: '14px' }}>No jobs scheduled today</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {todayJobs.map((job, i) => (
                <AnimatedCard
                  key={job.id}
                  delay={i * 0.05}
                  onClick={() => navigate(`/jobs/${job.id}`)}
                  style={{
                    background: '#111', borderRadius: '14px', padding: '14px 16px',
                    border: '1px solid rgba(255,255,255,0.06)', cursor: 'pointer',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                      width: '4px', height: '40px', borderRadius: '2px',
                      background: getStatusColor(job.status), flexShrink: 0
                    }} />
                    <div>
                      <p style={{ color: '#F5F5F5', fontSize: '14px', fontWeight: '600' }}>
                        {job.service || 'Untitled'}
                      </p>
                      <p style={{ color: '#6B7280', fontSize: '12px', marginTop: '2px' }}>
                        {formatTime(job.time)} · {getStatusLabel(job.status)}
                      </p>
                    </div>
                  </div>
                  <p style={{ color: '#F5F5F5', fontSize: '15px', fontWeight: '600' }}>
                    {formatCurrency(job.price)}
                  </p>
                </AnimatedCard>
              ))}
            </div>
          )}
        </div>

        {/* Pending Bookings */}
        {bookings.length > 0 && (
          <div style={{ padding: '0 20px 20px' }}>
            <p style={{ color: '#6B7280', fontSize: '12px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '12px' }}>
              Booking Requests ({bookings.length})
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {bookings.map((b, i) => (
                <AnimatedCard key={b.id} delay={i * 0.05} style={{
                  background: '#111', borderRadius: '14px', padding: '14px',
                  border: '1px solid rgba(249,115,22,0.2)'
                }}>
                  <div style={{ marginBottom: '10px' }}>
                    <p style={{ color: '#F5F5F5', fontWeight: '600', fontSize: '15px' }}>{b.clientName}</p>
                    <p style={{ color: '#9CA3AF', fontSize: '13px', marginTop: '2px' }}>
                      {b.service} · {formatDate(b.preferredDate)} {b.preferredTime}
                    </p>
                    <p style={{ color: '#6B7280', fontSize: '12px', marginTop: '2px' }}>
                      {b.vehicleYear} {b.vehicleMake} {b.vehicleModel} · {b.clientPhone}
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      disabled={approvingId === b.id}
                      onClick={() => approveBooking(b)}
                      style={{
                        flex: 1, background: '#22C55E', color: 'white', border: 'none',
                        borderRadius: '10px', padding: '10px', fontSize: '14px',
                        fontWeight: '600', cursor: 'pointer'
                      }}
                    >
                      {approvingId === b.id ? '...' : '✓ Approve'}
                    </motion.button>
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={() => declineBooking(b.id)}
                      style={{
                        flex: 1, background: 'rgba(239,68,68,0.15)', color: '#EF4444', border: 'none',
                        borderRadius: '10px', padding: '10px', fontSize: '14px',
                        fontWeight: '600', cursor: 'pointer'
                      }}
                    >
                      Decline
                    </motion.button>
                  </div>
                </AnimatedCard>
              ))}
            </div>
          </div>
        )}

        {jobs.length === 0 && bookings.length === 0 && (
          <EmptyState
            icon="🔧"
            title="Ready to roll"
            subtitle="Add your first job to get started"
            actionLabel="Add First Job"
            onAction={() => navigate('/jobs')}
          />
        )}
      </div>
    </PageTransition>
  )
}
