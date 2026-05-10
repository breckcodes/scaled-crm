import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, Phone, Mail, Trash2 } from 'lucide-react'
import { clientsAPI, jobsAPI } from '../utils/api'
import { getInitials, nameToColor, formatCurrency, formatDate, formatTime, formatPhone, getStatusColor, getStatusLabel, todayStr } from '../utils/helpers'
import { SkeletonList } from '../components/Skeleton'

export default function ClientDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [client, setClient] = useState(null)
  const [clientJobs, setClientJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [notes, setNotes] = useState('')

  const load = useCallback(async () => {
    try {
      const numId = Number(id)
      const [c, allJobs] = await Promise.all([clientsAPI.getOne(id), jobsAPI.getAll()])
      setClient(c)
      setNotes(c.notes || '')
      setClientJobs(allJobs.filter(j => j.clientId === numId))
    } catch { navigate('/clients') }
    finally { setLoading(false) }
  }, [id, navigate])

  useEffect(() => { load() }, [load])

  const saveNotes = async () => {
    if (notes !== client.notes) {
      await clientsAPI.update(id, { ...client, notes })
      setClient(prev => ({ ...prev, notes }))
    }
  }

  const deleteClient = async () => {
    if (!confirm('Delete this client and all their data?')) return
    await clientsAPI.remove(id)
    navigate('/clients')
  }

  if (loading) return <SkeletonList />
  if (!client) return null

  const completedJobs = clientJobs.filter(j => j.status === 'completed')
  const lifetimeSpend = completedJobs.reduce((s, j) => s + (j.price || 0), 0)
  const avgValue = completedJobs.length ? lifetimeSpend / completedJobs.length : 0
  const lastJob = completedJobs.sort((a, b) => b.date.localeCompare(a.date))[0]
  const daysSince = lastJob ? Math.floor((new Date(todayStr()) - new Date(lastJob.date + 'T00:00:00')) / 86400000) : null

  return (
    <div style={{ background: '#080808', minHeight: '100vh', paddingBottom: '32px' }}>
      <div style={{ padding: '52px 20px 16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <motion.button whileTap={{ scale: 0.9 }} onClick={() => navigate('/clients')} style={{ background: '#111', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '10px', cursor: 'pointer', color: '#F5F5F5' }}>
          <ArrowLeft size={18} />
        </motion.button>
        <h1 style={{ fontFamily: 'Sora, sans-serif', fontSize: '18px', fontWeight: '700', color: '#F5F5F5' }}>
          {client.name}
        </h1>
      </div>

      <div style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* Avatar + contact */}
        <div style={{ background: '#111', borderRadius: '18px', padding: '20px', border: '1px solid rgba(255,255,255,0.06)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '72px', height: '72px', borderRadius: '20px', background: nameToColor(client.name), display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '26px', fontWeight: '700' }}>
            {getInitials(client.name)}
          </div>
          <h2 style={{ color: '#F5F5F5', fontSize: '20px', fontWeight: '700' }}>{client.name}</h2>
          <div style={{ display: 'flex', gap: '10px' }}>
            {client.phone && (
              <a href={`tel:${client.phone}`} style={{ background: '#1C1C1C', color: '#4F8EF7', border: 'none', borderRadius: '10px', padding: '10px 16px', fontSize: '13px', fontWeight: '500', cursor: 'pointer', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Phone size={14} /> {formatPhone(client.phone)}
              </a>
            )}
            {client.email && (
              <a href={`mailto:${client.email}`} style={{ background: '#1C1C1C', color: '#9CA3AF', border: 'none', borderRadius: '10px', padding: '10px 16px', fontSize: '13px', fontWeight: '500', cursor: 'pointer', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Mail size={14} /> Email
              </a>
            )}
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          {[
            { label: 'Lifetime Spend', value: formatCurrency(lifetimeSpend), color: '#22C55E' },
            { label: 'Total Visits', value: completedJobs.length, color: '#4F8EF7' },
            { label: 'Avg Job Value', value: formatCurrency(avgValue), color: '#F97316' },
            { label: daysSince !== null ? `${daysSince} days ago` : 'No visits yet', value: lastJob ? formatDate(lastJob.date) : '—', color: '#9CA3AF' }
          ].map((s, i) => (
            <div key={i} style={{ background: '#111', borderRadius: '14px', padding: '14px', border: '1px solid rgba(255,255,255,0.06)' }}>
              <p style={{ color: '#6B7280', fontSize: '11px', fontWeight: '500', textTransform: 'uppercase', letterSpacing: '0.4px' }}>{s.label}</p>
              <p style={{ color: s.color, fontSize: '18px', fontWeight: '700', marginTop: '4px', fontFamily: 'Sora, sans-serif' }}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Vehicles */}
        {client.vehicles?.length > 0 && (
          <div style={{ background: '#111', borderRadius: '16px', padding: '16px', border: '1px solid rgba(255,255,255,0.06)' }}>
            <p style={{ color: '#6B7280', fontSize: '12px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '10px' }}>Vehicles</p>
            {client.vehicles.map(v => (
              <div key={v.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 0' }}>
                <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: v.color || '#4F8EF7', flexShrink: 0 }} />
                <span style={{ color: '#F5F5F5', fontSize: '14px' }}>{v.year} {v.make} {v.model}</span>
                <span style={{ color: '#4B5563', fontSize: '12px' }}>· {v.vehicleType}</span>
              </div>
            ))}
          </div>
        )}

        {/* Notes */}
        <div style={{ background: '#111', borderRadius: '16px', padding: '16px', border: '1px solid rgba(255,255,255,0.06)' }}>
          <p style={{ color: '#6B7280', fontSize: '12px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '10px' }}>Notes</p>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            onBlur={saveNotes}
            placeholder="Add notes about this client..."
            rows={3}
            style={{ width: '100%', background: '#1C1C1C', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', padding: '12px', color: '#F5F5F5', fontSize: '14px', outline: 'none', resize: 'vertical' }}
          />
        </div>

        {/* Job history */}
        {clientJobs.length > 0 && (
          <div style={{ background: '#111', borderRadius: '16px', padding: '16px', border: '1px solid rgba(255,255,255,0.06)' }}>
            <p style={{ color: '#6B7280', fontSize: '12px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '10px' }}>
              Job History ({clientJobs.length})
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {clientJobs.sort((a, b) => b.date.localeCompare(a.date)).map(job => (
                <motion.div key={job.id} whileTap={{ scale: 0.98 }} onClick={() => navigate(`/jobs/${job.id}`)} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px', background: '#1C1C1C', borderRadius: '10px', cursor: 'pointer' }}>
                  <div>
                    <p style={{ color: '#F5F5F5', fontSize: '13px', fontWeight: '500' }}>{job.service}</p>
                    <p style={{ color: '#6B7280', fontSize: '11px', marginTop: '2px' }}>{formatDate(job.date)} · {formatTime(job.time)}</p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ color: '#F5F5F5', fontSize: '13px', fontWeight: '600' }}>{formatCurrency(job.price)}</p>
                    <span style={{ fontSize: '10px', color: getStatusColor(job.status), fontWeight: '600' }}>{getStatusLabel(job.status)}</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Delete */}
        <motion.button whileTap={{ scale: 0.97 }} onClick={deleteClient} style={{ background: 'rgba(239,68,68,0.1)', color: '#EF4444', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '14px', padding: '14px', fontSize: '14px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
          <Trash2 size={14} /> Delete Client
        </motion.button>
      </div>
    </div>
  )
}
