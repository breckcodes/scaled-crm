import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import { jobsAPI, clientsAPI, userAPI } from '../utils/api'

const PAYMENT_METHODS = ['Cash', 'Venmo', 'Zelle', 'Cash App', 'Split', 'Other']

export default function AddJobModal({ onClose, onJobCreated, prefillClientId }) {
  const [clients, setClients] = useState([])
  const [services, setServices] = useState([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    clientId: prefillClientId || '',
    vehicleId: '',
    service: '',
    price: '',
    discount: 0,
    discountType: '$',
    deposit: 0,
    paymentMethod: 'Cash',
    status: 'upcoming',
    date: '',
    time: '',
    duration: 60,
    location: '',
    notes: ''
  })

  useEffect(() => {
    Promise.all([clientsAPI.getAll(), userAPI.getSettings()])
      .then(([c, s]) => {
        setClients(c || [])
        setServices(s?.services || [])
      })
      .catch(() => { /* ignore */ })
  }, [])

  const set = (field) => (e) => setForm(prev => ({ ...prev, [field]: e.target.value }))
  const setVal = (field, val) => setForm(prev => ({ ...prev, [field]: val }))

  const selectedClient = clients.find(c => c.id === Number(form.clientId))

  const onServiceChange = (name) => {
    const svc = services.find(s => s.name === name)
    setForm(prev => ({
      ...prev,
      service: name,
      price: svc ? svc.price : prev.price,
      duration: svc ? svc.duration : prev.duration
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSaving(true)
    try {
      const job = await jobsAPI.create({
        ...form,
        clientId: form.clientId ? Number(form.clientId) : null,
        vehicleId: form.vehicleId ? Number(form.vehicleId) : null,
        price: Number(form.price) || 0,
        discount: Number(form.discount) || 0,
        deposit: Number(form.deposit) || 0,
        duration: Number(form.duration) || 60
      })
      onJobCreated(job)
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const inputStyle = {
    width: '100%', background: '#1C1C1C', border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '12px', padding: '12px 14px', color: '#F5F5F5',
    fontSize: '14px', outline: 'none'
  }
  const labelStyle = { color: '#9CA3AF', fontSize: '12px', display: 'block', marginBottom: '6px' }

  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 300, display: 'flex', alignItems: 'flex-end' }}
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <motion.div
          initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 30, stiffness: 300 }}
          style={{ background: '#111', borderRadius: '24px 24px 0 0', padding: '24px', width: '100%', maxWidth: '480px', margin: '0 auto', maxHeight: '92vh', overflowY: 'auto' }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2 style={{ color: '#F5F5F5', fontSize: '20px', fontWeight: '700' }}>Add Job</h2>
            <motion.button whileTap={{ scale: 0.9 }} onClick={onClose} style={{ background: '#1C1C1C', border: 'none', borderRadius: '10px', padding: '8px', cursor: 'pointer', color: '#9CA3AF' }}>
              <X size={20} />
            </motion.button>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Client */}
            <div>
              <label style={labelStyle}>Client (optional)</label>
              <select value={form.clientId} onChange={set('clientId')} style={inputStyle}>
                <option value="">No client</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>

            {/* Vehicle (if client selected) */}
            {selectedClient?.vehicles?.length > 0 && (
              <div>
                <label style={labelStyle}>Vehicle</label>
                <select value={form.vehicleId} onChange={set('vehicleId')} style={inputStyle}>
                  <option value="">Select vehicle</option>
                  {selectedClient.vehicles.map(v => (
                    <option key={v.id} value={v.id}>{v.year} {v.make} {v.model}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Service */}
            <div>
              <label style={labelStyle}>Service</label>
              {services.length > 0 ? (
                <select value={form.service} onChange={e => onServiceChange(e.target.value)} style={inputStyle}>
                  <option value="">Select service</option>
                  {services.map(s => <option key={s.id} value={s.name}>{s.name} — ${s.price}</option>)}
                  <option value="__custom">Custom...</option>
                </select>
              ) : (
                <input value={form.service} onChange={set('service')} placeholder="e.g. Full Detail" style={inputStyle} />
              )}
              {(form.service === '__custom' || (services.length > 0 && !services.find(s => s.name === form.service) && form.service !== '')) && (
                <input value={form.service === '__custom' ? '' : form.service} onChange={set('service')} placeholder="Custom service name" style={{ ...inputStyle, marginTop: '8px' }} />
              )}
            </div>

            {/* Date + Time */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div>
                <label style={labelStyle}>Date</label>
                <input type="date" value={form.date} onChange={set('date')} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Time</label>
                <input type="time" value={form.time} onChange={set('time')} style={inputStyle} />
              </div>
            </div>

            {/* Price + Duration */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div>
                <label style={labelStyle}>Price ($)</label>
                <input type="number" value={form.price} onChange={set('price')} placeholder="0" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Duration (min)</label>
                <input type="number" value={form.duration} onChange={set('duration')} style={inputStyle} />
              </div>
            </div>

            {/* Deposit */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div>
                <label style={labelStyle}>Deposit ($)</label>
                <input type="number" value={form.deposit} onChange={set('deposit')} placeholder="0" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Payment Method</label>
                <select value={form.paymentMethod} onChange={set('paymentMethod')} style={inputStyle}>
                  {PAYMENT_METHODS.map(m => <option key={m} value={m.toLowerCase()}>{m}</option>)}
                </select>
              </div>
            </div>

            {/* Status */}
            <div>
              <label style={labelStyle}>Status</label>
              <select value={form.status} onChange={set('status')} style={inputStyle}>
                <option value="upcoming">Upcoming</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
              </select>
            </div>

            {/* Location */}
            <div>
              <label style={labelStyle}>Location (optional)</label>
              <input value={form.location} onChange={set('location')} placeholder="Address or area" style={inputStyle} />
            </div>

            {/* Notes */}
            <div>
              <label style={labelStyle}>Notes (optional)</label>
              <textarea value={form.notes} onChange={set('notes')} placeholder="Any notes..." rows={2} style={{ ...inputStyle, resize: 'none' }} />
            </div>

            {error && (
              <div style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '10px', padding: '12px', color: '#EF4444', fontSize: '14px' }}>
                {error}
              </div>
            )}

            <motion.button type="submit" disabled={saving} whileTap={{ scale: 0.97 }} style={{ background: saving ? '#1C2D4F' : '#4F8EF7', color: 'white', border: 'none', borderRadius: '14px', padding: '16px', fontSize: '16px', fontWeight: '600', cursor: saving ? 'not-allowed' : 'pointer' }}>
              {saving ? 'Scheduling...' : 'Schedule Job ✓'}
            </motion.button>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
