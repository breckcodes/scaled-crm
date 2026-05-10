import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { jobsAPI } from '../utils/api'
import { formatCurrency, formatTime, getStatusColor, getStatusLabel } from '../utils/helpers'
import { SkeletonList } from '../components/Skeleton'
import AnimatedCard from '../components/AnimatedCard'
import PageTransition from '../components/PageTransition'

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function addDays(date, n) {
  const d = new Date(date)
  d.setDate(d.getDate() + n)
  return d
}

function dateStr(d) { return d.toISOString().split('T')[0] }

export default function Schedule() {
  const navigate = useNavigate()
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [weekStart, setWeekStart] = useState(() => {
    const today = new Date()
    const d = new Date(today)
    d.setDate(d.getDate() - d.getDay())
    return d
  })
  const [selectedDate, setSelectedDate] = useState(dateStr(new Date()))

  const load = useCallback(async () => {
    try {
      const data = await jobsAPI.getAll()
      setJobs(data || [])
    } catch { /* ignore */ }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  const week = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))
  const todayStr = dateStr(new Date())

  const jobsOnDay = (dateStr) => jobs.filter(j => j.date === dateStr && j.status !== 'cancelled')
  const selectedJobs = jobsOnDay(selectedDate).sort((a, b) => a.time.localeCompare(b.time))

  const weekRevenue = week.reduce((sum, d) => {
    return sum + jobsOnDay(dateStr(d)).filter(j => j.status === 'completed').reduce((s, j) => s + (j.price || 0), 0)
  }, 0)
  const weekJobCount = week.reduce((sum, d) => sum + jobsOnDay(dateStr(d)).length, 0)
  const weekCompleted = week.reduce((sum, d) => sum + jobsOnDay(dateStr(d)).filter(j => j.status === 'completed').length, 0)

  if (loading) return <SkeletonList />

  return (
    <PageTransition>
      <div style={{ paddingBottom: '16px' }}>
        <div style={{ padding: '52px 20px 16px' }}>
          <h1 style={{ fontFamily: 'Sora, sans-serif', fontSize: '24px', fontWeight: '700', color: '#F5F5F5' }}>Schedule</h1>
        </div>

        {/* Week nav */}
        <div style={{ padding: '0 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
          <motion.button whileTap={{ scale: 0.9 }} onClick={() => setWeekStart(prev => addDays(prev, -7))} style={{ background: '#111', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', padding: '8px', cursor: 'pointer', color: '#9CA3AF' }}>
            <ChevronLeft size={18} />
          </motion.button>
          <p style={{ color: '#9CA3AF', fontSize: '13px', fontWeight: '500' }}>
            {week[0].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} –{' '}
            {week[6].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </p>
          <motion.button whileTap={{ scale: 0.9 }} onClick={() => setWeekStart(prev => addDays(prev, 7))} style={{ background: '#111', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', padding: '8px', cursor: 'pointer', color: '#9CA3AF' }}>
            <ChevronRight size={18} />
          </motion.button>
        </div>

        {/* Day strip */}
        <div style={{ display: 'flex', gap: '6px', padding: '0 20px 16px', overflowX: 'auto' }}>
          {week.map((d, i) => {
            const ds = dateStr(d)
            const isToday = ds === todayStr
            const isSelected = ds === selectedDate
            const dayJobs = jobsOnDay(ds)
            return (
              <motion.div key={i} whileTap={{ scale: 0.95 }} onClick={() => setSelectedDate(ds)} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', padding: '10px 6px', borderRadius: '14px', cursor: 'pointer', background: isSelected ? '#4F8EF7' : isToday ? 'rgba(79,142,247,0.15)' : '#111', border: isSelected ? 'none' : '1px solid rgba(255,255,255,0.06)', minWidth: '42px' }}>
                <p style={{ color: isSelected ? 'rgba(255,255,255,0.7)' : '#6B7280', fontSize: '10px', fontWeight: '500' }}>
                  {DAYS[d.getDay()]}
                </p>
                <p style={{ color: isSelected ? 'white' : isToday ? '#4F8EF7' : '#F5F5F5', fontSize: '16px', fontWeight: '700' }}>
                  {d.getDate()}
                </p>
                <div style={{ display: 'flex', gap: '2px', flexWrap: 'wrap', justifyContent: 'center' }}>
                  {dayJobs.slice(0, 3).map((j, idx) => (
                    <div key={idx} style={{ width: '5px', height: '5px', borderRadius: '50%', background: isSelected ? 'rgba(255,255,255,0.6)' : getStatusColor(j.status) }} />
                  ))}
                </div>
              </motion.div>
            )
          })}
        </div>

        {/* Week stats */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', padding: '0 20px 20px' }}>
          {[
            { label: 'Jobs', value: weekJobCount },
            { label: 'Completed', value: weekCompleted },
            { label: 'Revenue', value: formatCurrency(weekRevenue) }
          ].map(s => (
            <div key={s.label} style={{ background: '#111', borderRadius: '12px', padding: '12px', border: '1px solid rgba(255,255,255,0.06)', textAlign: 'center' }}>
              <p style={{ color: '#F5F5F5', fontSize: '18px', fontWeight: '700' }}>{s.value}</p>
              <p style={{ color: '#6B7280', fontSize: '11px', marginTop: '2px' }}>{s.label}</p>
            </div>
          ))}
        </div>

        {/* Day jobs */}
        <div style={{ padding: '0 20px' }}>
          <p style={{ color: '#6B7280', fontSize: '12px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '12px' }}>
            {selectedDate === todayStr ? "Today's Jobs" : new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
            {selectedJobs.length > 0 && ` (${selectedJobs.length})`}
          </p>
          {selectedJobs.length === 0 ? (
            <div style={{ background: '#111', borderRadius: '14px', padding: '24px', border: '1px solid rgba(255,255,255,0.06)', textAlign: 'center' }}>
              <p style={{ color: '#4B5563', fontSize: '14px' }}>No jobs this day</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {selectedJobs.map((job, i) => (
                <AnimatedCard key={job.id} delay={i * 0.05} onClick={() => navigate(`/jobs/${job.id}`)} style={{ background: '#111', borderRadius: '14px', padding: '14px 16px', border: '1px solid rgba(255,255,255,0.06)', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <div style={{ width: '4px', height: '40px', borderRadius: '2px', background: getStatusColor(job.status), flexShrink: 0 }} />
                    <div>
                      <p style={{ color: '#F5F5F5', fontSize: '14px', fontWeight: '600' }}>{job.service || 'Untitled'}</p>
                      <p style={{ color: '#6B7280', fontSize: '12px', marginTop: '2px' }}>{formatTime(job.time)} · {getStatusLabel(job.status)}</p>
                    </div>
                  </div>
                  <p style={{ color: '#F5F5F5', fontSize: '15px', fontWeight: '600' }}>{formatCurrency(job.price)}</p>
                </AnimatedCard>
              ))}
            </div>
          )}
        </div>
      </div>
    </PageTransition>
  )
}
