import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, Phone, MapPin, Copy, Trash2 } from 'lucide-react'
import { jobsAPI, clientsAPI } from '../utils/api'
import { formatCurrency, formatDate, formatTime, formatPhone, getInitials, getStatusColor, getStatusLabel, nameToColor, computeJobTotal } from '../utils/helpers'
import { SkeletonList } from '../components/Skeleton'

function elapsed(startedAt) {
  if (!startedAt) return '00:00'
  const secs = Math.floor((Date.now() - new Date(startedAt)) / 1000)
  const h = Math.floor(secs / 3600)
  const m = Math.floor((secs % 3600) / 60)
  const s = secs % 60
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export default function JobDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [job, setJob] = useState(null)
  const [client, setClient] = useState(null)
  const [loading, setLoading] = useState(true)
  const [notes, setNotes] = useState('')
  const [timerDisplay, setTimerDisplay] = useState('00:00')
  const [deleting, setDeleting] = useState(false)
  const timerRef = useRef(null)

  const load = useCallback(async () => {
    try {
      const j = await jobsAPI.getOne(id)
      setJob(j)
      setNotes(j.notes || '')
      if (j.clientId) {
        const c = await clientsAPI.getOne(j.clientId)
        setClient(c)
      }
    } catch { navigate('/jobs') }
    finally { setLoading(false) }
  }, [id, navigate])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    if (!job) return
    if (job.timerRunning && job.startedAt) {
      timerRef.current = setInterval(() => setTimerDisplay(elapsed(job.startedAt)), 1000)
    }
    return () => clearInterval(timerRef.current)
  }, [job])

  const updateJob = async (updates) => {
    const updated = await jobsAPI.update(id, { ...job, ...updates })
    setJob(updated)
    return updated
  }

  const startJob = () => updateJob({ status: 'in_progress', startedAt: new Date().toISOString(), timerRunning: true })
  const finishJob = () => updateJob({ status: 'completed', completedAt: new Date().toISOString(), timerRunning: false })
  const cancelJob = async () => {
    if (!confirm('Cancel this job?')) return
    await updateJob({ status: 'cancelled' })
  }
  const deleteJob = async () => {
    if (!confirm('Delete this job permanently?')) return
    setDeleting(true)
    try { await jobsAPI.remove(id); navigate('/jobs') }
    catch { setDeleting(false) }
  }

  const saveNotes = () => {
    if (notes !== job.notes) updateJob({ notes })
  }

  const copyToClipboard = (text) => { navigator.clipboard.writeText(text) }

  if (loading) return <SkeletonList />
  if (!job) return null

  const total = computeJobTotal(job)
  const balanceDue = total - (job.deposit || 0)
  const vehicle = client?.vehicles?.[0]

  return (
    <div style={{ background: '#080808', minHeight: '100vh', paddingBottom: '32px' }}>
      {/* Header */}
      <div style={{ padding: '52px 20px 16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <motion.button whileTap={{ scale: 0.9 }} onClick={() => navigate('/jobs')}
          style={{ background: '#111', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '10px', cursor: 'pointer', color: '#F5F5F5' }}>
          <ArrowLeft size={18} />
        </motion.button>
        <div style={{ flex: 1 }}>
          <h1 style={{ fontFamily: 'Sora, sans-serif', fontSize: '18px', fontWeight: '700', color: '#F5F5F5' }}>
            {job.service || 'Job Detail'}
          </h1>
        </div>
        <span style={{
          background: `${getStatusColor(job.status)}22`, color: getStatusColor(job.status),
          fontSize: '12px', fontWeight: '600', padding: '5px 12px', borderRadius: '8px'
        }}>
          {getStatusLabel(job.status)}
        </span>
      </div>

      <div style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* Client Card */}
        {client && (
          <div style={{ background: '#111', borderRadius: '16px', padding: '16px', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '44px', height: '44px', borderRadius: '12px',
                background: nameToColor(client.name), display: 'flex',
                alignItems: 'center', justifyContent: 'center',
                color: 'white', fontSize: '16px', fontWeight: '700', flexShrink: 0
              }}>
                {getInitials(client.name)}
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ color: '#F5F5F5', fontSize: '15px', fontWeight: '600' }}>{client.name}</p>
                {client.phone && (
                  <a href={`tel:${client.phone}`} style={{ color: '#4F8EF7', fontSize: '13px', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                    <Phone size={12} /> {formatPhone(client.phone)}
                  </a>
                )}
                {vehicle && (
                  <p style={{ color: '#6B7280', fontSize: '12px', marginTop: '2px' }}>
                    {vehicle.year} {vehicle.make} {vehicle.model}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Job Info */}
        <div style={{ background: '#111', borderRadius: '16px', padding: '16px', border: '1px solid rgba(255,255,255,0.06)' }}>
          <p style={{ color: '#6B7280', fontSize: '12px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '12px' }}>Details</p>
          {[
            { label: 'Service', value: job.service },
            { label: 'Date', value: formatDate(job.date) },
            { label: 'Time', value: formatTime(job.time) },
            { label: 'Duration', value: job.duration ? `${job.duration} min` : null },
            { label: 'Location', value: job.location }
          ].filter(r => r.value).map(row => (
            <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
              <span style={{ color: '#6B7280', fontSize: '14px' }}>{row.label}</span>
              <span style={{ color: '#F5F5F5', fontSize: '14px', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '4px' }}>
                {row.label === 'Location' && <MapPin size={12} />}
                {row.value}
              </span>
            </div>
          ))}
        </div>

        {/* Pricing */}
        <div style={{ background: '#111', borderRadius: '16px', padding: '16px', border: '1px solid rgba(255,255,255,0.06)' }}>
          <p style={{ color: '#6B7280', fontSize: '12px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '12px' }}>Pricing</p>
          {[
            { label: 'Price', value: formatCurrency(job.price) },
            job.discount > 0 && { label: 'Discount', value: job.discountType === '%' ? `-${job.discount}%` : `-${formatCurrency(job.discount)}` },
            { label: 'Total', value: formatCurrency(total), bold: true },
            job.deposit > 0 && { label: 'Deposit Paid', value: formatCurrency(job.deposit) },
            { label: 'Balance Due', value: formatCurrency(balanceDue), color: balanceDue > 0 ? '#F97316' : '#22C55E' },
            job.tip > 0 && { label: 'Tip', value: formatCurrency(job.tip), color: '#22C55E' },
            { label: 'Payment', value: job.paymentMethod }
          ].filter(Boolean).map(row => (
            <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
              <span style={{ color: '#6B7280', fontSize: '14px' }}>{row.label}</span>
              <span style={{ color: row.color || (row.bold ? '#F5F5F5' : '#F5F5F5'), fontSize: row.bold ? '16px' : '14px', fontWeight: row.bold ? '700' : '500' }}>
                {row.value}
              </span>
            </div>
          ))}
        </div>

        {/* Timer */}
        <div style={{ background: '#111', borderRadius: '16px', padding: '20px', border: '1px solid rgba(255,255,255,0.06)', textAlign: 'center' }}>
          {job.status === 'upcoming' && (
            <motion.button whileTap={{ scale: 0.97 }} onClick={startJob} style={{ background: '#F97316', color: 'white', border: 'none', borderRadius: '14px', padding: '14px 32px', fontSize: '15px', fontWeight: '600', cursor: 'pointer', width: '100%' }}>
              ▶ Start Job
            </motion.button>
          )}
          {job.status === 'in_progress' && (
            <>
              <p style={{ color: '#F97316', fontSize: '36px', fontWeight: '700', fontFamily: 'Sora, sans-serif', marginBottom: '16px' }}>
                {timerDisplay}
              </p>
              <motion.button whileTap={{ scale: 0.97 }} onClick={finishJob} style={{ background: '#22C55E', color: 'white', border: 'none', borderRadius: '14px', padding: '14px 32px', fontSize: '15px', fontWeight: '600', cursor: 'pointer', width: '100%' }}>
                ✓ Finish Job
              </motion.button>
            </>
          )}
          {job.status === 'completed' && job.startedAt && job.completedAt && (
            <p style={{ color: '#22C55E', fontSize: '15px', fontWeight: '600' }}>
              ✓ Completed in {elapsed(job.startedAt)}
            </p>
          )}
          {job.status === 'completed' && !job.startedAt && (
            <p style={{ color: '#22C55E', fontSize: '15px', fontWeight: '600' }}>✓ Job Completed</p>
          )}
        </div>

        {/* Quick Actions */}
        <div style={{ background: '#111', borderRadius: '16px', padding: '16px', border: '1px solid rgba(255,255,255,0.06)' }}>
          <p style={{ color: '#6B7280', fontSize: '12px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '12px' }}>Quick Actions</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            {[
              { label: '📱 Text Client', action: () => client?.phone && (window.location.href = `sms:${client.phone}?body=Hey ${client?.name?.split(' ')[0]}, just a reminder about your detailing appointment!`) },
              { label: '🚗 On My Way', action: () => copyToClipboard(`Hi ${client?.name?.split(' ')[0] || ''}, I'm on my way! I'll be there shortly.`) },
              { label: '💸 Request Pay', action: () => window.open('https://venmo.com') },
              { label: '⭐ Thank You', action: () => client?.phone && (window.location.href = `sms:${client.phone}?body=Thanks for the business! Please leave us a review!`) }
            ].map(btn => (
              <motion.button key={btn.label} whileTap={{ scale: 0.95 }} onClick={btn.action} style={{
                background: '#1C1C1C', color: '#F5F5F5', border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: '12px', padding: '12px', fontSize: '13px', fontWeight: '500', cursor: 'pointer'
              }}>
                {btn.label}
              </motion.button>
            ))}
          </div>
        </div>

        {/* Notes */}
        <div style={{ background: '#111', borderRadius: '16px', padding: '16px', border: '1px solid rgba(255,255,255,0.06)' }}>
          <p style={{ color: '#6B7280', fontSize: '12px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '10px' }}>Notes</p>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            onBlur={saveNotes}
            placeholder="Add notes..."
            rows={3}
            style={{ width: '100%', background: '#1C1C1C', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', padding: '12px', color: '#F5F5F5', fontSize: '14px', outline: 'none', resize: 'vertical' }}
          />
        </div>

        {/* Danger Zone */}
        <div style={{ display: 'flex', gap: '10px' }}>
          {job.status !== 'cancelled' && (
            <motion.button whileTap={{ scale: 0.97 }} onClick={cancelJob} style={{ flex: 1, background: 'rgba(239,68,68,0.1)', color: '#EF4444', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '14px', padding: '14px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}>
              Cancel Job
            </motion.button>
          )}
          <motion.button whileTap={{ scale: 0.97 }} onClick={deleteJob} disabled={deleting} style={{ flex: 1, background: 'rgba(239,68,68,0.15)', color: '#EF4444', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '14px', padding: '14px', fontSize: '14px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
            <Trash2 size={14} /> {deleting ? 'Deleting...' : 'Delete'}
          </motion.button>
        </div>
      </div>
    </div>
  )
}
