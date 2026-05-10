import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Plus } from 'lucide-react'
import { jobsAPI } from '../utils/api'
import { formatCurrency, formatDate, formatTime, getStatusColor, getStatusLabel } from '../utils/helpers'
import { SkeletonList } from '../components/Skeleton'
import EmptyState from '../components/EmptyState'
import AnimatedCard from '../components/AnimatedCard'
import PageTransition from '../components/PageTransition'
import AddJobModal from './AddJobModal'

const FILTERS = ['all', 'upcoming', 'in_progress', 'completed', 'cancelled']
const FILTER_LABELS = { all: 'All', upcoming: 'Upcoming', in_progress: 'In Progress', completed: 'Completed', cancelled: 'Cancelled' }

export default function Jobs() {
  const navigate = useNavigate()
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [showAdd, setShowAdd] = useState(false)

  const load = useCallback(async () => {
    try {
      const data = await jobsAPI.getAll()
      setJobs(data || [])
    } catch { /* ignore */ }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  const filtered = filter === 'all' ? jobs : jobs.filter(j => j.status === filter)

  if (loading) return <SkeletonList />

  return (
    <PageTransition>
      <div style={{ paddingBottom: '16px' }}>
        {/* Header */}
        <div style={{ padding: '52px 20px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h1 style={{ fontFamily: 'Sora, sans-serif', fontSize: '24px', fontWeight: '700', color: '#F5F5F5' }}>Jobs</h1>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => setShowAdd(true)}
            style={{
              background: '#4F8EF7', color: 'white', border: 'none',
              borderRadius: '12px', padding: '10px 16px', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: '6px',
              fontSize: '14px', fontWeight: '600'
            }}
          >
            <Plus size={16} /> Add Job
          </motion.button>
        </div>

        {/* Filter tabs */}
        <div style={{ display: 'flex', gap: '8px', padding: '0 20px 16px', overflowX: 'auto' }}>
          {FILTERS.map(f => (
            <motion.button
              key={f}
              whileTap={{ scale: 0.95 }}
              onClick={() => setFilter(f)}
              style={{
                background: filter === f ? '#4F8EF7' : '#111',
                color: filter === f ? 'white' : '#6B7280',
                border: `1px solid ${filter === f ? '#4F8EF7' : 'rgba(255,255,255,0.06)'}`,
                borderRadius: '20px', padding: '7px 16px',
                fontSize: '13px', fontWeight: '500', cursor: 'pointer', whiteSpace: 'nowrap'
              }}
            >
              {FILTER_LABELS[f]}
            </motion.button>
          ))}
        </div>

        {/* Job list */}
        {filtered.length === 0 ? (
          <EmptyState
            icon="🔧"
            title="No jobs yet"
            subtitle="Tap + to add your first job"
            actionLabel="Add Job"
            onAction={() => setShowAdd(true)}
          />
        ) : (
          <div style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {filtered.map((job, i) => (
              <AnimatedCard
                key={job.id}
                delay={i * 0.04}
                onClick={() => navigate(`/jobs/${job.id}`)}
                style={{
                  background: '#111', borderRadius: '16px', padding: '16px',
                  border: '1px solid rgba(255,255,255,0.06)', cursor: 'pointer'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                      <span style={{
                        background: `${getStatusColor(job.status)}22`,
                        color: getStatusColor(job.status),
                        fontSize: '11px', fontWeight: '600', padding: '3px 8px',
                        borderRadius: '6px', textTransform: 'uppercase', letterSpacing: '0.4px'
                      }}>
                        {getStatusLabel(job.status)}
                      </span>
                    </div>
                    <p style={{ color: '#F5F5F5', fontSize: '15px', fontWeight: '600' }}>
                      {job.service || 'Untitled Job'}
                    </p>
                    <p style={{ color: '#6B7280', fontSize: '12px', marginTop: '4px' }}>
                      {formatDate(job.date)} · {formatTime(job.time)}
                    </p>
                    {job.location && (
                      <p style={{ color: '#4B5563', fontSize: '12px', marginTop: '2px' }}>
                        📍 {job.location}
                      </p>
                    )}
                  </div>
                  <p style={{ color: '#F5F5F5', fontSize: '18px', fontWeight: '700', flexShrink: 0, marginLeft: '12px' }}>
                    {formatCurrency(job.price)}
                  </p>
                </div>
              </AnimatedCard>
            ))}
          </div>
        )}

        {showAdd && (
          <AddJobModal
            onClose={() => setShowAdd(false)}
            onJobCreated={(job) => { setJobs(prev => [job, ...prev]); setShowAdd(false) }}
          />
        )}
      </div>
    </PageTransition>
  )
}
