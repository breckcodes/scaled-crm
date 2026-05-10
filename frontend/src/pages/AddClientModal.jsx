import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Plus, Trash2 } from 'lucide-react'
import { clientsAPI } from '../utils/api'

const VEHICLE_TYPES = ['Sedan / Coupe', 'SUV / Crossover', 'Truck', 'Van / Minivan', 'Sports Car', 'Convertible', 'Other']
const SOURCES = ['Instagram', 'Referral', 'Google', 'Facebook', 'TikTok', 'Word of Mouth', 'Other']
const COLORS = ['#4F8EF7', '#22C55E', '#F97316', '#EF4444', '#A855F7', '#14B8A6', '#F59E0B', '#EC4899', '#000000', '#FFFFFF', '#C0C0C0', '#1C1C1C']

export default function AddClientModal({ onClose, onClientCreated }) {
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    firstName: '', lastName: '', phone: '', email: '', source: '', birthday: ''
  })
  const [vehicles, setVehicles] = useState([])

  const set = (field) => (e) => setForm(prev => ({ ...prev, [field]: e.target.value }))

  const formatPhoneInput = (e) => {
    let val = e.target.value.replace(/\D/g, '').slice(0, 10)
    setForm(prev => ({ ...prev, phone: val }))
  }

  const displayPhone = (val) => {
    const v = (val || '').replace(/\D/g, '')
    if (v.length <= 3) return v
    if (v.length <= 6) return `(${v.slice(0, 3)}) ${v.slice(3)}`
    return `(${v.slice(0, 3)}) ${v.slice(3, 6)}-${v.slice(6)}`
  }

  const addVehicle = () => setVehicles(prev => [...prev, { year: '', make: '', model: '', vehicleType: 'Sedan / Coupe', color: '#4F8EF7' }])
  const removeVehicle = (i) => setVehicles(prev => prev.filter((_, idx) => idx !== i))
  const updateVehicle = (i, field, val) => setVehicles(prev => prev.map((v, idx) => idx === i ? { ...v, [field]: val } : v))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    const name = [form.firstName, form.lastName].filter(Boolean).join(' ')
    if (!name.trim()) { setError('Name is required'); return }
    setSaving(true)
    try {
      const client = await clientsAPI.create({
        name,
        phone: form.phone,
        email: form.email,
        source: form.source,
        birthday: form.birthday,
        vehicles
      })
      onClientCreated(client)
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const inputStyle = {
    width: '100%', background: '#1C1C1C', border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '12px', padding: '12px 14px', color: '#F5F5F5', fontSize: '14px', outline: 'none'
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
            <h2 style={{ color: '#F5F5F5', fontSize: '20px', fontWeight: '700' }}>Add Client</h2>
            <motion.button whileTap={{ scale: 0.9 }} onClick={onClose} style={{ background: '#1C1C1C', border: 'none', borderRadius: '10px', padding: '8px', cursor: 'pointer', color: '#9CA3AF' }}>
              <X size={20} />
            </motion.button>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Name */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div>
                <label style={labelStyle}>First Name</label>
                <input value={form.firstName} onChange={set('firstName')} placeholder="John" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Last Name</label>
                <input value={form.lastName} onChange={set('lastName')} placeholder="Smith" style={inputStyle} />
              </div>
            </div>

            {/* Phone */}
            <div>
              <label style={labelStyle}>Phone</label>
              <input
                type="tel"
                value={displayPhone(form.phone)}
                onChange={formatPhoneInput}
                placeholder="(214) 555-0000"
                style={inputStyle}
              />
            </div>

            {/* Email */}
            <div>
              <label style={labelStyle}>Email (optional)</label>
              <input type="email" value={form.email} onChange={set('email')} placeholder="client@email.com" style={inputStyle} />
            </div>

            {/* Source */}
            <div>
              <label style={labelStyle}>How did they find you?</label>
              <select value={form.source} onChange={set('source')} style={inputStyle}>
                <option value="">Select source</option>
                {SOURCES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            {/* Birthday */}
            <div>
              <label style={labelStyle}>Birthday (optional)</label>
              <input type="date" value={form.birthday} onChange={set('birthday')} style={inputStyle} />
            </div>

            {/* Vehicles */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <label style={{ ...labelStyle, marginBottom: 0 }}>Vehicles</label>
                <motion.button type="button" whileTap={{ scale: 0.9 }} onClick={addVehicle} style={{ background: 'rgba(79,142,247,0.1)', color: '#4F8EF7', border: 'none', borderRadius: '8px', padding: '6px 12px', fontSize: '12px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Plus size={12} /> Add
                </motion.button>
              </div>

              {vehicles.map((v, i) => (
                <div key={i} style={{ background: '#1C1C1C', borderRadius: '14px', padding: '14px', marginBottom: '10px', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
                    {[{ field: 'year', placeholder: 'Year', flex: 1 }, { field: 'make', placeholder: 'Make', flex: 1.5 }, { field: 'model', placeholder: 'Model', flex: 1.5 }].map(f => (
                      <input key={f.field} value={v[f.field]} onChange={e => updateVehicle(i, f.field, e.target.value)} placeholder={f.placeholder} style={{ ...inputStyle, flex: f.flex, background: '#111' }} />
                    ))}
                  </div>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <select value={v.vehicleType} onChange={e => updateVehicle(i, 'vehicleType', e.target.value)} style={{ ...inputStyle, background: '#111', flex: 1 }}>
                      {VEHICLE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                    <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', maxWidth: '120px' }}>
                      {COLORS.map(color => (
                        <div key={color} onClick={() => updateVehicle(i, 'color', color)} style={{ width: '18px', height: '18px', borderRadius: '50%', background: color, cursor: 'pointer', border: v.color === color ? '2px solid white' : '1px solid rgba(255,255,255,0.2)' }} />
                      ))}
                    </div>
                    <motion.button type="button" whileTap={{ scale: 0.9 }} onClick={() => removeVehicle(i)} style={{ background: 'rgba(239,68,68,0.1)', color: '#EF4444', border: 'none', borderRadius: '8px', padding: '8px', cursor: 'pointer', flexShrink: 0 }}>
                      <Trash2 size={14} />
                    </motion.button>
                  </div>
                </div>
              ))}
            </div>

            {error && (
              <div style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '10px', padding: '12px', color: '#EF4444', fontSize: '14px' }}>
                {error}
              </div>
            )}

            <motion.button type="submit" disabled={saving} whileTap={{ scale: 0.97 }} style={{ background: saving ? '#1C2D4F' : '#4F8EF7', color: 'white', border: 'none', borderRadius: '14px', padding: '16px', fontSize: '16px', fontWeight: '600', cursor: saving ? 'not-allowed' : 'pointer' }}>
              {saving ? 'Saving...' : 'Add Client ✓'}
            </motion.button>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
